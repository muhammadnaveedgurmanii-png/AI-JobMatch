from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    preferred_location: Optional[str] = Field(default=None, max_length=100)

class UserResponse(UserCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
