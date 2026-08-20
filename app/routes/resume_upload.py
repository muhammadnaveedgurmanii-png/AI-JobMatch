from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.resume import ResumeProfile
from app.models.user import User
from app.schemas.resume import ResumeUploadResponse
from app.services.resume_parser import extract_text_from_pdf

router = APIRouter(prefix="/resumes", tags=["Resume Profiles"])
UPLOAD_DIRECTORY = Path("uploads/resumes")
MAX_RESUME_BYTES = 5 * 1024 * 1024

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(user_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    file_name = Path(file.filename or "resume.pdf").name
    if file.content_type not in {"application/pdf", "application/octet-stream"} or not file_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a PDF resume.")
    file_content = await file.read(MAX_RESUME_BYTES + 1)
    if not file_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty")
    if len(file_content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Resume must be 5 MB or smaller.")
    if not file_content.startswith(b"%PDF"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is not a valid PDF.")
    try:
        extracted_text = extract_text_from_pdf(file_content)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not read this PDF file") from exc
    if not extracted_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable text found in this PDF")
    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    saved_file_path = UPLOAD_DIRECTORY / f"user_{user_id}_{uuid4().hex}.pdf"
    saved_file_path.write_bytes(file_content)
    profile = db.query(ResumeProfile).filter(ResumeProfile.user_id == user_id).first()
    if profile:
        profile.resume_file_path = str(saved_file_path)
    else:
        db.add(ResumeProfile(user_id=user_id, professional_summary=extracted_text[:2000], resume_file_path=str(saved_file_path)))
    db.commit()
    return {"user_id": user_id, "file_name": file_name, "extracted_text_preview": extracted_text[:500]}
