from __future__ import annotations

from crewai import Agent

from services.llm_service import get_groq_llm
from tools.db_tool import GetNGOsTool, UpdateDogStatusTool
from tools.email_tool import SendRescueEmailTool
from tools.search_tool import get_ngo_search_tool


def create_rescue_coordinator_agent() -> Agent:
    return Agent(
        role="Animal Rescue Coordinator",
        goal=(
            "Coordinate rescue for dogs in distress by selecting the best NGO, drafting a "
            "specific rescue request, dispatching it, and updating system status."
        ),
        backstory=(
            "You are the operations coordinator for a pan-India rescue network. You know how "
            "to weigh urgency, NGO specialization, and distance, and you only escalate when "
            "the case truly needs rescue."
        ),
        tools=[GetNGOsTool(), SendRescueEmailTool(), UpdateDogStatusTool(), get_ngo_search_tool()],
        llm=get_groq_llm(),
        verbose=False,
        allow_delegation=False,
        max_iter=3,
    )
