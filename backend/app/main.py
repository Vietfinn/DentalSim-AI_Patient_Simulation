from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.chat import router as chat_router
from app.api.diagnosis import router as diagnosis_router
from app.api.dashboard import router as dashboard_router
from app.database import Base, engine
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-create tables for SQLite to allow seamless local testing
    if settings.DATABASE_URL.startswith("sqlite"):
        print("🔧 SQLite database detected. Auto-creating tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created successfully.")
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(
    title="DentalSim API",
    description="Backend API for Dental Clinical Simulation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder to serve X-ray and medical images
app_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(app_dir)
assets_dir = os.path.join(os.path.dirname(backend_dir), "assets")


if os.path.exists(assets_dir):
    app.mount("/static", StaticFiles(directory=assets_dir), name="static")
    print(f"📁 Assets mounted at /static from: {assets_dir}")
else:
    print(f"⚠️ Warning: Assets directory not found at: {assets_dir}")

# Register route handlers
app.include_router(auth_router)
app.include_router(cases_router)
app.include_router(chat_router)
app.include_router(diagnosis_router)
app.include_router(dashboard_router)

@app.get("/api/health", tags=["health"])
async def health_check():
    # Basic check for Groq config
    groq_configured = bool(settings.GROQ_API_KEY)
    return {
        "status": "healthy",
        "database": settings.DATABASE_URL.split("://")[0],
        "groq_api_configured": groq_configured
    }

@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Welcome to DentalSim API. Please visit /docs for API interactive documentation.",
        "docs_url": "/docs"
    }
