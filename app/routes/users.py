from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == str(user.email).lower()).first()
    if existing:
        existing.full_name = user.full_name
        existing.preferred_location = user.preferred_location
        db.commit()
        db.refresh(existing)
        return existing
    new_user = User(full_name=user.full_name, email=str(user.email).lower(), preferred_location=user.preferred_location)
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A profile with this email already exists.") from exc
    return new_user

@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).limit(100).all()
