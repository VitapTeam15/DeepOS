import asyncio
import psutil
from app.config import settings
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class ProcessMonitor:
    def __init__(self):
        self.running = False
        self.task = None

    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        if self.task: self.task.cancel()

    def get_processes(self):
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info', 'status', 'username']):
            try:
                info = proc.info
                processes.append({
                    "pid": info['pid'],
                    "name": info['name'],
                    "cpu_percent": info['cpu_percent'],
                    "memory_percent": info['memory_percent'],
                    "memory_mb": info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0,
                    "status": info['status'],
                    "username": info['username']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        return processes

    def is_protected(self, name):
        if not name: return False
        return name.lower() in [p.lower() for p in settings.PROTECTED_PROCESSES]

    def terminate_process(self, pid, confirm=False):
        if not confirm:
            return False, "Explicit user confirmation required"
        try:
            p = psutil.Process(pid)
            if self.is_protected(p.name()):
                return False, "Protected process"
            p.terminate()
            try:
                p.wait(timeout=5)
            except psutil.TimeoutExpired:
                p.kill()
            return True, "Terminated successfully"
        except psutil.NoSuchProcess:
            return False, "Process not found"
        except psutil.AccessDenied:
            return False, "Access denied"
        except Exception as e:
            return False, str(e)

    def get_top_cpu(self, n=5):
        procs = self.get_processes()
        return sorted(procs, key=lambda x: x.get('cpu_percent', 0) or 0, reverse=True)[:n]

    def get_top_memory(self, n=5):
        procs = self.get_processes()
        return sorted(procs, key=lambda x: x.get('memory_mb', 0) or 0, reverse=True)[:n]

    async def _loop(self):
        while self.running:
            try:
                procs = self.get_processes()
                async with get_db() as db:
                    for p in procs:
                        await db.execute(
                            "INSERT INTO process_snapshots (pid, name, cpu_percent, memory_percent, memory_mb, status, username) VALUES (?,?,?,?,?,?,?)",
                            (p['pid'], p['name'], p['cpu_percent'], p['memory_percent'], p['memory_mb'], p['status'], p['username'])
                        )
                    await db.commit()
            except Exception as e:
                logger.error(f"Process snapshot error: {e}")
            await asyncio.sleep(settings.PROCESS_SNAPSHOT_INTERVAL)
