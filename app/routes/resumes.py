from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.resume import ResumeProfile
from app.models.user import User
from app.schemas.resume import ResumeProfileCreate, ResumeProfileResponse

router = APIRouter(prefix="/resumes", tags=["Resume Profiles"])

@router.post("/", response_model=ResumeProfileResponse)
def create_resume_profile(resume_data: ResumeProfileCreate, db: Session = Depends(get_db)):
    if not db.query(User).filter(User.id == resume_data.user_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = db.query(ResumeProfile).filter(ResumeProfile.user_id == resume_data.user_id).first()
    if profile:
        for field, value in resume_data.model_dump(exclude={"user_id"}).items():
            setattr(profile, field, value)
    else:
        profile = ResumeProfile(**resume_data.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/user/{user_id}", response_model=ResumeProfileResponse)
def get_resume_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(ResumeProfile).filter(ResumeProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume profile not found")
    return profile
