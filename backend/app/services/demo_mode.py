import logging
import random
from datetime import datetime, timedelta
from app.database import get_db

logger = logging.getLogger(__name__)

class DemoMode:
    def __init__(self, pred_engine=None):
        self.pred_engine = pred_engine
        self.apps = [
            {"name": "Visual Studio Code", "executable": "Code.exe", "category": "development"},
            {"name": "Google Chrome", "executable": "chrome.exe", "category": "browser"},
            {"name": "Slack", "executable": "slack.exe", "category": "communication"},
            {"name": "Spotify", "executable": "spotify.exe", "category": "media"},
            {"name": "Terminal", "executable": "cmd.exe", "category": "system"}
        ]

    def set_pred_engine(self, engine):
        self.pred_engine = engine

    async def generate_demo_data(self):
        logger.info("[DEMO_MODE] Generating synthetic demo workflow data...")
        await self.clear_demo_data()
        
        async with get_db() as db:
            # Insert demo apps
            app_ids = {}
            for app in self.apps:
                cursor = await db.execute("SELECT id FROM applications WHERE name = ?", (app["name"],))
                row = await cursor.fetchone()
                if row:
                    app_ids[app["name"]] = row[0]
                    await db.execute(
                        "UPDATE applications SET is_demo = 1, executable = ?, category = ? WHERE id = ?",
                        (app["executable"], app["category"], row[0])
                    )
                else:
                    cursor = await db.execute(
                        "INSERT INTO applications (name, executable, category, is_demo, launch_count) VALUES (?, ?, ?, 1, ?)",
                        (app["name"], app["executable"], app["category"], random.randint(15, 60))
                    )
                    app_ids[app["name"]] = cursor.lastrowid
            
            # Insert 24 hours of system metrics
            now = datetime.now()
            for i in range(24 * 60):
                timestamp = now - timedelta(minutes=i)
                cpu = random.uniform(10.0, 75.0)
                mem = random.uniform(30.0, 85.0)
                await db.execute(
                    "INSERT INTO system_metrics (timestamp, cpu_percent, memory_percent, is_demo) VALUES (?, ?, ?, 1)",
                    (timestamp, cpu, mem)
                )
            
            # Insert realistic workflow sequences with valid previous_application_id!
            # Typical workflows:
            # Workflow 1: VS Code -> Terminal -> Google Chrome -> VS Code
            # Workflow 2: Google Chrome -> Slack -> Google Chrome
            # Workflow 3: Spotify -> Google Chrome -> VS Code
            workflows = [
                ["Visual Studio Code", "Terminal", "Google Chrome", "Visual Studio Code"],
                ["Google Chrome", "Slack", "Google Chrome"],
                ["Spotify", "Google Chrome", "Visual Studio Code", "Terminal"],
                ["Visual Studio Code", "Google Chrome", "Visual Studio Code"]
            ]
            
            prev_id = None
            base_time = now - timedelta(days=5)
            total_events = 0

            for _ in range(35):
                wf = random.choice(workflows)
                for app_name in wf:
                    base_time += timedelta(minutes=random.randint(5, 45))
                    app_id = app_ids[app_name]
                    hour = base_time.hour
                    day_of_week = base_time.weekday()
                    
                    await db.execute(
                        "INSERT INTO application_events (application_id, timestamp, hour, day_of_week, previous_application_id, is_demo) VALUES (?, ?, ?, ?, ?, 1)",
                        (app_id, base_time.strftime("%Y-%m-%d %H:%M:%S"), hour, day_of_week, prev_id)
                    )
                    prev_id = app_id
                    total_events += 1

            # Insert demo recommendations
            await db.execute(
                "INSERT INTO recommendations (type, message, severity, confidence, reason, is_demo, target_app) VALUES (?, ?, ?, ?, ?, 1, ?)",
                ("APP_RECOMMENDATION", "You usually open Terminal after Visual Studio Code — based on historical sequence.", "info", 0.91, "frequently follows Visual Studio Code", "Terminal")
            )
            await db.execute(
                "INSERT INTO recommendations (type, message, severity, confidence, reason, is_demo, target_process) VALUES (?, ?, ?, ?, ?, 1, ?)",
                ("PROCESS_RECOMMENDATION", "Process chrome.exe is consuming high memory (82%). Consider closing inactive tabs.", "warning", 0.88, "High memory utilization", "chrome.exe")
            )

            await db.commit()
            
        logger.info(f"[DEMO_MODE] Generated {total_events} sequential demo events across 5 applications.")

        # Trigger model training on the freshly generated demo data if engine is attached
        if self.pred_engine:
            try:
                logger.info("[DEMO_MODE] Automatically training LSTM model on demo sequences...")
                await self.pred_engine.train_model(include_demo=True)
            except Exception as e:
                logger.error(f"[DEMO_MODE] Error training model on demo data: {e}")
        
    async def clear_demo_data(self):
        logger.info("[DEMO_MODE] Clearing demo data...")
        async with get_db() as db:
            await db.execute("DELETE FROM applications WHERE is_demo = 1")
            await db.execute("DELETE FROM application_events WHERE is_demo = 1")
            await db.execute("DELETE FROM system_metrics WHERE is_demo = 1")
            await db.execute("DELETE FROM process_snapshots WHERE is_demo = 1")
            await db.execute("DELETE FROM recommendations WHERE is_demo = 1")
            await db.execute("DELETE FROM hourly_aggregates WHERE is_demo = 1")
            await db.commit()
        logger.info("[DEMO_MODE] Demo data cleared.")
