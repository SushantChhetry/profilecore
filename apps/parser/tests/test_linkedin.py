from profilecore_parser.linkedin import clean_text, is_probable_linkedin_profile, section_slice


def test_clean_text_normalizes_whitespace() -> None:
    raw = "Experience\u2022  Product Manager\n\n\nEducation"
    assert clean_text(raw) == "Experience- Product Manager\n\nEducation"


def test_linkedin_detector_requires_multiple_markers() -> None:
    text = "LinkedIn\nExperience\nEducation\nSkills"
    assert is_probable_linkedin_profile(text) is True
    assert is_probable_linkedin_profile("Portfolio biography only") is False


def test_section_slice_returns_target_content() -> None:
    text = "Experience\nPM at Stripe\nEducation\nMIT\nSkills\nProduct"
    assert section_slice(text, "Experience", ["Education", "Skills"]).startswith("Experience")

