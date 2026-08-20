import os
from typing import Optional
import httpx

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"

def _query_from_filters(location: Optional[str], job_type: Optional[str], work_mode: Optional[str]) -> str:
    terms = []
    if job_type: terms.append({"Internship":"internship","Full-time":"full time","Part-time":"part time"}.get(job_type, job_type))
    if work_mode: terms.append({"Remote":"remote","Hybrid":"hybrid","On-site":"on site"}.get(work_mode, work_mode))
    if location: terms.append(location)
    return " ".join(terms) if terms else "latest jobs"

def _work_mode(job: dict) -> str:
    if job.get("job_is_remote") is True: return "Remote"
    text = (str(job.get("job_title") or "") + " " + str(job.get("job_description") or "")).lower()
    return "Hybrid" if "hybrid" in text else "On-site"

def _location(job: dict) -> str:
    if job.get("job_is_remote") is True: return "Remote"
    parts = [job.get("job_city"), job.get("job_state"), job.get("job_country")]
    return ", ".join(str(x) for x in parts if x) or "Location not specified"

def _normalise_job(job: dict, index: int) -> dict:
    return {"id":index,"title":job.get("job_title") or "Untitled job","company":job.get("employer_name") or job.get("job_publisher") or "Unknown company","description":job.get("job_description") or "No description available.","location":_location(job),"job_type":job.get("job_employment_type") or "Not specified","work_mode":_work_mode(job),"required_skills":", ".join(job.get("job_required_skills") or []) or "Not specified","apply_url":job.get("job_apply_link") or job.get("job_google_link"),"source":job.get("job_publisher") or "JSearch"}

async def search_live_jobs(location: Optional[str] = None, job_type: Optional[str] = None, work_mode: Optional[str] = None, page: int = 1) -> list[dict]:
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key: raise ValueError("RAPIDAPI_KEY is not configured. Add it to your deployment environment variables.")
    params = {"query":_query_from_filters(location,job_type,work_mode),"page":max(page,1),"num_pages":1,"date_posted":"all","country":"us","language":"en"}
    headers = {"x-rapidapi-host":"jsearch.p.rapidapi.com","x-rapidapi-key":api_key}
    try:
        async with httpx.AsyncClient(timeout=20) as client: response = await client.get(JSEARCH_URL,params=params,headers=headers)
        response.raise_for_status()
    except httpx.HTTPError as exc: raise RuntimeError(f"Live job service is unavailable: {exc}") from exc
    return [_normalise_job(job,i) for i,job in enumerate(response.json().get("data",[]),1)]
