from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse
from app.services.job_search import search_live_jobs

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/search-live")
async def search_live(location: Optional[str] = None, job_type: Optional[str] = None, work_mode: Optional[str] = None, page: int = 1):
    try:
        return await search_live_jobs(location, job_type, work_mode, page)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

@router.get("/", response_model=list[JobResponse])
def get_jobs(location: Optional[str] = None, job_type: Optional[str] = None, work_mode: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Job)
    if location: query = query.filter(Job.location.ilike(f"%{location}%"))
    if job_type: query = query.filter(Job.job_type.ilike(f"%{job_type}%"))
    if work_mode: query = query.filter(Job.work_mode.ilike(f"%{work_mode}%"))
    return query.order_by(Job.created_at.desc()).all()
