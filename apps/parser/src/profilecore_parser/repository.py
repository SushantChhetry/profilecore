from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from supabase import Client, create_client

from profilecore_parser.settings import Settings


class SupabaseRepository:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    def claim_run(self) -> dict[str, Any] | None:
        result = self.client.rpc(
            "claim_extraction_run",
            {"worker_name": self.settings.profilecore_parser_name},
        ).execute()
        rows = result.data or []
        return rows[0] if rows else None

    def get_document(self, document_id: str) -> dict[str, Any]:
        result = self.client.table("uploaded_document").select("*").eq("id", document_id).single().execute()
        return result.data

    def download_document(self, storage_path: str) -> bytes:
        return self.client.storage.from_(self.settings.profilecore_storage_bucket).download(storage_path)

    def mark_failed(self, run_id: str, code: str, message: str, retry_count: int, retryable: bool) -> None:
        if retryable and retry_count < self.settings.profilecore_parser_max_retries:
            self.client.table("extraction_run").update(
                {
                    "status": "queued",
                    "retry_count": retry_count + 1,
                    "error_code": code,
                    "error_message": message,
                }
            ).eq("id", run_id).execute()
            return

        self.client.table("extraction_run").update(
            {
                "status": "failed",
                "error_code": code,
                "error_message": message,
                "finished_at": datetime.now(UTC).isoformat(),
            }
        ).eq("id", run_id).execute()

    def mark_succeeded(self, run_id: str, document_id: str, profile: dict[str, Any], model_name: str) -> dict[str, Any]:
        current_response = (
            self.client.table("parsed_profile")
            .select("*")
            .eq("document_id", document_id)
            .maybe_single()
            .execute()
        )
        current = getattr(current_response, "data", None)
        profile_id = current["id"] if current else None

        payload = {
            "document_id": document_id,
            "extraction_run_id": run_id,
            "schema_version": profile["schemaVersion"],
            "full_name": profile["person"]["fullName"],
            "headline": profile["person"].get("headline"),
            "location": profile["person"].get("location"),
            "canonical_json": profile,
        }

        if profile_id:
            payload["id"] = profile_id

        parsed_profile = (
            self.client.table("parsed_profile")
            .upsert(payload, on_conflict="document_id")
            .execute()
            .data[0]
        )

        self.client.table("profile_section").delete().eq("profile_id", parsed_profile["id"]).execute()

        section_rows: list[dict[str, Any]] = [
            {
                "profile_id": parsed_profile["id"],
                "section_name": "overview",
                "sort_order": 0,
                "payload": profile["person"],
            }
        ]
        section_rows.extend(
            {
                "profile_id": parsed_profile["id"],
                "section_name": "experience",
                "sort_order": index,
                "payload": item,
            }
            for index, item in enumerate(profile["experience"])
        )
        section_rows.extend(
            {
                "profile_id": parsed_profile["id"],
                "section_name": "education",
                "sort_order": index,
                "payload": item,
            }
            for index, item in enumerate(profile["education"])
        )
        section_rows.extend(
            {
                "profile_id": parsed_profile["id"],
                "section_name": "skills",
                "sort_order": index,
                "payload": item,
            }
            for index, item in enumerate(profile["skills"])
        )
        self.client.table("profile_section").insert(section_rows).execute()

        self.client.table("extraction_run").update(
            {
                "status": "succeeded",
                "finished_at": datetime.now(UTC).isoformat(),
                "model_name": model_name,
                "error_code": None,
                "error_message": None,
                "parser_version": self.settings.profilecore_parser_version,
            }
        ).eq("id", run_id).execute()
        return parsed_profile
