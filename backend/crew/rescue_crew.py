from __future__ import annotations

import json
import logging

from models import DuplicateCheckResult, RescueResult, TriageAssessment
from services.llm_parsing import parse_json_maybe
from services.ngo_service import get_candidate_ngos, get_specialization_for_case
from tools.db_tool import GetDogByIdTool, GetRecentDogsTool
from tools.email_tool import SendRescueEmailTool
from tools.image_tool import DogImageAssessTool

logger = logging.getLogger(__name__)


def _build_fallback_triage(description: str) -> TriageAssessment:
    text = (description or "").lower()
    urgent_keywords = ["bleed", "injur", "hit", "limp", "wound", "fracture", "critical"]
    aggressive_keywords = ["aggressive", "attacking", "biting", "growling"]
    is_injured = any(keyword in text for keyword in urgent_keywords)
    is_aggressive = any(keyword in text for keyword in aggressive_keywords)
    priority = "urgent" if is_injured else "medium"

    return TriageAssessment(
        is_injured=is_injured,
        injury_description=description or None,
        estimated_age="unknown",
        is_aggressive=is_aggressive,
        visible_conditions=[],
        priority=priority,
        priority_reason="Fallback assessment used because the AI rescue pipeline was unavailable.",
        rescue_needed=is_injured,
        triage_reasoning="Generated from the reporter description because automated triage failed.",
    )


def _run_triage(image_base64: str, description: str) -> TriageAssessment:
    try:
        payload = parse_json_maybe(
            DogImageAssessTool(image_base64=image_base64, description=description)._run()
        )
        return TriageAssessment.model_validate(payload)
    except Exception:
        logger.exception("Image triage failed; using fallback triage")
        return _build_fallback_triage(description)


def _run_duplicate_check(latitude: float, longitude: float, dog_id: str) -> DuplicateCheckResult:
    try:
        payload = json.loads(GetRecentDogsTool()._run(latitude=latitude, longitude=longitude, radius_km=0.15))
        candidates = [item for item in payload if item.get("id") and item.get("id") != dog_id]
        if not candidates:
            return DuplicateCheckResult()

        nearest = sorted(
            candidates,
            key=lambda item: item.get("distance_km") if item.get("distance_km") is not None else 99999,
        )[0]
        distance_km = nearest.get("distance_km")
        if distance_km is None:
            return DuplicateCheckResult()

        if distance_km <= 0.05:
            confidence = "high"
        elif distance_km <= 0.12:
            confidence = "medium"
        else:
            confidence = "low"

        return DuplicateCheckResult(
            is_duplicate=confidence != "low",
            duplicate_of_id=nearest.get("id"),
            confidence=confidence,
            reasoning=f"Nearest recent report is {distance_km:.3f} km away.",
        )
    except Exception:
        logger.exception("Duplicate detection failed")
        return DuplicateCheckResult()


def _send_rescue_email(ngo_name: str, ngo_email: str, dog_id: str, address: str, triage: TriageAssessment) -> tuple[bool, str]:
    subject = f"Urgent dog rescue request: {triage.priority} priority"
    body = (
        f"Dog ID: {dog_id}\n"
        f"Location: {address}\n"
        f"Priority: {triage.priority}\n"
        f"Injured: {'yes' if triage.is_injured else 'no'}\n"
        f"Aggressive: {'yes' if triage.is_aggressive else 'no'}\n"
        f"Assessment: {triage.injury_description or triage.priority_reason or 'Assessment attached in system.'}\n"
        "Please confirm if your team can respond."
    )

    try:
        result = json.loads(
            SendRescueEmailTool()._run(
                to_email=ngo_email,
                to_name=ngo_name,
                subject=subject,
                body=body,
            )
        )
        return bool(result.get("success")), body
    except Exception:
        logger.exception("Rescue email sending failed")
        return False, body


def run_rescue_crew(
    image_base64: str,
    latitude: float,
    longitude: float,
    address: str,
    description: str,
    dog_id: str,
) -> dict[str, object]:
    triage = _run_triage(image_base64=image_base64, description=description)
    duplicate_check = _run_duplicate_check(latitude=latitude, longitude=longitude, dog_id=dog_id)

    if duplicate_check.is_duplicate and duplicate_check.confidence != "low":
        return {
            "triage": triage.model_dump(),
            "duplicate_check": duplicate_check.model_dump(),
            "rescue": RescueResult(
                status="reported",
                reasoning="Possible duplicate detected, so automatic dispatch was skipped.",
            ).model_dump(),
        }

    specialization = get_specialization_for_case(
        triage.priority,
        description,
        triage.visible_conditions,
    )
    ngos = get_candidate_ngos(latitude, longitude, specialization=specialization)

    if not triage.rescue_needed or not ngos:
        return {
            "triage": triage.model_dump(),
            "duplicate_check": duplicate_check.model_dump(),
            "rescue": RescueResult(
                status="monitoring" if not triage.rescue_needed else "reported",
                reasoning=(
                    "Rescue dispatch was not required based on triage."
                    if not triage.rescue_needed
                    else "No NGO candidates were available for automatic dispatch."
                ),
            ).model_dump(),
        }

    top_ngo = ngos[0]
    email_sent, email_body = _send_rescue_email(
        ngo_name=top_ngo.get("name", ""),
        ngo_email=top_ngo.get("email", ""),
        dog_id=dog_id,
        address=address,
        triage=triage,
    )

    rescue = RescueResult(
        rescue_dispatched=email_sent,
        ngo_name=top_ngo.get("name", ""),
        ngo_email=top_ngo.get("email", ""),
        email_sent=email_sent,
        status_updated=email_sent,
        status="rescue_dispatched" if email_sent else "reported",
        email_body=email_body,
        actions_taken=(
            [f"Selected NGO: {top_ngo.get('name', 'unknown')}", "Sent rescue request email"]
            if email_sent
            else [f"Selected NGO: {top_ngo.get('name', 'unknown')}", "Prepared rescue request email"]
        ),
        reasoning=(
            "Auto-dispatched to the nearest matching NGO."
            if email_sent
            else "Prepared a dispatch for the nearest matching NGO, but the email send failed."
        ),
    )

    return {
        "triage": triage.model_dump(),
        "duplicate_check": duplicate_check.model_dump(),
        "rescue": rescue.model_dump(),
    }


def run_followup_crew(dog_id: str, latitude: float, longitude: float) -> dict[str, object]:
    try:
        dog_record = json.loads(GetDogByIdTool()._run(dog_id=dog_id))
    except Exception:
        logger.exception("Failed to load dog record for follow-up")
        return RescueResult(status="reported").model_dump()

    if dog_record.get("status") == "rescued":
        return RescueResult(status="rescued", reasoning="Dog is already marked as rescued.").model_dump()

    ngos = get_candidate_ngos(latitude, longitude, specialization="general")
    if not ngos:
        return RescueResult(status="reported", reasoning="No backup NGOs available for follow-up.").model_dump()

    top_ngo = ngos[0]
    email_sent, email_body = _send_rescue_email(
        ngo_name=top_ngo.get("name", ""),
        ngo_email=top_ngo.get("email", ""),
        dog_id=dog_id,
        address=dog_record.get("location_address") or "Location unavailable",
        triage=TriageAssessment(
            priority=dog_record.get("priority") or "medium",
            is_injured=bool(dog_record.get("is_injured")),
            injury_description=dog_record.get("condition"),
            rescue_needed=bool(dog_record.get("rescue_needed")),
        ),
    )

    return RescueResult(
        rescue_dispatched=email_sent,
        ngo_name=top_ngo.get("name", ""),
        ngo_email=top_ngo.get("email", ""),
        email_sent=email_sent,
        status_updated=email_sent,
        status="rescue_dispatched" if email_sent else "reported",
        email_body=email_body,
        actions_taken=["Follow-up review completed", "Backup rescue email attempted"],
        reasoning="Performed a lightweight backup follow-up flow without CrewAI.",
    ).model_dump()
