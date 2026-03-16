from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from profilecore_parser.repository import SupabaseRepository
from profilecore_parser.settings import Settings


class FakeResponse:
    def __init__(self, data: Any) -> None:
        self.data = data


@dataclass
class FakeTableQuery:
    execute_result: FakeResponse | None
    upsert_payload: dict[str, Any] | None = None
    upsert_conflict: str | None = None
    inserted_rows: list[dict[str, Any]] | None = None
    updated_payload: dict[str, Any] | None = None
    filters: list[tuple[str, Any]] = field(default_factory=list)

    def select(self, *_args: Any) -> FakeTableQuery:
        return self

    def eq(self, column: str, value: Any) -> FakeTableQuery:
        self.filters.append((column, value))
        return self

    def maybe_single(self) -> FakeTableQuery:
        return self

    def upsert(self, payload: dict[str, Any], on_conflict: str) -> FakeTableQuery:
        self.upsert_payload = payload
        self.upsert_conflict = on_conflict
        return self

    def delete(self) -> FakeTableQuery:
        return self

    def insert(self, rows: list[dict[str, Any]]) -> FakeTableQuery:
        self.inserted_rows = rows
        return self

    def update(self, payload: dict[str, Any]) -> FakeTableQuery:
        self.updated_payload = payload
        return self

    def execute(self) -> FakeResponse | None:
        return self.execute_result


class FakeClient:
    def __init__(self, table_calls: dict[str, list[FakeTableQuery]]) -> None:
        self.table_calls = table_calls

    def table(self, name: str) -> FakeTableQuery:
        return self.table_calls[name].pop(0)


def test_mark_succeeded_allows_missing_existing_profile_row() -> None:
    repository = SupabaseRepository.__new__(SupabaseRepository)
    repository.settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test",
    )

    lookup_query = FakeTableQuery(execute_result=None)
    upsert_query = FakeTableQuery(execute_result=FakeResponse([{"id": "profile-123"}]))
    delete_sections_query = FakeTableQuery(execute_result=FakeResponse(None))
    insert_sections_query = FakeTableQuery(execute_result=FakeResponse(None))
    update_run_query = FakeTableQuery(execute_result=FakeResponse(None))

    repository.client = FakeClient(
        {
            "parsed_profile": [lookup_query, upsert_query],
            "profile_section": [delete_sections_query, insert_sections_query],
            "extraction_run": [update_run_query],
        }
    )

    parsed_profile = repository.mark_succeeded(
        run_id="run-123",
        document_id="document-123",
        profile={
            "schemaVersion": "1.0",
            "person": {
                "fullName": "Jane Doe",
                "headline": "Engineer",
                "location": "New York, NY",
            },
            "experience": [{"company": "Acme"}],
            "education": [{"school": "MIT"}],
            "skills": [{"name": "Python"}],
        },
        model_name="gpt-test",
    )

    assert parsed_profile == {"id": "profile-123"}
    assert upsert_query.upsert_conflict == "document_id"
    assert upsert_query.upsert_payload == {
        "document_id": "document-123",
        "extraction_run_id": "run-123",
        "schema_version": "1.0",
        "full_name": "Jane Doe",
        "headline": "Engineer",
        "location": "New York, NY",
        "canonical_json": {
            "schemaVersion": "1.0",
            "person": {
                "fullName": "Jane Doe",
                "headline": "Engineer",
                "location": "New York, NY",
            },
            "experience": [{"company": "Acme"}],
            "education": [{"school": "MIT"}],
            "skills": [{"name": "Python"}],
        },
    }
    assert delete_sections_query.filters == [("profile_id", "profile-123")]
    assert insert_sections_query.inserted_rows == [
        {
            "profile_id": "profile-123",
            "section_name": "overview",
            "sort_order": 0,
            "payload": {
                "fullName": "Jane Doe",
                "headline": "Engineer",
                "location": "New York, NY",
            },
        },
        {
            "profile_id": "profile-123",
            "section_name": "experience",
            "sort_order": 0,
            "payload": {"company": "Acme"},
        },
        {
            "profile_id": "profile-123",
            "section_name": "education",
            "sort_order": 0,
            "payload": {"school": "MIT"},
        },
        {
            "profile_id": "profile-123",
            "section_name": "skills",
            "sort_order": 0,
            "payload": {"name": "Python"},
        },
    ]
    assert update_run_query.filters == [("id", "run-123")]
    assert update_run_query.updated_payload is not None
    assert update_run_query.updated_payload["status"] == "succeeded"
    assert update_run_query.updated_payload["model_name"] == "gpt-test"
