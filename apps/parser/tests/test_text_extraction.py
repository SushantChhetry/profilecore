from pathlib import Path

from profilecore_parser.text_extraction import extract_pdf_text


def test_extract_pdf_text_reads_fixture() -> None:
    fixture_path = Path(__file__).resolve().parents[3] / "fixtures" / "linkedin" / "sample-linkedin-profile.pdf"
    extracted = extract_pdf_text(fixture_path.read_bytes())

    assert "Jane Doe" in extracted
    assert "Product Manager at Stripe" in extracted
