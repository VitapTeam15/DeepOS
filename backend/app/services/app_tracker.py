import asyncio
import psutil
import uuid
from datetime import datetime
import win32gui
import win32process
from app.config import settings
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class AppTracker:
    def __init__(self, on_switch_callback=None):
        self.running = False
        self.task = None
        self.session_id = str(uuid.uuid4())
        self.current_app_id = None
        self.last_app_name = None
        self.on_switch_callback = on_switch_callback

    def set_on_switch_callback(self, callback):
        self.on_switch_callback = callback

    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()

    def get_active_window_process_info(self):
        try:
            hwnd = win32gui.GetForegroundWindow()
            if hwnd == 0:
                return None, None
            
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            if pid <= 0:
                return None, None
            
            proc = psutil.Process(pid)
            name = proc.name()
            exe_path = None
            try:
                exe_path = proc.exe()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            
            if name.lower() == 'applicationframehost.exe':
                for child in proc.children(recursive=True):
                    child_name = child.name()
                    try:
                        child_exe = child.exe()
                    except Exception:
                        child_exe = None
                    return child_name, child_exe
                    
            return name, exe_path
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return None, None
        except Exception:
            return None, None

    def get_active_window_process_name(self):
        name, _ = self.get_active_window_process_info()
        return name

    async def _loop(self):
        while self.running:
            try:
                app_name, exe_path = self.get_active_window_process_info()
                
                if app_name and app_name.lower() not in ['lockapp.exe', 'explorer.exe', 'python.exe', 'cmd.exe', 'powershell.exe']:
                    if app_name != self.last_app_name:
                        await self._record_app_switch(app_name, exe_path)
                        self.last_app_name = app_name
                        if self.on_switch_callback:
                            try:
                                if asyncio.iscoroutinefunction(self.on_switch_callback):
                                    await self.on_switch_callback(app_name)
                                else:
                                    self.on_switch_callback(app_name)
                            except Exception as cb_err:
                                logger.debug(f"[AppTracker] on_switch_callback error: {cb_err}")
            except Exception as e:
                logger.error(f"AppTracker error: {e}")
            await asyncio.sleep(settings.MONITORING_INTERVAL_APP)

    async def _record_app_switch(self, app_name: str, exe_path: str = None):
        now = datetime.now()
        async with get_db() as db:
            cursor = await db.execute("SELECT id, executable FROM applications WHERE name = ?", (app_name,))
            row = await cursor.fetchone()
            
            if row:
                app_id = row['id']
                existing_exe = row['executable']
                # If we now have a full path and existing was just the name or null, update it
                if exe_path and (not existing_exe or existing_exe == app_name):
                    await db.execute(
                        "UPDATE applications SET last_seen = CURRENT_TIMESTAMP, launch_count = launch_count + 1, executable = ? WHERE id = ?",
                        (exe_path, app_id)
                    )
                else:
                    await db.execute(
                        "UPDATE applications SET last_seen = CURRENT_TIMESTAMP, launch_count = launch_count + 1 WHERE id = ?",
                        (app_id,)
                    )
            else:
                cursor = await db.execute(
                    "INSERT INTO applications (name, executable) VALUES (?, ?)",
                    (app_name, exe_path or app_name)
                )
                app_id = cursor.lastrowid
                
            await db.execute(
                "INSERT INTO application_events (application_id, hour, day_of_week, previous_application_id, session_id) VALUES (?, ?, ?, ?, ?)",
                (app_id, now.hour, now.weekday(), self.current_app_id, self.session_id)
            )
            await db.commit()
            self.current_app_id = app_id
