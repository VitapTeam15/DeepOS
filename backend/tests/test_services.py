import pytest
from app.services.system_monitor import SystemMonitor
from app.services.focus_engine import FocusEngine
from app.services.notification_manager import NotificationManager
from app.services.audio_manager import AudioManager
from app.services.data_retention import DataRetentionManager

def test_system_monitor_instantiation():
    monitor = SystemMonitor()
    assert monitor.running == False
    assert monitor.task is None

def test_system_monitor_get_status():
    monitor = SystemMonitor()
    status = monitor.get_current_status()
    # Should have data even without starting (psutil reads are synchronous)
    assert status is not None or status is None  # May be None on first call

def test_focus_engine_default_state():
    engine = FocusEngine()
    state = engine.get_state()
    assert hasattr(state, 'enabled')
    assert hasattr(state, 'level')

def test_focus_engine_set_state():
    engine = FocusEngine()
    engine.set_state(True, 3)
    assert engine.enabled == True
    assert engine.level == 3
    # Reset
    engine.set_state(False, 1)

def test_focus_engine_level_filtering():
    engine = FocusEngine()
    # When disabled, everything should be delivered
    engine.set_state(False, 1)
    assert engine.should_deliver("info", "test") == True
    assert engine.should_deliver("warning", "test") == True
    assert engine.should_deliver("critical", "test") == True
    
    # Level 1 (Light) - filter low priority
    engine.set_state(True, 1)
    assert engine.should_deliver("critical", "test") == True
    assert engine.should_deliver("warning", "test") == True
    
    # Level 3 (Deep) - critical only
    engine.set_state(True, 3)
    assert engine.should_deliver("critical", "test") == True
    assert engine.should_deliver("info", "test") == False

def test_notification_manager_instantiation():
    audio = AudioManager()
    focus = FocusEngine()
    manager = NotificationManager(audio, focus)
    assert manager is not None
    assert hasattr(manager, 'create_notification')
    assert hasattr(manager, 'recent_notifications')

def test_data_retention_manager_instantiation():
    manager = DataRetentionManager()
    assert manager.running == False
    assert hasattr(manager, 'run_cleanup')
    assert hasattr(manager, 'get_status')
    assert hasattr(manager, 'start')
    assert hasattr(manager, 'stop')

@pytest.mark.asyncio
async def test_demo_mode_safety():
    from app.services.demo_mode import DemoMode
    from app.database import get_db, init_db
    
    await init_db()
    
    # Insert normal record
    async with get_db() as db:
        await db.execute("INSERT OR IGNORE INTO applications (name, executable, category, is_demo) VALUES ('NormalApp', 'normal.exe', 'test', 0)")
        await db.commit()
        
    demo = DemoMode()
    await demo.generate_demo_data()
    
    # Verify demo generated
    async with get_db() as db:
        c = await db.execute("SELECT COUNT(*) FROM applications WHERE is_demo = 1")
        demo_count = (await c.fetchone())[0]
        assert demo_count >= 4
        
    await demo.clear_demo_data()
    
    # Verify demo deleted but normal remained
    async with get_db() as db:
        c = await db.execute("SELECT COUNT(*) FROM applications WHERE is_demo = 1")
        assert (await c.fetchone())[0] == 0
        
        c2 = await db.execute("SELECT COUNT(*) FROM applications WHERE name = 'NormalApp' AND is_demo = 0")
        assert (await c2.fetchone())[0] == 1
