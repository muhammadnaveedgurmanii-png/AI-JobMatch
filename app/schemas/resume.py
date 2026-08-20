from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ResumeProfileCreate(BaseModel):
    user_id: int = Field(gt=0)
    professional_summary: Optional[str] = Field(default=None, max_length=10000)
    skills: Optional[str] = Field(default=None, max_length=5000)
    education: Optional[str] = Field(default=None, max_length=5000)
    experience: Optional[str] = Field(default=None, max_length=10000)

class ResumeProfileResponse(ResumeProfileCreate):
    id: int
    resume_file_path: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ResumeUploadResponse(BaseModel):
    user_id: int
    file_name: str
    extracted_text_preview: str
