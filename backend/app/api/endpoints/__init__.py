from app.api.endpoints.health import router as health_router
from app.api.endpoints.meetings import router as meetings_router

__all__ = ["health_router", "meetings_router"]
