from fastapi import FastAPI, Request
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.database.database import Base, engine

load_dotenv()
from app.models.job import Job
from app.models.resume import ResumeProfile
from app.routes.jobs import router as jobs_router
from app.routes.matches import router as matches_router
from app.routes.resumes import router as resumes_router
from app.routes.users import router as users_router
from app.routes.resume_upload import router as resume_upload_router

app = FastAPI(
    title="AI JobMatch API",
    description="AI-powered job aggregation and resume matching platform",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

Base.metadata.create_all(bind=engine)

app.include_router(users_router)
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(matches_router)
app.include_router(resume_upload_router)


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="home.html"
    )

@app.get("/about")
def about(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="about.html"
    )
@app.get("/resume")
def resume_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="resume.html"
    )
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
@app.get("/jobs-page")
def jobs_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="jobs.html"
    )
@app.get("/matches-page")
def matches_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="matches.html"
    )

@app.get("/database-status")
def database_status():
    return {
        "status": "connected",
        "database": "SQLite"
    }