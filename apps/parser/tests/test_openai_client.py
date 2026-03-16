import asyncio

from profilecore_parser.openai_client import extract_profile
from profilecore_parser.settings import Settings


def test_mock_extraction_returns_valid_shape() -> None:
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test",
        profilecore_mock_openai=True,
    )
    text = """
    LinkedIn Profile
    Jane Doe
    Product Manager at Stripe
    New York, NY

    Experience
    Product Manager
    Stripe
    Led product launches across platform teams.

    Education
    MIT
    Computer Science

    Skills
    Product Strategy, Roadmapping, Leadership
    """

    profile, model_name = asyncio.run(extract_profile(text, "jane-doe.pdf", settings))

    assert profile["person"]["fullName"] == "Jane Doe"
    assert profile["experience"][0]["company"] == "Stripe"
    assert model_name == "mock-openai"
