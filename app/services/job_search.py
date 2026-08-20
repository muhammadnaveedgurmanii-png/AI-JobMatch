import os
from typing import Optional
from urllib.parse import urlparse

import httpx

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


def _query_from_filters(location: Optional[str], job_type: Optional[str], work_mode: Optional[str]) -> str:
    terms = []
    if job_type:
        terms.append({"Internship": "internship", "Full-time": "full time", "Part-time": "part time"}.get(job_type, job_type))
    if work_mode:
        terms.append({"Remote": "remote", "Hybrid": "hybrid", "On-site": "on site"}.get(work_mode, work_mode))
    if location:
        terms.append(location.strip())
    return " ".join(terms) if terms else "latest jobs"


def _safe_external_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    parsed = urlparse(value)
    return value if parsed.scheme in {"http", "https"} and parsed.netloc else None


def _work_mode(job: dict) -> str:
    arrangement = str(job.get("work_arrangement") or "").lower()
    if job.get("job_is_remote") is True or "remote" in arrangement:
        return "Remote"
    if "hybrid" in arrangement:
        return "Hybrid"
    text = (str(job.get("job_title") or "") + " " + str(job.get("job_description") or "")).lower()
    return "Hybrid" if "hybrid" in text else "On-site"


def _location(job: dict) -> str:
    if job.get("job_is_remote") is True or "remote" in str(job.get("work_arrangement") or "").lower():
        return "Remote"
    if job.get("job_location"):
        return str(job["job_location"])
    parts = [job.get("job_city"), job.get("job_state"), job.get("job_country")]
    return ", ".join(str(part) for part in parts if part) or "Location not specified"


def _job_type(job: dict) -> str:
    value = str(job.get("job_employment_type") or "Not specified").upper()
    return {"FULLTIME": "Full-time", "PARTTIME": "Part-time", "CONTRACTOR": "Contract", "INTERN": "Internship"}.get(value, value.title())


def _required_skills(job: dict) -> str:
    skills = job.get("job_required_skills") or job.get("required_technologies") or []
    preferred = job.get("preferred_technologies") or []
    combined = list(dict.fromkeys(str(skill).strip() for skill in [*skills, *preferred] if str(skill).strip()))
    return ", ".join(combined) or "Not specified"


def _normalise_job(job: dict, index: int) -> dict:
    publisher = job.get("job_publisher") or "JSearch"
    return {
        "id": index,
        "title": str(job.get("job_title") or "Untitled job")[:150],
        "company": str(job.get("employer_name") or publisher)[:150],
        "description": job.get("job_description") or "No description available.",
        "location": _location(job),
        "job_type": _job_type(job),
        "work_mode": _work_mode(job),
        "required_skills": _required_skills(job),
        "apply_url": _safe_external_url(job.get("job_apply_link") or job.get("job_google_link")),
        "source": str(publisher)[:100]
    }


async def search_live_jobs(location: Optional[str] = None, job_type: Optional[str] = None, work_mode: Optional[str] = None, page: int = 1) -> list[dict]:
    api_key = os.getenv("RAPIDAPI_KEY", "").strip()
    if not api_key:
        raise ValueError("RAPIDAPI_KEY is not configured. Add it to your deployment environment variables.")
    params = {"query": _query_from_filters(location, job_type, work_mode), "page": min(max(page, 1), 10), "num_pages": 1, "date_posted": "all", "country": "us", "language": "en"}
    headers = {"x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": api_key}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=5.0)) as client:
            response = await client.get(JSEARCH_URL, params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Live job service returned HTTP {exc.response.status_code}. Check the JSearch subscription and search endpoint.") from exc
    except (httpx.RequestError, ValueError) as exc:
        raise RuntimeError("Live job service could not be reached or returned invalid data.") from exc
    data = payload.get("data", []) if isinstance(payload, dict) else []
    if not isinstance(data, list):
        raise RuntimeError("Live job service returned an unexpected response format.")
    return [_normalise_job(job, index) for index, job in enumerate(data, start=1) if isinstance(job, dict)]
