from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.resume import ResumeProfile
from app.models.user import User
from app.schemas.resume import ResumeUploadResponse
from app.services.resume_parser import extract_text_from_pdf

router = APIRouter(
    prefix="/resumes",
    tags=["Resume Profiles"]
)

UPLOAD_DIRECTORY = Path("uploads/resumes")


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    file_name = Path(file.filename or "resume.pdf").name

    if not file_name.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume files are allowed"
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty"
        )

    try:
        extracted_text = extract_text_from_pdf(file_content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read this PDF file"
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in this PDF"
        )

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)

    saved_file_path = UPLOAD_DIRECTORY / f"user_{user_id}_{file_name}"

    with open(saved_file_path, "wb") as saved_file:
        saved_file.write(file_content)

    profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == user_id
    ).first()

    if profile:
        profile.resume_file_path = str(saved_file_path)
    else:
        profile = ResumeProfile(
            user_id=user_id,
            professional_summary=extracted_text[:2000],
            resume_file_path=str(saved_file_path)
        )
        db.add(profile)

    db.commit()

    return {
        "user_id": user_id,
        "file_name": file_name,
        "extracted_text_preview": extracted_text[:500]
    }