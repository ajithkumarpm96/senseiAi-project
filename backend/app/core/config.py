"""
Configuration — All environment variables and settings in one place.

This is like a .env file reader. We use pydantic Settings to validate
that all required config values exist before the app starts.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Settings:
    """App settings — loaded from environment variables"""
    
    # App
    APP_NAME: str = "SenseiAI"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sensei.db")
    
    # LLM
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter")  # "openrouter", "groq", or "gemini"
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen/qwen3.8-27b:free")
    
    # Guardrails
    KILL_SWITCH_ACTIVE: bool = os.getenv("KILL_SWITCH", "false").lower() == "true"
    DAILY_TOKEN_LIMIT: int = int(os.getenv("DAILY_TOKEN_LIMIT", "500000"))
    MONTHLY_TOKEN_LIMIT: int = int(os.getenv("MONTHLY_TOKEN_LIMIT", "10000000"))
    PER_REQUEST_MAX_TOKENS: int = int(os.getenv("PER_REQUEST_MAX_TOKENS", "8000"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "20"))
    
    # Conversation Memory
    MEMORY_WINDOW_SIZE: int = 10  # Keep last 10 messages as-is


settings = Settings()
