from __future__ import annotations

import fitz

from profilecore_parser.linkedin import clean_text


def extract_pdf_text(document_bytes: bytes) -> str:
    document = fitz.open(stream=document_bytes, filetype="pdf")
    pages = [page.get_text("text") for page in document]
    return clean_text("\n\n".join(pages))
