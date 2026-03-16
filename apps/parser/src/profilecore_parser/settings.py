from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    profilecore_storage_bucket: str = "profilecore-documents"
    profilecore_parser_worker_enabled: bool = True
    profilecore_parser_poll_seconds: int = 5
    profilecore_parser_max_retries: int = 2
    profilecore_mock_openai: bool = True
    openai_api_key: str | None = None
    openai_extraction_model: str = "gpt-4.1-mini"
    profilecore_parser_name: str = "parser-worker"
    profilecore_parser_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()

