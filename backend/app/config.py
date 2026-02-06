"""App configuration from environment. Never commit secrets."""
import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings():
    return Settings()


class Settings:
    """Load from env; use .env file locally."""

    # Database (SQLite for local dev, PostgreSQL for production)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./app.db"
    )

    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
    
    # OpenAI - GPT-5 for narrative layer only
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")  # use gpt-5 when available

    # App
    ENV: str = os.getenv("ENV", "development")
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    ).split(",")
