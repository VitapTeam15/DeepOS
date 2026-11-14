import shutil
import subprocess
import os
import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from app.models.schemas import ApplicationInfo, ApplicationHistory
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("/", response_model=List[ApplicationInfo])
async def get_applications():
    async with get_db() as db:
        c = await db.execute("SELECT * FROM applications ORDER BY launch_count DESC")
        return [ApplicationInfo(**dict(r)) for r in await c.fetchall()]

@router.get("/history", response_model=ApplicationHistory)
async def get_history():
    async with get_db() as db:
        c1 = await db.execute("SELECT * FROM applications ORDER BY launch_count DESC LIMIT 10")
        most_used = [ApplicationInfo(**dict(r)) for r in await c1.fetchall()]
        
        c2 = await db.execute("SELECT * FROM applications ORDER BY last_seen DESC LIMIT 10")
        recent = [ApplicationInfo(**dict(r)) for r in await c2.fetchall()]
        
        c3 = await db.execute("""
            SELECT 
                a1.name as from_app, 
                a2.name as to_app, 
                COUNT(*) as count
            FROM application_events e
            JOIN applications a1 ON e.previous_application_id = a1.id
            JOIN applications a2 ON e.application_id = a2.id
            WHERE e.previous_application_id IS NOT NULL
            GROUP BY a1.id, a2.id
            ORDER BY count DESC
            LIMIT 10
        """)
        sequences = [dict(r) for r in await c3.fetchall()]
        
        return ApplicationHistory(most_used=most_used, recent=recent, sequences=sequences)

@router.get("/{id}", response_model=ApplicationInfo)
async def get_application(id: int):
    async with get_db() as db:
        c = await db.execute("SELECT * FROM applications WHERE id = ?", (id,))
        row = await c.fetchone()
        if row: return ApplicationInfo(**dict(row))
        return None


# ─── Safe Application Launcher ────────────────────────────────────────────────

class LaunchRequest(BaseModel):
    app_name: str


def _resolve_executable(executable: Optional[str], app_name: str) -> Optional[str]:
    """
    Attempt to resolve a launchable path for the given executable / app name.
    Resolution order:
      1. Direct path check if executable is already an existing absolute path
      2. Windows Registry 'App Paths' (finds Chrome, Edge, Code, etc. even if closed and not in PATH)
      3. shutil.which(candidate) — searches system PATH
      4. Common Windows installation directories
      5. Scan running processes via psutil for a matching exe path
    Returns the resolved path string, or None if unresolvable.
    """
    import psutil

    # 1. Direct path check
    if executable and os.path.isabs(executable) and os.path.isfile(executable):
        logger.info(f"[LAUNCH] Direct executable path verified: {executable}")
        return executable

    candidates = []
    if executable:
        candidates.append(executable)
    if app_name and app_name not in candidates:
        candidates.append(app_name)

    # Ensure .exe extension is tried on Windows
    win_candidates = []
    for c in candidates:
        win_candidates.append(c)
        if not c.lower().endswith(".exe"):
            win_candidates.append(c + ".exe")

    # 2. Windows Registry App Paths
    if os.name == "nt":
        try:
            import winreg
            for root in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
                for candidate in win_candidates:
                    try:
                        with winreg.OpenKey(root, rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{candidate}") as key:
                            val, _ = winreg.QueryValueEx(key, "")
                            if val and os.path.isfile(val):
                                logger.info(f"[LAUNCH] winreg App Paths match: '{candidate}' → '{val}'")
                                return val
                    except OSError:
                        pass
        except Exception as reg_err:
            logger.debug(f"[LAUNCH] Registry App Paths scan exception: {reg_err}")

    # 3. Search PATH via shutil.which
    for candidate in win_candidates:
        resolved = shutil.which(candidate)
        if resolved:
            logger.info(f"[LAUNCH] shutil.which('{candidate}') → {resolved}")
            return resolved

    # 4. Common known directories on Windows
    if os.name == "nt":
        prog_roots = [
            os.environ.get("ProgramFiles", "C:\\Program Files"),
            os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
            os.environ.get("LocalAppData", ""),
            os.environ.get("SystemRoot", "C:\\Windows")
        ]
        for root in prog_roots:
            if not root or not os.path.exists(root):
                continue
            for candidate in win_candidates:
                # Direct check under root / system32
                direct = os.path.join(root, candidate)
                if os.path.isfile(direct):
                    return direct
                sys32 = os.path.join(root, "System32", candidate)
                if os.path.isfile(sys32):
                    return sys32

    # 5. Fallback: scan running processes for a matching exe path
    logger.info("[LAUNCH] Checking running processes for path")
    try:
        for proc in psutil.process_iter(["name", "exe"]):
            try:
                proc_name = (proc.info.get("name") or "").lower()
                proc_exe  = proc.info.get("exe") or ""
                for candidate in win_candidates:
                    if proc_name == candidate.lower() and proc_exe and os.path.isfile(proc_exe):
                        logger.info(f"[LAUNCH] Found running process match: {proc_exe}")
                        return proc_exe
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except Exception as e:
        logger.warning(f"[LAUNCH] psutil scan error: {e}")

    logger.warning(f"[LAUNCH] Could not resolve executable for '{app_name}' (tried: {win_candidates})")
    return None

resolve_executable_path = _resolve_executable


@router.post("/launch")
async def launch_application(req: LaunchRequest):
    """
    Safe application launcher.

    Steps:
      1. Validate app_name is known in the Deep OS applications table.
      2. Resolve the executable to a launchable path via shutil.which / psutil.
      3. Launch without shell=True.
      4. Return structured result with status, name and resolved path.
    """
    app_name = req.app_name.strip()
    logger.info(f"[LAUNCH] Launch requested for: '{app_name}'")

    if not app_name:
        raise HTTPException(status_code=422, detail="app_name must not be empty")

    # ── Step 1: DB lookup ──────────────────────────────────────────────────────
    db_name = app_name
    db_exec = app_name
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT name, executable FROM applications "
            "WHERE LOWER(name) = LOWER(?) OR LOWER(executable) = LOWER(?) LIMIT 1",
            (app_name, app_name)
        )
        db_row = await cursor.fetchone()

    if db_row:
        db_name = db_row["name"]
        db_exec = db_row["executable"] or db_row["name"]
        logger.info(f"[LAUNCH] DB record found — name='{db_name}' executable='{db_exec}'")
    else:
        logger.warning(
            f"[LAUNCH] '{app_name}' not found in applications DB — attempting resolution anyway"
        )

    # ── Step 2: Resolve executable path ───────────────────────────────────────
    resolved = _resolve_executable(db_exec, app_name)

    if not resolved:
        logger.error(f"[LAUNCH] FAILED — could not resolve executable for '{app_name}'")
        raise HTTPException(
            status_code=422,
            detail=(
                f"Cannot resolve a launchable executable for '{app_name}'. "
                "The application may have been uninstalled or is not in PATH."
            )
        )

    logger.info(f"[LAUNCH] Resolved path: {resolved}")

    # ── Step 3: Launch safely — no shell=True ─────────────────────────────────
    try:
        logger.info(f"[LAUNCH] Attempting Popen(['{resolved}'])")
        popen_kwargs = {}
        if os.name == "nt":
            popen_kwargs["creationflags"] = (
                subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
            )
        subprocess.Popen([resolved], **popen_kwargs)
        logger.info(f"[LAUNCH] SUCCESS — launched '{resolved}'")
        return {
            "status": "success",
            "launched": db_name,
            "path": resolved,
            "message": f"Launched {db_name}"
        }
    except FileNotFoundError:
        logger.error(f"[LAUNCH] FileNotFoundError for path: {resolved}")
        raise HTTPException(
            status_code=500,
            detail=f"Executable not found at resolved path: {resolved}"
        )
    except PermissionError as e:
        logger.error(f"[LAUNCH] PermissionError launching '{resolved}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Permission denied launching '{db_name}': {e}"
        )
    except Exception as e:
        logger.exception(f"[LAUNCH] Unexpected error launching '{resolved}': {e}")
        raise HTTPException(status_code=500, detail=f"Launch failed: {e}")

