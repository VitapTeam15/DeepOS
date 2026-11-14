from fastapi import APIRouter, Request
from app.models.schemas import DatabaseStatus

router = APIRouter(prefix="/api/database", tags=["Database"])

@router.get("/status", response_model=DatabaseStatus)
async def get_db_status(request: Request):
    return await request.app.state.data_retention.get_status()

@router.post("/cleanup")
async def trigger_cleanup(request: Request):
    await request.app.state.data_retention.run_cleanup()
    return {"success": True}
