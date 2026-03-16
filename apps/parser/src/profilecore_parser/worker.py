from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from jsonschema import ValidationError, validate

from profilecore_parser.linkedin import is_probable_linkedin_profile
from profilecore_parser.openai_client import extract_profile
from profilecore_parser.repository import SupabaseRepository
from profilecore_parser.schema import load_profile_schema
from profilecore_parser.settings import Settings
from profilecore_parser.text_extraction import extract_pdf_text

logger = logging.getLogger(__name__)


class ParserFailure(Exception):
    def __init__(self, code: str, message: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


@dataclass
class WorkerState:
    running: bool = False
    last_run_id: str | None = None
    last_error: str | None = None


async def process_next_run(repository: SupabaseRepository, settings: Settings, state: WorkerState) -> bool:
    run = None

    try:
        run = repository.claim_run()

        if not run:
            return False

        state.last_run_id = run["id"]
        document = repository.get_document(run["document_id"])
        document_bytes = repository.download_document(document["storage_path"])
        text = extract_pdf_text(document_bytes)

        if not is_probable_linkedin_profile(text):
            raise ParserFailure("unsupported_format", "The uploaded PDF does not look like a LinkedIn export.")

        profile, model_name = await extract_profile(text, document["filename"], settings)
        validate(instance=profile, schema=load_profile_schema())
        repository.mark_succeeded(run["id"], document["id"], profile, model_name)
        logger.info("extraction completed", extra={"run_id": run["id"], "document_id": document["id"]})
        return True
    except ValidationError as error:
        repository.mark_failed(run["id"], "validation_failed", error.message, run["retry_count"], retryable=False)
        state.last_error = error.message
        logger.exception("profile validation failed")
    except ParserFailure as error:
        repository.mark_failed(run["id"], error.code, str(error), run["retry_count"], retryable=error.retryable)
        state.last_error = str(error)
        logger.warning("parser failure", extra={"run_id": run["id"], "code": error.code})
    except Exception as error:  # noqa: BLE001
        state.last_error = str(error)
        if run:
            repository.mark_failed(run["id"], "parse_failed", str(error), run["retry_count"], retryable=True)
            logger.exception("unexpected parser failure")
            return True

        logger.exception("failed to poll extraction runs")
        return False

    return True


async def run_worker(repository: SupabaseRepository, settings: Settings, state: WorkerState) -> None:
    state.running = True
    while True:
        try:
            did_work = await process_next_run(repository, settings, state)
            if not did_work:
                await asyncio.sleep(settings.profilecore_parser_poll_seconds)
        except Exception as error:  # noqa: BLE001
            state.last_error = str(error)
            logger.exception("worker loop crashed")
            await asyncio.sleep(settings.profilecore_parser_poll_seconds)
