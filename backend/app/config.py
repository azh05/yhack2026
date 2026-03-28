from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    acled_email: str = ""
    acled_password: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
