def split_skills(skills_text: str | None) -> set[str]:
    if not skills_text:
        return set()

    return {
        skill.strip().lower()
        for skill in skills_text.split(",")
        if skill.strip()
    }


def calculate_match(
    resume_skills_text: str | None,
    job_skills_text: str | None
) -> dict:
    resume_skills = split_skills(resume_skills_text)
    job_skills = split_skills(job_skills_text)

    matching_skills = sorted(resume_skills.intersection(job_skills))
    missing_skills = sorted(job_skills.difference(resume_skills))

    if not job_skills:
        match_percentage = 0
    else:
        match_percentage = round(
            (len(matching_skills) / len(job_skills)) * 100
        )

    return {
        "match_percentage": match_percentage,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills
    }