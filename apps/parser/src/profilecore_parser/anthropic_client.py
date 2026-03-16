from __future__ import annotations

from datetime import UTC, datetime
import re
from typing import Any

import httpx

from profilecore_parser.linkedin import clean_text
from profilecore_parser.schema import load_profile_schema
from profilecore_parser.settings import Settings

_PAGE_MARKER_RE = re.compile(r"^Page \d+ of \d+$", re.IGNORECASE)
_DATE_RANGE_RE = re.compile(r"^[A-Za-z]{3,9}\s+\d{4}\s*-\s*(Present|[A-Za-z]{3,9}\s+\d{4}).*")


def _first_non_empty(lines: list[str], default: str = "") -> str:
    for line in lines:
        if line.strip():
            return line.strip()
    return default


def _skills_from_text(skills_section: str) -> list[dict[str, Any]]:
    lines = [line.strip("- ").strip() for line in skills_section.splitlines() if line.strip()]
    skill_values = []
    for line in lines:
        for chunk in line.split(","):
            value = chunk.strip()
            if value and value.lower() not in {"skills", "top skills"}:
                skill_values.append({"name": value})

    unique = []
    seen = set()
    for item in skill_values:
        if item["name"].lower() in seen:
            continue
        seen.add(item["name"].lower())
        unique.append(item)
    return unique[:12]


def _normalized_lines(text: str) -> list[str]:
    cleaned = clean_text(text).replace("\u00a0", " ")
    lines = []
    for raw_line in cleaned.splitlines():
        line = " ".join(raw_line.split()).strip()
        if not line or _PAGE_MARKER_RE.match(line):
            continue
        lines.append(line)
    return lines


def _top_block(lines: list[str]) -> list[str]:
    for index, line in enumerate(lines):
        if line.lower() == "summary":
            return lines[:index]
    return lines[:15]


def _name_hint(lines: list[str]) -> str | None:
    ignored = {"contact", "top skills", "summary", "experience", "education", "skills"}
    for line in reversed(_top_block(lines)):
        lowered = line.lower()
        if lowered in ignored:
            continue
        if "linkedin.com/in/" in lowered or lowered.endswith("(linkedin)"):
            continue
        if "united states" in lowered or "," in line:
            continue
        if _DATE_RANGE_RE.match(line):
            continue
        if len(line.split()) <= 4 and "." in line:
            return line
    return None


def _line_section_slice(lines: list[str], name: str, stop_names: list[str]) -> list[str]:
    lowered = [line.lower() for line in lines]
    try:
        start = lowered.index(name.lower())
    except ValueError:
        return []

    end = len(lines)
    for stop_name in stop_names:
        try:
            candidate = lowered.index(stop_name.lower(), start + 1)
        except ValueError:
            continue
        end = min(end, candidate)
    return lines[start:end]


def prepare_document_text(text: str) -> str:
    lines = _normalized_lines(text)
    top_lines = _top_block(lines)
    hints = []
    name_hint = _name_hint(lines)
    if name_hint:
        hints.append(f"Candidate name hint: {name_hint}")

    for line in top_lines:
        if "linkedin.com/in/" in line.lower():
            hints.append(f"LinkedIn URL/header line: {line}")
            break

    return "\n".join(
        [
            "LinkedIn PDF text normalized for extraction.",
            "Ignore page markers, contact/sidebar labels, raw LinkedIn URL headers, and top-skills blocks when inferring the person identity.",
            *hints,
            "",
            "Document text:",
            *lines,
        ]
    )


def _fallback_extract(text: str, filename: str) -> dict[str, Any]:
    cleaned = clean_text(text)
    lines = _normalized_lines(cleaned)
    summary_section = _line_section_slice(lines, "Summary", ["Experience", "Education", "Skills"])
    experience_section = _line_section_slice(lines, "Experience", ["Education", "Skills"])
    education_section = _line_section_slice(lines, "Education", ["Skills"])
    skills_section = _line_section_slice(lines, "Skills", [])

    top_lines = _top_block(lines)
    name = _name_hint(lines) or _first_non_empty(
        [line for line in top_lines if line.lower() not in {"contact", "top skills"}],
        "Unknown Person",
    )

    name_index = top_lines.index(name) if name in top_lines else -1
    headline_parts = []
    if name_index >= 0:
        for line in top_lines[name_index + 1 :]:
            lowered = line.lower()
            if lowered == "summary" or "united states" in lowered or "," in line:
                break
            if "linkedin.com/in/" in lowered or lowered.endswith("(linkedin)"):
                continue
            headline_parts.append(line)
    headline = " ".join(headline_parts) if headline_parts else None

    location = next(
        (line for line in top_lines if "united states" in line.lower() or "," in line and "linkedin" not in line.lower()),
        None,
    )

    experience_lines = [line.strip() for line in experience_section if line.strip()]
    education_lines = [line.strip() for line in education_section if line.strip()]

    experience = []
    if "Experience" in experience_lines:
        experience_lines.remove("Experience")
    if len(experience_lines) >= 2:
        experience.append(
            {
                "company": experience_lines[0],
                "role": experience_lines[1],
                "description": " ".join(experience_lines[3:8]) or None,
            }
        )

    education = []
    if "Education" in education_lines:
        education_lines.remove("Education")
    if education_lines:
        education.append(
            {
                "school": education_lines[0],
                "degree": education_lines[1] if len(education_lines) > 1 else None,
            }
        )

    warnings = [
        "Fallback extraction was used because Anthropic credentials were unavailable.",
        "Review profile fields before persisting.",
    ]
    if not experience:
        warnings.append("No experience entries were extracted.")
    if not education:
        warnings.append("No education entries were extracted.")

    return {
        "schemaVersion": "1.0.0",
        "documentType": "linkedin_pdf",
        "person": {
            "fullName": name,
            "headline": headline,
            "location": location,
            "summary": " ".join(line for line in summary_section if line and line != "Summary") or None,
            "currentCompany": experience[0]["company"] if experience else None,
        },
        "experience": experience,
        "education": education,
        "skills": _skills_from_text("\n".join(skills_section)) or [{"name": "Profile parsing"}],
        "links": {},
        "metadata": {
            "sourceFilename": filename,
            "sourceTextExcerpt": cleaned[:400],
            "extractedAt": datetime.now(UTC).isoformat(),
            "extractionWarnings": warnings,
        },
    }


def _system_prompt() -> str:
    return (
        "Extract a LinkedIn profile into the supplied JSON schema using the tool input exactly. "
        "Return only grounded facts from the document. "
        "Ignore sidebar noise such as Contact, LinkedIn URL headers, Top Skills labels, Certifications labels, and page markers. "
        "The person's full name must be the profile owner's name, never a label, URL fragment, location, skill, or company. "
        "Use the top profile block for headline and location when available. "
        "Create one experience item per role in reverse chronological order as shown in the PDF. "
        "If a field is uncertain, omit it or use an empty array instead of guessing, and record the uncertainty in metadata.extractionWarnings."
    )


def _anthropic_payload(text: str, filename: str, settings: Settings) -> dict[str, Any]:
    schema = load_profile_schema()
    prepared_text = prepare_document_text(text)
    return {
        "model": settings.anthropic_extraction_model,
        "max_tokens": 4000,
        "system": _system_prompt(),
        "tool_choice": {"type": "tool", "name": "parsed_profile"},
        "tools": [
            {
                "name": "parsed_profile",
                "description": "Structured LinkedIn profile extracted from PDF text.",
                "input_schema": schema,
            }
        ],
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Filename: {filename}\n\n{prepared_text}",
                    }
                ],
            }
        ],
    }


def _parse_tool_response(response_json: dict[str, Any]) -> dict[str, Any]:
    for block in response_json.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "parsed_profile":
            return block["input"]
    raise ValueError("Anthropic response did not include the parsed_profile tool result.")


async def extract_profile(text: str, filename: str, settings: Settings) -> tuple[dict[str, Any], str]:
    if settings.profilecore_mock_llm or not settings.anthropic_api_key:
        return _fallback_extract(text, filename), "mock-anthropic"

    payload = _anthropic_payload(text, filename, settings)
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()

    return _parse_tool_response(response.json()), settings.anthropic_extraction_model
