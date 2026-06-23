import os
from pydantic import field_validator
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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if not v:
            return v
        
        # Automatically adapt Supabase direct connection string (IPv6 only)
        # into the shared pooler connection string (IPv4 compatible, session mode on port 5432)
        import re
        pattern = r"postgres(?:ql)?(?:\+asyncpg)?://([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)/([^\?]+)"
        match = re.match(pattern, v)
        if match:
            user = match.group(1)
            password = match.group(2)
            project_ref = match.group(3)
            port = match.group(4)
            dbname = match.group(5)
            
            # Use the verified working aws-1-ap-northeast-2 pooler host
            pooler_host = "aws-1-ap-northeast-2.pooler.supabase.com"
            new_url = f"postgresql+asyncpg://{user}.{project_ref}:{password}@{pooler_host}:5432/{dbname}?ssl=require"
            return new_url
            
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    REDIS_URL: Optional[str] = None
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v
    
    JWT_SECRET: str = "supersecretjwtkeyfordentalsimprojectproduction12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: float = 0.65
    LLM_MAX_TOKENS: int = 150

settings = Settings()
