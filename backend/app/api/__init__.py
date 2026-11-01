from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.events import router as events_router
from app.api.routes.planning import router as planning_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(events_router)
api_router.include_router(planning_router)

__all__ = ["api_router"]
