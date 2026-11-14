from fastapi import APIRouter, Request, HTTPException
from app.models.schemas import PredictionResponse, ModelMetricsResponse
from typing import Dict, Any

router = APIRouter(prefix="/api/prediction", tags=["Prediction"])

@router.get("/", response_model=PredictionResponse)
async def get_prediction(request: Request):
    """
    Returns next application prediction computed using the Deep OS
    Hybrid LSTM Sequence Model with statistical fallback.
    """
    engine = getattr(request.app.state, "pred_engine", None)
    if not engine:
        raise HTTPException(status_code=503, detail="Prediction engine initializing")
    
    tracker = getattr(request.app.state, "app_tracker", None)
    active_app = tracker.get_active_window_process_name() if tracker else None
    return await engine.get_prediction(active_app)

@router.get("/model", response_model=ModelMetricsResponse)
async def get_model_status(request: Request):
    """
    Returns authentic training metadata, validation loss, Top-1 accuracy,
    Top-3 accuracy, and architecture details for the LSTM model.
    """
    engine = getattr(request.app.state, "pred_engine", None)
    if not engine:
        raise HTTPException(status_code=503, detail="Prediction engine initializing")
    return engine.get_model_metrics()

@router.post("/train")
async def trigger_model_training(request: Request) -> Dict[str, Any]:
    """
    Manually triggers LSTM neural network training on historical activity events.
    """
    engine = getattr(request.app.state, "pred_engine", None)
    if not engine:
        raise HTTPException(status_code=503, detail="Prediction engine initializing")
    
    report = await engine.train_model()
    return {
        "success": report.get("status") == "TRAINED",
        "report": report
    }
