from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.job import Job
from app.models.resume import ResumeProfile
from app.models.user import User
from app.schemas.match import JobMatchResponse
from app.services.matching_service import calculate_match

router = APIRouter(
    prefix="/matches",
    tags=["Matched Jobs"]
)


@router.get("/user/{user_id}", response_model=list[JobMatchResponse])
def get_matched_jobs(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    resume_profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == user_id
    ).first()

    if not resume_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume profile not found"
        )

    jobs_query = db.query(Job)

    if user.preferred_location:
        jobs_query = jobs_query.filter(
            or_(
                Job.location.ilike(f"%{user.preferred_location}%"),
                Job.work_mode.ilike("%remote%"),
                Job.work_mode.ilike("%hybrid%")
            )
        )

    matched_jobs = []

    for job in jobs_query.all():
        match_data = calculate_match(
            resume_profile.skills,
            job.required_skills
        )

        if match_data["match_percentage"] > 0:
            matched_jobs.append({
                "job_id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "job_type": job.job_type,
                "work_mode": job.work_mode,
                "apply_url": job.apply_url,
                **match_data
            })

    return sorted(
        matched_jobs,
        key=lambda job: job["match_percentage"],
        reverse=True
    )