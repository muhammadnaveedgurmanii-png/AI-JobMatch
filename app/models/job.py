from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)

    location = Column(String(100), nullable=True)
    job_type = Column(String(50), nullable=False)
    work_mode = Column(String(50), nullable=False)

    required_skills = Column(Text, nullable=True)
    apply_url = Column(String(500), nullable=True)
    source = Column(String(100), nullable=True)

    posted_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())