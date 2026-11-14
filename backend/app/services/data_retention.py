import asyncio
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class DataRetentionManager:
    def __init__(self):
        self.running = False
        self.task = None

    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        if self.task: self.task.cancel()

    async def _loop(self):
        while self.running:
            try:
                await self.run_cleanup()
            except Exception as e:
                logger.error(f"Data retention cleanup error: {e}")
            await asyncio.sleep(settings.CLEANUP_INTERVAL_HOURS * 3600)

    async def run_cleanup(self):
        now = datetime.now()
        metrics_cutoff = (now - timedelta(days=settings.RETENTION_METRICS_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
        snapshots_cutoff = (now - timedelta(days=settings.RETENTION_SNAPSHOTS_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
        events_cutoff = (now - timedelta(days=settings.RETENTION_EVENTS_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
        recs_cutoff = (now - timedelta(days=settings.RETENTION_RECOMMENDATIONS_DAYS)).strftime("%Y-%m-%d %H:%M:%S")

        async with get_db() as db:
            # Aggregate old metrics before deleting
            await db.execute("""
                INSERT OR IGNORE INTO hourly_aggregates (date, hour, avg_cpu, avg_memory, max_cpu, max_memory, avg_disk, sample_count, is_demo)
                SELECT 
                    date(timestamp) as date,
                    CAST(strftime('%H', timestamp) AS INTEGER) as hour,
                    AVG(cpu_percent),
                    AVG(memory_percent),
                    MAX(cpu_percent),
                    MAX(memory_percent),
                    AVG(disk_percent),
                    COUNT(*),
                    is_demo
                FROM system_metrics
                WHERE timestamp < ?
                GROUP BY date(timestamp), strftime('%H', timestamp), is_demo
            """, (metrics_cutoff,))
            
            # Delete old metrics
            await db.execute("DELETE FROM system_metrics WHERE timestamp < ?", (metrics_cutoff,))
            await db.execute("DELETE FROM process_snapshots WHERE timestamp < ?", (snapshots_cutoff,))
            await db.execute("DELETE FROM application_events WHERE timestamp < ?", (events_cutoff,))
            await db.execute("DELETE FROM recommendations WHERE timestamp < ?", (recs_cutoff,))
            
            await db.commit()
            
            # Simple vacuum simulation
            await db.execute("VACUUM")
            logger.info("Data cleanup complete")

    async def get_status(self):
        async with get_db() as db:
            c1 = await db.execute("SELECT COUNT(*) as c FROM system_metrics")
            r1 = await (c1).fetchone()
            c2 = await db.execute("SELECT COUNT(*) as c FROM process_snapshots")
            r2 = await (c2).fetchone()
            return {
                "db_size_mb": 0.0,
                "record_counts": {
                    "metrics": r1['c'] if r1 else 0,
                    "snapshots": r2['c'] if r2 else 0
                },
                "last_cleanup": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "last_vacuum": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
