"""
SenseiAI Backend — FastAPI Entry Point

This is where the FastAPI app is created and all routes are registered.
Think of this like your React App.jsx — it's the root that wires everything together.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, projects, progress, auth, admin
from app.core.database import create_tables

app = FastAPI(
    title="SenseiAI",
    description="ADHD-friendly AI study tool with multi-agent teaching",
    version="0.1.0"
)

import os

# CORS: Allow React frontend across local dev, preview URLs, and production domains
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

env_origins = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
allowed_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Automatically supports all Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route groups (like React Router's route definitions)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.on_event("startup")
async def startup():
    """Runs when the server starts — creates database tables if they don't exist"""
    create_tables()


@app.get("/")
async def root():
    return {"message": "SenseiAI API is running 🎓", "version": "0.1.0"}
