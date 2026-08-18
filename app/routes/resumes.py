from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.resume import ResumeProfile
from app.models.user import User
from app.schemas.resume import ResumeProfileCreate, ResumeProfileResponse

router = APIRouter(
    prefix="/resumes",
    tags=["Resume Profiles"]
)


@router.post(
    "/",
    response_model=ResumeProfileResponse,
    status_code=status.HTTP_201_CREATED
)
def create_resume_profile(
    resume_data: ResumeProfileCreate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == resume_data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    existing_profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == resume_data.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user already has a resume profile"
        )

    new_profile = ResumeProfile(**resume_data.model_dump())

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get("/user/{user_id}", response_model=ResumeProfileResponse)
def get_resume_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume profile not found"
        )

    return profile