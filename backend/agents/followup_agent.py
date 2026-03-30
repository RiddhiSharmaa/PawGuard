from __future__ import annotations

from crewai import Agent

from services.llm_service import get_groq_llm
from tools.db_tool import GetDogByIdTool, GetNGOsTool, UpdateDogStatusTool
from tools.email_tool import SendRescueEmailTool


def create_followup_agent() -> Agent:
    return Agent(
        role="Rescue Follow-up Monitor",
        goal=(
            "Check unresolved rescue cases and autonomously escalate them to backup NGOs when "
            "the original dispatch has stalled."
        ),
        backstory=(
            "You are a persistent rescue monitor who ensures no dispatched case goes cold. "
            "When a rescue remains unresolved, you review the case details, contact backup "
            "help, and update the system."
        ),
        tools=[GetDogByIdTool(), GetNGOsTool(), SendRescueEmailTool(), UpdateDogStatusTool()],
        llm=get_groq_llm(),
        verbose=False,
        allow_delegation=False,
        max_iter=2,
    )
