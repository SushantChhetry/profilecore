from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from openai import OpenAI

from profilecore_parser.linkedin import clean_text, section_slice
from profilecore_parser.schema import load_profile_schema
from profilecore_parser.settings import Settings


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


def _fallback_extract(text: str, filename: str) -> dict[str, Any]:
    cleaned = clean_text(text)
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    name = _first_non_empty([line for line in lines if line.lower() != "linkedin profile"], "Unknown Person")
    headline = lines[1] if len(lines) > 1 else ""
    location = lines[2] if len(lines) > 2 else ""

    experience_section = section_slice(cleaned, "Experience", ["Education", "Skills"])
    education_section = section_slice(cleaned, "Education", ["Skills"])
    skills_section = section_slice(cleaned, "Skills", [])

    experience_lines = [
        line.strip() for line in experience_section.splitlines() if line.strip() and line.strip().lower() != "experience"
    ]
    education_lines = [
        line.strip() for line in education_section.splitlines() if line.strip() and line.strip().lower() != "education"
    ]

    experience = []
    if experience_lines:
        experience.append(
            {
                "company": experience_lines[1] if len(experience_lines) > 1 else "Unknown Company",
                "role": experience_lines[0],
                "description": " ".join(experience_lines[2:5]) or None,
            }
        )

    education = []
    if education_lines:
        education.append(
            {
                "school": education_lines[0],
                "degree": education_lines[1] if len(education_lines) > 1 else None,
            }
        )

    warnings = []
    if not experience:
        warnings.append("No experience entries were extracted.")
    if not education:
        warnings.append("No education entries were extracted.")

    return {
        "schemaVersion": "1.0.0",
        "documentType": "linkedin_pdf",
        "person": {
            "fullName": name,
            "headline": headline or None,
            "location": location or None,
            "summary": " ".join(lines[3:8]) or None,
            "currentCompany": experience[0]["company"] if experience else None,
        },
        "experience": experience,
        "education": education,
        "skills": _skills_from_text(skills_section) or [{"name": "Profile parsing"}],
        "links": {},
        "metadata": {
            "sourceFilename": filename,
            "sourceTextExcerpt": cleaned[:400],
            "extractedAt": datetime.now(UTC).isoformat(),
            "extractionWarnings": warnings,
        },
    }


async def extract_profile(text: str, filename: str, settings: Settings) -> tuple[dict[str, Any], str]:
    if settings.profilecore_mock_openai or not settings.openai_api_key:
        return _fallback_extract(text, filename), "mock-openai"

    client = OpenAI(api_key=settings.openai_api_key)
    schema = load_profile_schema()
    response = client.responses.create(
        model=settings.openai_extraction_model,
        input=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Convert the provided LinkedIn PDF text into the supplied JSON schema. "
                            "Do not invent fields that are not grounded in the text. "
                            "If a section is missing, return an empty array and add a warning."
                        ),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": f"Filename: {filename}\n\nDocument text:\n{text}",
                    }
                ],
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "parsed_profile",
                "schema": schema,
                "strict": True,
            }
        },
    )

    import json

    return json.loads(response.output_text), response.model
