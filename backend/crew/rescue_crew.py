from __future__ import annotations

import logging
from typing import Any

from crewai import Crew, Process, Task

from agents.duplicate_agent import create_duplicate_agent
from agents.followup_agent import create_followup_agent
from agents.rescue_coordinator import create_rescue_coordinator_agent
from agents.triage_agent import create_triage_agent
from config import configure_crewai_runtime
from models import DuplicateCheckResult, RescueResult, TriageAssessment
from services.llm_parsing import parse_json_maybe

logger = logging.getLogger(__name__)
configure_crewai_runtime()


def _clip_text(value: str, limit: int) -> str:
    text = " ".join((value or "").split())
    if len(text) <= limit:
        return text
    return f"{text[: limit - 3]}..."


def _compact_triage_context(triage: dict[str, Any]) -> dict[str, Any]:
    return {
        "is_injured": bool(triage.get("is_injured")),
        "injury_description": _clip_text(str(triage.get("injury_description") or ""), 120),
        "estimated_age": triage.get("estimated_age") or "unknown",
        "is_aggressive": bool(triage.get("is_aggressive")),
        "visible_conditions": list((triage.get("visible_conditions") or [])[:3]),
        "priority": triage.get("priority") or "medium",
        "priority_reason": _clip_text(str(triage.get("priority_reason") or ""), 120),
        "rescue_needed": bool(triage.get("rescue_needed")),
    }


def _compact_duplicate_context(duplicate_check: dict[str, Any]) -> dict[str, Any]:
    return {
        "is_duplicate": bool(duplicate_check.get("is_duplicate")),
        "duplicate_of_id": duplicate_check.get("duplicate_of_id"),
        "confidence": duplicate_check.get("confidence") or "low",
        "reasoning": _clip_text(str(duplicate_check.get("reasoning") or ""), 120),
    }


def run_rescue_crew(
    image_base64: str,
    latitude: float,
    longitude: float,
    address: str,
    description: str,
    dog_id: str,
) -> dict[str, Any]:
    try:
        triage = create_triage_agent(image_base64=image_base64, description=description)
        dedup = create_duplicate_agent()
        coordinator = create_rescue_coordinator_agent()
    except Exception:
        logger.exception("Failed to initialize rescue crew agents")
        return {
            "triage": TriageAssessment().model_dump(),
            "duplicate_check": DuplicateCheckResult().model_dump(),
            "rescue": RescueResult(status="reported").model_dump(),
        }

    triage_task = Task(
        description=(
            "Assess this emergency report.\n"
            f"Dog ID: {dog_id}\n"
            f"Location: {_clip_text(address, 120)}\n"
            f"Reporter note: {_clip_text(description, 220)}\n"
            "Call `assess_dog_image` once and return only compact JSON with the triage fields."
        ),
        agent=triage,
        expected_output="A valid JSON triage assessment.",
    )

    crew = Crew(
        agents=[triage],
        tasks=[triage_task],
        process=Process.sequential,
        verbose=False,
        tracing=False,
    )

    try:
        final_result = crew.kickoff()
    except Exception:
        logger.exception("Rescue crew execution failed")
        return {
            "triage": TriageAssessment().model_dump(),
            "duplicate_check": DuplicateCheckResult().model_dump(),
            "rescue": RescueResult(status="reported").model_dump(),
        }

    try:
        triage_parsed = TriageAssessment.model_validate(parse_json_maybe(triage_task.output))
    except Exception:
        logger.exception("Failed to parse triage output")
        triage_parsed = TriageAssessment()

    compact_triage = _compact_triage_context(triage_parsed.model_dump())

    dedup_task = Task(
        description=(
            "Check whether this report is a duplicate.\n"
            f"Dog ID: {dog_id}\n"
            f"Coordinates: {latitude:.5f}, {longitude:.5f}\n"
            f"Address: {_clip_text(address, 120)}\n"
            f"Reporter note: {_clip_text(description, 180)}\n"
            f"Triage summary: {compact_triage}\n"
            "Call `get_recent_dogs_nearby` with radius_km=0.15.\n"
            "Return only compact JSON: is_duplicate, duplicate_of_id, confidence, reasoning."
        ),
        agent=dedup,
        expected_output="A valid JSON duplicate-detection result.",
    )

    rescue_task = Task(
        description=(
            "Coordinate rescue for this report.\n"
            f"Dog ID: {dog_id}\n"
            f"Coordinates: {latitude:.5f}, {longitude:.5f}\n"
            f"Address: {_clip_text(address, 120)}\n"
            f"Triage summary: {compact_triage}\n"
            "Use the duplicate result from the previous task.\n"
            "Only dispatch if rescue_needed is true and duplicate is not high/medium confidence.\n"
            "Use `get_ngos_by_location`. Use `search_ngos_web` only if DB results are empty.\n"
            "Keep email_body short, actions_taken to max 3 items, reasoning to one sentence.\n"
            "Return only compact JSON matching the rescue schema."
        ),
        agent=coordinator,
        expected_output="A valid JSON rescue-coordination result.",
        context=[dedup_task],
    )

    secondary_crew = Crew(
        agents=[dedup, coordinator],
        tasks=[dedup_task, rescue_task],
        process=Process.sequential,
        verbose=False,
        tracing=False,
    )

    try:
        secondary_result = secondary_crew.kickoff()
    except Exception:
        logger.exception("Duplicate/rescue crew execution failed")
        return {
            "triage": triage_parsed.model_dump(),
            "duplicate_check": DuplicateCheckResult().model_dump(),
            "rescue": RescueResult(status="reported").model_dump(),
        }

    try:
        dedup_parsed = DuplicateCheckResult.model_validate(parse_json_maybe(dedup_task.output))
    except Exception:
        logger.exception("Failed to parse duplicate detection output")
        dedup_parsed = DuplicateCheckResult()

    try:
        rescue_parsed = RescueResult.model_validate(parse_json_maybe(rescue_task.output or secondary_result))
    except Exception:
        logger.exception("Failed to parse rescue coordination output")
        rescue_parsed = RescueResult(status="reported")

    return {
        "triage": triage_parsed.model_dump(),
        "duplicate_check": dedup_parsed.model_dump(),
        "rescue": rescue_parsed.model_dump(),
    }


def run_followup_crew(dog_id: str, latitude: float, longitude: float) -> dict[str, Any]:
    try:
        followup = create_followup_agent()
    except Exception:
        logger.exception("Failed to initialize follow-up crew agent")
        return RescueResult(status="reported").model_dump()

    followup_task = Task(
        description=(
            f"Check follow-up status for dog ID {dog_id} at {latitude:.5f}, {longitude:.5f}.\n"
            "Call `get_dog_by_id` first.\n"
            "If already rescued, return compact JSON with status='rescued'.\n"
            "If still unresolved, use `get_ngos_by_location`, send one short follow-up email, and update status.\n"
            "Return only compact JSON matching the rescue schema."
        ),
        agent=followup,
        expected_output="A valid JSON summary of follow-up actions.",
    )

    try:
        crew = Crew(
            agents=[followup],
            tasks=[followup_task],
            process=Process.sequential,
            verbose=False,
            tracing=False,
        )
        result = crew.kickoff()
        return parse_json_maybe(result)
    except Exception:
        logger.exception("Follow-up crew execution failed for dog %s", dog_id)
        return RescueResult(status="reported").model_dump()
