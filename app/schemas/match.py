from pydantic import BaseModel
from typing import Optional


class JobMatchResponse(BaseModel):
    job_id: int
    title: str
    company: str
    location: Optional[str] = None
    job_type: str
    work_mode: str
    apply_url: Optional[str] = None

    match_percentage: int
    matching_skills: list[str]
    missing_skills: list[str]