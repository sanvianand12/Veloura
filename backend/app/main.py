from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import PROJECT_NAME, PROJECT_VERSION, CORS_ORIGINS, DEBUG
from app.database.session import init_db
from app.api.routes.health import router as health_router
from app.api.routes.events import router as events_router
from app.api.routes.planning import router as planning_router
from app.api.routes.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on application startup
    init_db()
    yield

app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    debug=DEBUG,
    description="Veloura - AI-powered event planning platform backend",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(events_router)
app.include_router(planning_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Veloura API - Intelligent Celebration & Event Architecture",
        "documentation": "/docs",
        "health": "/health",
        "status": "online"
    }
