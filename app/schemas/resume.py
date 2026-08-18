from pydantic import BaseModel
from typing import Optional


class ResumeProfileCreate(BaseModel):
    user_id: int
    professional_summary: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None


class ResumeProfileResponse(ResumeProfileCreate):
    id: int
    resume_file_path: Optional[str] = None

    class Config:
        from_attributes = True
class ResumeUploadResponse(BaseModel):
    user_id: int
    file_name: str
    extracted_text_preview: str