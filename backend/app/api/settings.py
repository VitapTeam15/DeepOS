from fastapi import APIRouter, Request
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/")
async def get_settings():
    return {"settings": settings.model_dump()}

@router.post("/")
async def update_settings(new_settings: dict):
    for k, v in new_settings.items():
        if hasattr(settings, k):
            setattr(settings, k, v)
    settings.save_to_json()
    return {"settings": settings.model_dump()}

from fastapi import Request
@router.post("/test-audio")
async def test_audio(request: Request):
    if not settings.AUDIO_ENABLED:
        return {"success": False, "message": "Audio Recommendations are disabled."}
    
    audio_mgr = request.app.state.audio_mgr
    audio_mgr.speak("Deep OS audio recommendations are working.", force=True, is_test=True)
    return {"success": True, "message": "Audio test completed."}

from pydantic import BaseModel
class PredictionAlertRequest(BaseModel):
    message: str

@router.post("/speak-prediction")
async def speak_prediction(request: Request, payload: PredictionAlertRequest):
    if not settings.AUDIO_ENABLED:
        return {"success": False}
    
    audio_mgr = request.app.state.audio_mgr
    audio_mgr.speak(payload.message, force=True)
    return {"success": True}


# ─── Notification Test Endpoint ───────────────────────────────────────────────
# Fires a test notification through the SAME notification manager used by real
# system alerts. This lets you determine independently whether the notification
# stack (manager → Windows toast) works without waiting for the prediction engine.
@router.post("/test-notification")
async def test_notification(request: Request):
    import logging
    logger = logging.getLogger(__name__)
    logger.info("[NOTIFICATION] Manual test notification triggered via API")
    
    notif_mgr = request.app.state.notif_mgr
    # Use a unique type so cooldown doesn't block the test
    result = await notif_mgr.create_notification(
        "TEST_NOTIFICATION",
        "Deep OS notifications are working correctly.",
        "warning",
        target="test"
    )
    return {"success": result, "message": "Test notification dispatched." if result else "Notification was suppressed (check cooldown/settings)."}


# ─── Alert Cooldown Reset ──────────────────────────────────────────────────────
# Resets the in-memory last_alert_time on the PredictionEngine so the very next
# valid prediction can fire a notification without waiting for the cooldown to
# elapse naturally. Useful during testing and when the user wants an immediate
# notification after changing a setting.
@router.post("/reset-cooldown")
async def reset_cooldown(request: Request):
    import logging
    logger = logging.getLogger(__name__)
    logger.info("[Notification] Manual cooldown reset requested via API")

    pred_engine = getattr(request.app.state, "pred_engine", None)
    if pred_engine is None:
        logger.warning("[Notification] reset-cooldown: pred_engine not found on app.state")
        return {"success": False, "message": "Prediction engine not available — backend may still be starting."}

    old_time = pred_engine.last_alert_time
    pred_engine.last_alert_time = 0
    logger.info(f"[Notification] Cooldown reset: last_alert_time {old_time:.0f} → 0 (next valid prediction will trigger a notification)")
    return {"success": True, "message": "Alert cooldown reset. The next valid prediction will send a notification."}
