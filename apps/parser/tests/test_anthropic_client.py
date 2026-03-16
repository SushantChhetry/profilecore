from __future__ import annotations

import asyncio

from profilecore_parser.anthropic_client import extract_profile, prepare_document_text
from profilecore_parser.settings import Settings

SAMPLE_TEXT = """Contact
www.linkedin.com/in/
geraldinepierre (LinkedIn)
Top Skills
Attention to Detail
Tracking Systems
Hiring Practices
Geraldine P.
Talent Acquisition Manager I Head of Talent | Recruitment Business
Manager
Cliffside Park, New Jersey, United States
Summary
With over 14 years of experience in talent acquisition and human
resources, I am passionate about building and nurturing high-
performing teams that drive growth.
Experience
Tennr
Talent Acquisition Manager
August 2025 - Present (8 months)
Instant Impact
Talent Acquisition Manager
March 2025 - August 2025 (6 months)
Education
York College
Bachelors of Science (BS), Business Administration · (2006 - 2010)
Skills
Attention to Detail, Tracking Systems, Hiring Practices
"""


def test_prepare_document_text_removes_header_noise_and_keeps_name_hint() -> None:
    prepared = prepare_document_text(SAMPLE_TEXT)

    assert "Candidate name hint: Geraldine P." in prepared
    assert "Page 1 of 6" not in prepared
    assert "Document text:" in prepared


def test_mock_extraction_returns_better_top_block_shape() -> None:
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test",
        profilecore_mock_llm=True,
    )

    profile, model_name = asyncio.run(extract_profile(SAMPLE_TEXT, "geraldine.pdf", settings))

    assert profile["person"]["fullName"] == "Geraldine P."
    assert profile["person"]["headline"] == "Talent Acquisition Manager I Head of Talent | Recruitment Business Manager"
    assert profile["person"]["location"] == "Cliffside Park, New Jersey, United States"
    assert profile["experience"][0]["company"] == "Tennr"
    assert model_name == "mock-anthropic"
