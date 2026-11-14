import asyncio
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    def __init__(self, sys_mon, proc_mon, notif_mgr):
        self.sys_mon = sys_mon
        self.proc_mon = proc_mon
        self.notif = notif_mgr
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
                await self.evaluate()
            except Exception as e:
                logger.error(f"Recommendation evaluate error: {e}")
            await asyncio.sleep(60)

    async def evaluate(self):
        pressure = self.sys_mon.get_pressure_status()
        if pressure.get('cpu_pressure'):
            top = self.proc_mon.get_top_cpu(1)
            if top and not self.proc_mon.is_protected(top[0]['name']):
                await self.create_recommendation(
                    "PROCESS_RECOMMENDATION",
                    f"Process {top[0]['name']} is using high CPU.",
                    "warning",
                    0.9,
                    "High CPU usage detected",
                    target_process=top[0]['name']
                )
                
        if pressure.get('ram_pressure'):
            top = self.proc_mon.get_top_memory(1)
            if top and not self.proc_mon.is_protected(top[0]['name']):
                await self.create_recommendation(
                    "PROCESS_RECOMMENDATION",
                    f"Process {top[0]['name']} is using high Memory.",
                    "warning",
                    0.9,
                    "High RAM usage detected",
                    target_process=top[0]['name']
                )

    async def create_recommendation(self, rec_type, message, severity, confidence, reason, expiration=None, target_process=None, target_app=None):
        async with get_db() as db:
            await db.execute(
                "INSERT INTO recommendations (type, message, severity, confidence, reason, expiration, target_process, target_app) VALUES (?,?,?,?,?,?,?,?)",
                (rec_type, message, severity, confidence, reason, expiration, target_process, target_app)
            )
            await db.commit()
            
        await self.notif.create_notification(rec_type, message, severity, target=target_process or target_app)

    async def create_app_recommendation(self, app_name: str, confidence: float, reason: str):
        """Create an APP_RECOMMENDATION for the predicted next application."""
        logger.info(f"[REC_ENGINE] Creating app recommendation for '{app_name}' (confidence={confidence:.2f})")
        friendly = app_name.replace(".exe", "").capitalize()
        message = f"You usually open {friendly} next — {reason}."
        async with get_db() as db:
            await db.execute(
                "INSERT INTO recommendations (type, message, severity, confidence, reason, target_app) VALUES (?,?,?,?,?,?)",
                ("APP_RECOMMENDATION", message, "info", confidence, reason, app_name)
            )
            await db.commit()
        logger.info(f"[REC_ENGINE] APP_RECOMMENDATION saved for '{app_name}'")
        # Notify via push callback (includes actionApp so Electron can attach Open button)
        await self.notif.create_app_notification(app_name, message)

    async def get_active_recommendations(self):
        async with get_db() as db:
            c = await db.execute("SELECT * FROM recommendations WHERE shown = 0")
            return [dict(r) for r in await c.fetchall()]

    async def dismiss_recommendation(self, rec_id):
        async with get_db() as db:
            await db.execute("UPDATE recommendations SET shown = 1, user_action = 'dismiss' WHERE id = ?", (rec_id,))
            await db.commit()

    async def accept_recommendation(self, rec_id):
        async with get_db() as db:
            await db.execute("UPDATE recommendations SET shown = 1, user_action = 'accept' WHERE id = ?", (rec_id,))
            await db.commit()
