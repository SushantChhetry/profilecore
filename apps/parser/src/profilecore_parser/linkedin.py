from __future__ import annotations

import re


LINKEDIN_MARKERS = ("experience", "education", "skills", "linkedin")


def clean_text(text: str) -> str:
    text = text.replace("\u2022", "-")
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def is_probable_linkedin_profile(text: str) -> bool:
    lowered = text.lower()
    return sum(marker in lowered for marker in LINKEDIN_MARKERS) >= 2


def section_slice(text: str, name: str, stop_names: list[str]) -> str:
    lowered = text.lower()
    start = lowered.find(name.lower())
    if start == -1:
        return ""

    stop_positions = [lowered.find(stop.lower(), start + len(name)) for stop in stop_names]
    stop_candidates = [position for position in stop_positions if position != -1]
    end = min(stop_candidates) if stop_candidates else len(text)
    return text[start:end].strip()
