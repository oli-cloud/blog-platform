from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Modern Blog Platform'
    environment: str = 'development'
    debug: bool = True
    database_url: str = 'sqlite:///./blog.db'
    jwt_secret: str = 'change-this-secret-in-production'
    jwt_algorithm: str = 'HS256'
    access_token_minutes: int = 30
    refresh_token_days: int = 30
    cors_origins: List[str] = ['http://localhost:5173']
    storage_provider: str = 'local'
    upload_dir: str = './uploads'
    max_upload_bytes: int = 5 * 1024 * 1024
    frontend_reset_url: str = 'http://localhost:5173/reset-password'


@lru_cache
def get_settings() -> Settings:
    return Settings()
