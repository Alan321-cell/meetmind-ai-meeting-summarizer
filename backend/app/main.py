import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import Base, engine
from app.api.endpoints.health import router as health_router
from app.api.endpoints.meetings import router as meetings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize logging & database tables
    setup_logging()
    logger.info(f"Initializing {settings.PROJECT_NAME} v{settings.VERSION}...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema synchronized successfully.")
    yield
    # Shutdown
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Meeting Summarizer with Speech-to-Text Transcription and Actionable Intelligence Extraction.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during request {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "detail": "An unexpected server error occurred. Please check backend logs.",
            "path": request.url.path
        }
    )

# Include API Routers
app.include_router(health_router, prefix=f"{settings.API_V1_STR}/health", tags=["Health & Diagnostics"])
app.include_router(meetings_router, prefix=f"{settings.API_V1_STR}/meetings", tags=["Meetings & Intelligence"])

# Frontend Static Asset Serving for Single-Port Production Mode
FRONTEND_DIST_DIR = settings.BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "index.html").exists():
    logger.info(f"Mounting frontend distribution from: {FRONTEND_DIST_DIR}")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Allow API routes to be handled by routers
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        target_file = FRONTEND_DIST_DIR / full_path
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
else:
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/docs",
            "api": settings.API_V1_STR
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
