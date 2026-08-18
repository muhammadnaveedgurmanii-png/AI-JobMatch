from pydantic import BaseModel
from typing import Optional


class JobCreate(BaseModel):
    title: str
    company: str
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: str
    work_mode: str
    required_skills: Optional[str] = None
    apply_url: Optional[str] = None
    source: Optional[str] = None


class JobResponse(JobCreate):
    id: int

    class Config:
        from_attributes = True