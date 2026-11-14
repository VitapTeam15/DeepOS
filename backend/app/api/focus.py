from fastapi import APIRouter, Request
from app.models.schemas import FocusModeState, FocusModeUpdate

router = APIRouter(prefix="/api/focus", tags=["Focus Mode"])

@router.get("/", response_model=FocusModeState)
async def get_focus_state(request: Request):
    return request.app.state.focus_engine.get_state()

@router.post("/", response_model=FocusModeState)
async def update_focus_state(request: Request, update: FocusModeUpdate):
    request.app.state.focus_engine.set_state(update.enabled, update.level)
    return request.app.state.focus_engine.get_state()
