from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    company: str = Field(min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=20000)
    location: Optional[str] = Field(default=None, max_length=100)
    job_type: str = Field(min_length=1, max_length=50)
    work_mode: str = Field(min_length=1, max_length=50)
    required_skills: Optional[str] = Field(default=None, max_length=5000)
    apply_url: Optional[str] = Field(default=None, max_length=500)
    source: Optional[str] = Field(default=None, max_length=100)

class JobResponse(JobCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
