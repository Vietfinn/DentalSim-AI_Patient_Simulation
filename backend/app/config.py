import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    GROQ_API_KEY: str = ""
    # Defaults to async SQLite for zero-config local run
    DATABASE_URL: str = "sqlite+aiosqlite:///./dentalsim.db"
    REDIS_URL: Optional[str] = None
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    JWT_SECRET: str = "supersecretjwtkeyfordentalsimprojectproduction12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: float = 0.65
    LLM_MAX_TOKENS: int = 150

settings = Settings()
