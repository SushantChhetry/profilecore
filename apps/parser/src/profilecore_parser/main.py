from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI

from profilecore_parser.repository import SupabaseRepository
from profilecore_parser.settings import get_settings
from profilecore_parser.worker import WorkerState, process_next_run, run_worker

logging.basicConfig(level=logging.INFO)

settings = get_settings()
repository = SupabaseRepository(settings)
worker_state = WorkerState()
app = FastAPI(title="ProfileCore Parser", version=settings.profilecore_parser_version)


@app.on_event("startup")
async def startup_event() -> None:
    if settings.profilecore_parser_worker_enabled:
        asyncio.create_task(run_worker(repository, settings, worker_state))


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "parser",
        "workerEnabled": settings.profilecore_parser_worker_enabled,
        "workerState": {
            "running": worker_state.running,
            "lastRunId": worker_state.last_run_id,
            "lastError": worker_state.last_error,
        },
    }


@app.post("/internal/process-once")
async def process_once() -> dict[str, bool]:
    did_work = await process_next_run(repository, settings, worker_state)
    return {"processed": did_work}

