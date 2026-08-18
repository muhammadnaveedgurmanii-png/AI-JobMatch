from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    preferred_location: Optional[str] = None


class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True