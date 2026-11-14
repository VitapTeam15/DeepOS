from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    from app.services.system_monitor import SystemMonitor
    from app.services.process_monitor import ProcessMonitor
    from app.services.app_tracker import AppTracker
    from app.services.prediction_engine import PredictionEngine
    from app.services.recommendation_engine import RecommendationEngine
    from app.services.notification_manager import NotificationManager
    from app.services.audio_manager import AudioManager
    from app.services.focus_engine import FocusEngine
    from app.services.data_retention import DataRetentionManager
    
    focus_engine = FocusEngine()
    pred_engine = PredictionEngine(focus_engine=focus_engine)
    app_tracker = AppTracker(on_switch_callback=pred_engine.on_app_switch)
    sys_mon = SystemMonitor()
    proc_mon = ProcessMonitor()
    audio_mgr = AudioManager()
    notif_mgr = NotificationManager(audio_mgr, focus_engine)
    rec_engine = RecommendationEngine(sys_mon, proc_mon, notif_mgr)
    data_retention = DataRetentionManager()
    
    app.state.sys_mon = sys_mon
    app.state.proc_mon = proc_mon
    app.state.app_tracker = app_tracker
    app.state.pred_engine = pred_engine
    app.state.focus_engine = focus_engine
    app.state.audio_mgr = audio_mgr
    app.state.notif_mgr = notif_mgr
    app.state.rec_engine = rec_engine
    app.state.data_retention = data_retention
    
    audio_mgr.start()
    await sys_mon.start()
    await proc_mon.start()
    await app_tracker.start()
    await rec_engine.start()
    await data_retention.start()
    
    yield
    
    await data_retention.stop()
    await rec_engine.stop()
    await app_tracker.stop()
    await proc_mon.stop()
    await sys_mon.stop()
    audio_mgr.stop()

app = FastAPI(title='Deep OS API', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import system, processes, applications, prediction, recommendations, focus, settings, database_api, websocket

app.include_router(system.router)
app.include_router(processes.router)
app.include_router(applications.router)
app.include_router(prediction.router)
app.include_router(recommendations.router)
app.include_router(focus.router)
app.include_router(settings.router)
app.include_router(database_api.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    return {"name": "Deep OS API", "version": "1.0.0", "status": "running"}

if __name__ == "__main__":
    print("HELLO FROM MAIN")
    import uvicorn
    import multiprocessing
    multiprocessing.freeze_support()
    print("STARTING UVICORN")
    uvicorn.run(app, host="127.0.0.1", port=8000)
