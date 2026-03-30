from __future__ import annotations

from crewai import Agent

from services.llm_service import get_groq_llm
from tools.db_tool import GetRecentDogsTool


def create_duplicate_agent() -> Agent:
    return Agent(
        role="Report Deduplication Specialist",
        goal=(
            "Determine whether a new dog report is a duplicate of an existing report nearby, "
            "using location, timing, and contextual clues to prevent redundant dispatches."
        ),
        backstory=(
            "You specialize in emergency-report deduplication. You know nearby reports can "
            "either be the same dog or different dogs in dense street environments, so you "
            "reason carefully before marking a case duplicate."
        ),
        tools=[GetRecentDogsTool()],
        llm=get_groq_llm(),
        verbose=False,
        allow_delegation=False,
        max_iter=2,
    )
