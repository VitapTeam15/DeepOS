from fastapi import APIRouter, Request
from typing import List
from app.models.schemas import RecommendationInfo

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/", response_model=List[RecommendationInfo])
async def get_recommendations(request: Request):
    recs = await request.app.state.rec_engine.get_active_recommendations()
    return [RecommendationInfo(**r) for r in recs]

@router.get("/history", response_model=List[RecommendationInfo])
async def get_recommendation_history(request: Request):
    from app.database import get_db
    async with get_db() as db:
        c = await db.execute("SELECT * FROM recommendations ORDER BY timestamp DESC")
        return [RecommendationInfo(**dict(r)) for r in await c.fetchall()]

@router.post("/{id}/dismiss")
async def dismiss_recommendation(request: Request, id: int):
    await request.app.state.rec_engine.dismiss_recommendation(id)
    return {"success": True}

@router.post("/{id}/accept")
async def accept_recommendation(request: Request, id: int):
    await request.app.state.rec_engine.accept_recommendation(id)
    return {"success": True}
