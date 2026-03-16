from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    profilecore_storage_bucket: str = "profilecore-documents"
    profilecore_parser_worker_enabled: bool = True
    profilecore_parser_poll_seconds: int = 5
    profilecore_parser_max_retries: int = 2
    profilecore_mock_llm: bool = Field(
        default=True,
        validation_alias=AliasChoices("PROFILECORE_MOCK_LLM", "PROFILECORE_MOCK_OPENAI"),
    )
    anthropic_api_key: str | None = Field(default=None, validation_alias="ANTHROPIC_API_KEY")
    anthropic_extraction_model: str = Field(
        default="claude-sonnet-4-20250514",
        validation_alias="ANTHROPIC_EXTRACTION_MODEL",
    )
    profilecore_parser_name: str = "parser-worker"
    profilecore_parser_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
