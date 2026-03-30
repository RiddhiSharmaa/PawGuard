from __future__ import annotations

from crewai import Agent

from services.llm_service import get_groq_llm
from tools.image_tool import DogImageAssessTool


def create_triage_agent(image_base64: str, description: str) -> Agent:
    return Agent(
        role="Veterinary Triage Specialist",
        goal=(
            "Assess stray dog images with expert precision, determine injury severity, urgency "
            "level, and whether immediate rescue is needed."
        ),
        backstory=(
            "You are a trained veterinary triage specialist with 15 years of experience in "
            "animal emergency response across India. You can distinguish genuine emergencies "
            "from monitor-only cases and communicate your reasoning clearly."
        ),
        tools=[DogImageAssessTool(image_base64=image_base64, description=description)],
        llm=get_groq_llm(),
        verbose=False,
        allow_delegation=False,
        max_iter=2,
    )
