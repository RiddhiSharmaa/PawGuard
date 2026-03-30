from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from crew.rescue_crew import run_followup_crew, run_rescue_crew
from models import DuplicateCheckResult, ReportResponse, RescueResult, TriageAssessment
from services.image_service import encode_image_to_base64, upload_image_to_supabase
from services.ngo_service import get_candidate_ngos, get_specialization_for_case
from services.supabase_service import get_client_safe

router = APIRouter()
logger = logging.getLogger(__name__)


def build_fallback_triage(description: str) -> TriageAssessment:
    text = description.lower()
    urgent_keywords = ["bleed", "injur", "hit", "limp", "wound", "fracture", "critical"]
    aggressive_keywords = ["aggressive", "attacking", "biting", "growling"]

    is_injured = any(keyword in text for keyword in urgent_keywords)
    is_aggressive = any(keyword in text for keyword in aggressive_keywords)
    priority = "urgent" if is_injured else "medium"

    return TriageAssessment(
        is_injured=is_injured,
        injury_description=description if description and description != "No description provided" else None,
        estimated_age="unknown",
        is_aggressive=is_aggressive,
        visible_conditions=[],
        priority=priority,
        priority_reason="Fallback assessment used because the AI rescue pipeline was unavailable.",
        rescue_needed=is_injured,
        triage_reasoning="Generated from the reporter description because automated triage failed.",
    )


def normalize_rescue_result(rescue_data: RescueResult, possible_ngos: list[dict[str, Any]]) -> RescueResult:
    if rescue_data.ngo_name or not possible_ngos:
        return rescue_data

    top_ngo = possible_ngos[0]
    rescue_data.ngo_name = top_ngo.get("name", "")
    rescue_data.ngo_email = top_ngo.get("email", "")
    if not rescue_data.reasoning:
        rescue_data.reasoning = "Using the nearest NGO suggestion because automated coordination was incomplete."
    return rescue_data


def build_status_updates(
    image_url: str,
    triage_data: TriageAssessment,
    duplicate_data: DuplicateCheckResult,
    rescue_data: RescueResult,
    possible_ngos: list[dict[str, Any]],
) -> list[str]:
    updates = ["Report received and queued for triage."]
    updates.append("Image uploaded successfully." if image_url else "Image could not be stored, but the report was still accepted.")
    updates.append(f"Triage completed with {triage_data.priority} priority.")

    if duplicate_data.is_duplicate and duplicate_data.confidence != "low":
        updates.append("Possible duplicate detected, so a second dispatch was avoided.")
    elif rescue_data.rescue_dispatched:
        ngo_label = rescue_data.ngo_name or "a rescue partner"
        updates.append(f"Rescue dispatch was initiated through {ngo_label}.")
    elif possible_ngos:
        updates.append("Rescue was not auto-dispatched; nearby NGO suggestions were attached for follow-up.")
    else:
        updates.append("No NGO suggestions were available from the current data sources.")

    return updates


def get_supabase_safe():
    try:
        return get_client_safe()
    except Exception:
        logger.exception("Failed to initialize Supabase client")
        return None


def persist_initial_report(
    supabase: Any,
    dog_id: str,
    image_url: str,
    latitude: float,
    longitude: float,
    address: str,
    description: str,
    now: datetime,
) -> None:
    if supabase is None:
        return

    try:
        supabase.table("dogs").insert(
            {
                "id": dog_id,
                "image_url": image_url,
                "latitude": latitude,
                "longitude": longitude,
                "location_address": address,
                "description": description,
                "status": "processing",
                "reported_at": now.isoformat(),
                "followup_at": (now + timedelta(hours=1)).isoformat(),
            }
        ).execute()
    except Exception:
        logger.exception("Initial dog insert failed for dog report %s", dog_id)


def persist_final_report(
    supabase: Any,
    dog_id: str,
    triage_data: TriageAssessment,
    duplicate_data: DuplicateCheckResult,
    rescue_data: RescueResult,
    final_status: str,
) -> None:
    if supabase is None:
        return

    condition = (
        triage_data.injury_description
        or triage_data.body_condition_label
        or ", ".join(triage_data.visible_conditions or [])
        or "Assessment completed"
    )

    try:
        supabase.table("dogs").update(
            {
                "priority": triage_data.priority,
                "is_injured": triage_data.is_injured,
                "is_aggressive": triage_data.is_aggressive,
                "estimated_age": triage_data.estimated_age,
                "condition": condition,
                "rescue_needed": triage_data.rescue_needed,
                "triage_reasoning": triage_data.triage_reasoning,
                "status": final_status,
                "ngo_name": rescue_data.ngo_name,
                "ngo_email": rescue_data.ngo_email,
                "rescue_email_body": rescue_data.email_body,
                "is_duplicate": duplicate_data.is_duplicate,
            }
        ).eq("id", dog_id).execute()
    except Exception:
        logger.exception("Dog update failed for dog report %s", dog_id)


@router.post("/report", response_model=ReportResponse)
async def report_dog(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    description: str = Form(default="No description provided"),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    # image_base64 = encode_image_to_base64(image_bytes)
    try:
        image_base64 = encode_image_to_base64(image_bytes)
    except Exception:
        logger.exception("Image encoding failed")
        image_base64 = ""
    dog_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    image_url = ""

    supabase = get_supabase_safe()
    if supabase is not None:
        try:
            image_url = upload_image_to_supabase(image_bytes, image.filename or "dog.jpg")
        except Exception:
            logger.exception("Image upload failed for dog report %s", dog_id)
    persist_initial_report(supabase, dog_id, image_url, latitude, longitude, address, description, now)

    triage_data = build_fallback_triage(description)
    duplicate_data = DuplicateCheckResult()
    rescue_data = RescueResult(status="reported")
    possible_ngos: list[dict[str, Any]] = []

    try:
        crew_result = run_rescue_crew(
            image_base64=image_base64,
            latitude=latitude,
            longitude=longitude,
            address=address,
            description=description,
            dog_id=dog_id,
        )
        # triage_data = TriageAssessment.model_validate(crew_result.get("triage", {}))
        try:
            triage_data = TriageAssessment.model_validate(crew_result.get("triage", {}))
        except Exception:
            logger.exception("Triage parsing failed, using fallback")
            triage_data = build_fallback_triage(description)
        try:
            duplicate_data = DuplicateCheckResult.model_validate(crew_result.get("duplicate_check", {}))
        except Exception:
            logger.exception("Duplicate parsing failed")
            duplicate_data = DuplicateCheckResult()

        try:
            rescue_data = RescueResult.model_validate(crew_result.get("rescue", {}))
        except Exception:
            logger.exception("Rescue parsing failed")
            rescue_data = RescueResult(status="reported")
    except Exception:
        logger.exception("AI rescue crew failed for dog report %s", dog_id)

    specialization = get_specialization_for_case(
        triage_data.priority,
        description,
        triage_data.visible_conditions,
    )
    possible_ngos = get_candidate_ngos(latitude, longitude, specialization=specialization)
    rescue_data = normalize_rescue_result(rescue_data, possible_ngos)

    final_status = rescue_data.status
    if duplicate_data.is_duplicate and duplicate_data.confidence != "low":
        final_status = "reported"
    elif rescue_data.status == "monitoring":
        final_status = "monitoring"
    elif not rescue_data.status_updated and rescue_data.rescue_dispatched:
        final_status = "reported"
    elif rescue_data.rescue_dispatched:
        final_status = "rescue_dispatched"

    persist_final_report(supabase, dog_id, triage_data, duplicate_data, rescue_data, final_status)

    if rescue_data.rescue_dispatched:
        background_tasks.add_task(schedule_followup, dog_id, latitude, longitude)

    status_updates = build_status_updates(
        image_url=image_url,
        triage_data=triage_data,
        duplicate_data=duplicate_data,
        rescue_data=rescue_data,
        possible_ngos=possible_ngos,
    )

    return ReportResponse(
        dog_id=dog_id,
        status="duplicate" if duplicate_data.is_duplicate and duplicate_data.confidence != "low" else "success",
        assessment=triage_data,
        rescue_dispatched=rescue_data.rescue_dispatched,
        ngo_name=rescue_data.ngo_name,
        is_duplicate=duplicate_data.is_duplicate,
        possible_ngos=possible_ngos,
        status_updates=status_updates,
        agent_reasoning={
            "triage": triage_data.triage_reasoning,
            "duplicate": duplicate_data.reasoning,
            "rescue_actions": rescue_data.actions_taken,
            "rescue_reasoning": rescue_data.reasoning,
        },
    )


async def schedule_followup(dog_id: str, latitude: float, longitude: float) -> None:
    await asyncio.sleep(3600)
    try:
        run_followup_crew(dog_id=dog_id, latitude=latitude, longitude=longitude)
    except Exception:
        logger.exception("Follow-up crew failed for dog %s", dog_id)
