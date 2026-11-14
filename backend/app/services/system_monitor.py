import asyncio
import psutil
from datetime import datetime
from app.config import settings
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class SystemMonitor:
    def __init__(self):
        self.running = False
        self.task = None
        self.pressure_window = []
        self.batch = []

    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self._loop())
        logger.info("SystemMonitor started")

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
        logger.info("SystemMonitor stopped")

    def get_current_status(self):
        if not self.pressure_window:
            return None
        return self.pressure_window[-1]

    def get_pressure_status(self):
        if len(self.pressure_window) < settings.PRESSURE_WINDOW_SIZE:
            return {"cpu_pressure": False, "ram_pressure": False, "disk_pressure": False}
        
        cpu_avg = sum(s["cpu_percent"] for s in self.pressure_window) / len(self.pressure_window)
        ram_avg = sum(s["memory_percent"] for s in self.pressure_window) / len(self.pressure_window)
        disk_avg = sum(s["disk_percent"] for s in self.pressure_window) / len(self.pressure_window)
        
        return {
            "cpu_pressure": cpu_avg > settings.CPU_THRESHOLD_WARNING,
            "ram_pressure": ram_avg > settings.RAM_THRESHOLD_WARNING,
            "disk_pressure": disk_avg > settings.DISK_THRESHOLD_WARNING
        }

    async def _loop(self):
        psutil.cpu_percent(interval=None) # Initialize
        while self.running:
            try:
                mem = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                disk_io = psutil.disk_io_counters()
                status = {
                    "cpu_percent": psutil.cpu_percent(interval=None),
                    "memory_percent": mem.percent,
                    "memory_used_gb": mem.used / (1024**3),
                    "memory_total_gb": mem.total / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_read_mb": disk_io.read_bytes / (1024**2) if disk_io else 0,
                    "disk_write_mb": disk_io.write_bytes / (1024**2) if disk_io else 0,
                    "process_count": len(psutil.pids()),
                    "boot_time": psutil.boot_time(),
                    "timestamp": datetime.now().isoformat()
                }
                
                self.pressure_window.append(status)
                if len(self.pressure_window) > settings.PRESSURE_WINDOW_SIZE:
                    self.pressure_window.pop(0)

                self.batch.append(status)
                if len(self.batch) >= 5:
                    await self._flush_batch()

            except Exception as e:
                logger.error(f"Error in SystemMonitor: {e}")
            
            await asyncio.sleep(settings.MONITORING_INTERVAL_SYSTEM)

    async def _flush_batch(self):
        if not self.batch: return
        async with get_db() as db:
            for s in self.batch:
                await db.execute(
                    "INSERT INTO system_metrics (cpu_percent, memory_percent, memory_used_gb, memory_total_gb, disk_percent, disk_read_mb, disk_write_mb, process_count, boot_time) VALUES (?,?,?,?,?,?,?,?,?)",
                    (s['cpu_percent'], s['memory_percent'], s['memory_used_gb'], s['memory_total_gb'], s['disk_percent'], s['disk_read_mb'], s['disk_write_mb'], s['process_count'], s['boot_time'])
                )
            await db.commit()
        self.batch = []
