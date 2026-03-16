from functools import lru_cache
from pathlib import Path
from typing import Any


def _schema_path() -> Path:
    return Path(__file__).resolve().parents[4] / "packages" / "profile-schema" / "profile.schema.json"


@lru_cache
def load_profile_schema() -> dict[str, Any]:
    import json

    return json.loads(_schema_path().read_text())

