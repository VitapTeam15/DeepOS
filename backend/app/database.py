import aiosqlite
import os
import logging
from contextlib import asynccontextmanager
from app.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def get_db():
    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
    db = await aiosqlite.connect(settings.DB_PATH, timeout=15.0)
    try:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA busy_timeout=15000")
        yield db
    finally:
        await db.close()

async def init_db():
    async with get_db() as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS applications(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT NOT NULL, 
                executable TEXT, 
                category TEXT DEFAULT 'unknown', 
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                launch_count INTEGER DEFAULT 0, 
                is_demo BOOLEAN DEFAULT 0,
                UNIQUE(name)
            );
            CREATE TABLE IF NOT EXISTS application_events(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                application_id INTEGER NOT NULL, 
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                hour INTEGER NOT NULL, 
                day_of_week INTEGER NOT NULL, 
                previous_application_id INTEGER, 
                session_id TEXT, 
                is_demo BOOLEAN DEFAULT 0,
                FOREIGN KEY(application_id) REFERENCES applications(id), 
                FOREIGN KEY(previous_application_id) REFERENCES applications(id)
            );
            CREATE TABLE IF NOT EXISTS system_metrics(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                cpu_percent REAL, 
                memory_percent REAL, 
                memory_used_gb REAL, 
                memory_total_gb REAL, 
                disk_percent REAL, 
                disk_read_mb REAL, 
                disk_write_mb REAL, 
                process_count INTEGER, 
                boot_time REAL,
                is_demo BOOLEAN DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS process_snapshots(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                pid INTEGER, 
                name TEXT, 
                cpu_percent REAL, 
                memory_percent REAL, 
                memory_mb REAL, 
                status TEXT, 
                username TEXT,
                is_demo BOOLEAN DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS recommendations(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                type TEXT NOT NULL, 
                message TEXT NOT NULL, 
                severity TEXT NOT NULL DEFAULT 'info', 
                confidence REAL DEFAULT 0.0, 
                reason TEXT, 
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                expiration TIMESTAMP, 
                shown INTEGER DEFAULT 0, 
                user_action TEXT, 
                target_process TEXT, 
                target_app TEXT,
                is_demo BOOLEAN DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS settings(
                key TEXT PRIMARY KEY, 
                value TEXT, 
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS hourly_aggregates(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                date TEXT NOT NULL, 
                hour INTEGER NOT NULL, 
                avg_cpu REAL, 
                avg_memory REAL, 
                max_cpu REAL, 
                max_memory REAL, 
                avg_disk REAL, 
                sample_count INTEGER DEFAULT 0, 
                is_demo BOOLEAN DEFAULT 0,
                UNIQUE(date, hour)
            );
            CREATE INDEX IF NOT EXISTS idx_app_events_timestamp ON application_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_app_events_app_id ON application_events(application_id);
            CREATE INDEX IF NOT EXISTS idx_app_events_hour ON application_events(hour);
            CREATE INDEX IF NOT EXISTS idx_app_events_day ON application_events(day_of_week);
            CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
            CREATE INDEX IF NOT EXISTS idx_process_snapshots_timestamp ON process_snapshots(timestamp);
            CREATE INDEX IF NOT EXISTS idx_process_snapshots_name ON process_snapshots(name);
            CREATE INDEX IF NOT EXISTS idx_recommendations_timestamp ON recommendations(timestamp);
            CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
        """)
        
        # Migration for existing databases
        tables_to_migrate = [
            "applications", "application_events", "system_metrics", 
            "process_snapshots", "recommendations", "hourly_aggregates"
        ]
        
        for table in tables_to_migrate:
            try:
                # Check if column exists
                cursor = await db.execute(f"PRAGMA table_info({table})")
                columns = [row['name'] for row in await cursor.fetchall()]
                if 'is_demo' not in columns:
                    logger.info(f"Migrating table {table}: adding is_demo column.")
                    await db.execute(f"ALTER TABLE {table} ADD COLUMN is_demo BOOLEAN DEFAULT 0")
            except Exception as e:
                logger.error(f"Error migrating table {table}: {e}")
                
        await db.commit()
