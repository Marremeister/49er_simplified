"""Application configuration using Pydantic Settings."""
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # API Settings
    API_V1_STR: str = "/api"
    APP_NAME: str = "Sailing Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./sailing_platform.db"

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=True
    )


# Create settings instance
settings = Settings()