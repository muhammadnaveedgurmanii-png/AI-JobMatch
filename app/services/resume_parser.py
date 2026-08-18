from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_content: bytes) -> str:
    reader = PdfReader(BytesIO(file_content))

    return "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )