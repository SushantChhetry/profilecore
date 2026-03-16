from __future__ import annotations

import asyncio

import httpx

from profilecore_parser.settings import Settings
from profilecore_parser.worker import WorkerState, process_next_run


class ClaimRunErrorRepository:
    def claim_run(self) -> None:
        raise httpx.ConnectError(
            "[Errno 8] nodename nor servname provided, or not known",
            request=httpx.Request("POST", "https://example.supabase.co/rest/v1/rpc/claim_extraction_run"),
        )


def test_process_next_run_keeps_worker_alive_when_claim_run_fails() -> None:
    state = WorkerState()
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test",
    )

    did_work = asyncio.run(process_next_run(ClaimRunErrorRepository(), settings, state))

    assert did_work is False
    assert state.last_run_id is None
    assert "nodename nor servname provided" in state.last_error
