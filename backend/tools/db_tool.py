from __future__ import annotations

import json
import logging
import math
from datetime import datetime, timezone

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from services.supabase_service import get_client

logger = logging.getLogger(__name__)


def _truncate_text(value: str | None, limit: int = 120) -> str:
    text = (value or "").strip()
    if len(text) <= limit:
        return text
    return f"{text[: limit - 3]}..."


def _summarize_dog_record(dog: dict) -> dict:
    return {
        "id": dog.get("id"),
        "distance_km": dog.get("distance_km"),
        "reported_at": dog.get("reported_at"),
        "priority": dog.get("priority"),
        "status": dog.get("status"),
        "is_injured": bool(dog.get("is_injured")),
        "rescue_needed": bool(dog.get("rescue_needed")),
        "condition": _truncate_text(dog.get("condition") or dog.get("description")),
        "location_address": _truncate_text(dog.get("location_address"), 80),
    }


def _summarize_ngo_record(ngo: dict) -> dict:
    return {
        "name": ngo.get("name"),
        "email": ngo.get("email"),
        "phone": ngo.get("phone"),
        "specialization": ngo.get("specialization"),
        "distance_km": ngo.get("distance_km"),
        "city": ngo.get("city") or ngo.get("coverage_area"),
    }

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return radius_km * 2 * math.asin(math.sqrt(a))


class GetRecentDogsInput(BaseModel):
    latitude: float = Field(description="Latitude of the new report")
    longitude: float = Field(description="Longitude of the new report")
    radius_km: float = Field(default=0.15, description="Search radius in kilometers")


class GetNGOsInput(BaseModel):
    latitude: float = Field(description="Latitude to find nearest NGOs")
    longitude: float = Field(description="Longitude to find nearest NGOs")
    specialization: str = Field(default="any", description="injured / abandoned / general / any")


class UpdateDogStatusInput(BaseModel):
    dog_id: str = Field(description="UUID of the dog record to update")
    status: str = Field(description="New status: rescue_dispatched / rescued / monitoring / reported")
    ngo_name: str = Field(default="", description="Name of NGO contacted")
    ngo_email: str = Field(default="", description="Email of NGO contacted")
    rescue_email_body: str = Field(default="", description="The email body that was sent")


class GetDogByIdInput(BaseModel):
    dog_id: str = Field(description="UUID of the dog report")


class GetRecentDogsTool(BaseTool):
    name: str = "get_recent_dogs_nearby"
    description: str = (
        "Retrieves recent dog reports within a radius of given coordinates. Used to check "
        "for duplicate reports or nearby active cases."
    )
    args_schema: type[BaseModel] = GetRecentDogsInput

    def _run(self, latitude: float, longitude: float, radius_km: float = 0.15) -> str:
        try:
            supabase = get_client()
            response = (
                supabase.table("dogs")
                .select("*")
                .order("reported_at", desc=True)
                .limit(50)
                .execute()
            )
        except Exception as exc:
            logger.exception("Failed to read recent dogs for duplicate detection")
            return json.dumps({"error": str(exc), "results": []}, default=str)

        nearby: list[dict] = []
        for dog in response.data or []:
            if dog.get("latitude") is None or dog.get("longitude") is None:
                continue
            dist = haversine(latitude, longitude, dog["latitude"], dog["longitude"])
            if dist <= radius_km:
                dog["distance_km"] = round(dist, 3)
                nearby.append(_summarize_dog_record(dog))
        return json.dumps(nearby[:8], default=str)


class GetDogByIdTool(BaseTool):
    name: str = "get_dog_by_id"
    description: str = "Fetches a single dog report by id so follow-up can inspect current status."
    args_schema: type[BaseModel] = GetDogByIdInput

    def _run(self, dog_id: str) -> str:
        try:
            supabase = get_client()
            response = supabase.table("dogs").select("*").eq("id", dog_id).limit(1).execute()
            data = response.data[0] if response.data else {}
            return json.dumps(_summarize_dog_record(data) if data else {}, default=str)
        except Exception as exc:
            logger.exception("Failed to fetch dog %s for follow-up", dog_id)
            return json.dumps({"error": str(exc), "dog_id": dog_id}, default=str)


class GetNGOsTool(BaseTool):
    name: str = "get_ngos_by_location"
    description: str = (
        "Retrieves NGOs sorted by distance from given coordinates, optionally filtered by "
        "specialization."
    )
    args_schema: type[BaseModel] = GetNGOsInput

    def _run(self, latitude: float, longitude: float, specialization: str = "any") -> str:
        try:
            supabase = get_client()
            query = supabase.table("ngos").select("*")
            if specialization != "any":
                query = query.or_(f"specialization.eq.{specialization},specialization.eq.general")
            response = query.execute()
            ngos = response.data or []
        except Exception as exc:
            logger.exception("Failed to fetch NGOs for rescue coordination")
            return json.dumps({"error": str(exc), "results": []}, default=str)

        for ngo in ngos:
            if ngo.get("latitude") is None or ngo.get("longitude") is None:
                ngo["distance_km"] = None
            else:
                ngo["distance_km"] = round(
                    haversine(latitude, longitude, ngo["latitude"], ngo["longitude"]), 2
                )
        ngos.sort(key=lambda item: item["distance_km"] if item["distance_km"] is not None else 99999)
        return json.dumps([_summarize_ngo_record(ngo) for ngo in ngos[:3]], default=str)


class UpdateDogStatusTool(BaseTool):
    name: str = "update_dog_status"
    description: str = "Updates a dog record's rescue status in the database after action has been taken."
    args_schema: type[BaseModel] = UpdateDogStatusInput

    def _run(
        self,
        dog_id: str,
        status: str,
        ngo_name: str = "",
        ngo_email: str = "",
        rescue_email_body: str = "",
    ) -> str:
        try:
            supabase = get_client()
            update_data: dict[str, str] = {
                "status": status,
                "followup_at": datetime.now(timezone.utc).isoformat(),
            }
            if ngo_name:
                update_data["ngo_name"] = ngo_name
            if ngo_email:
                update_data["ngo_email"] = ngo_email
            if rescue_email_body:
                update_data["rescue_email_body"] = rescue_email_body

            supabase.table("dogs").update(update_data).eq("id", dog_id).execute()
            return json.dumps({"success": True, "dog_id": dog_id, "new_status": status})
        except Exception as exc:
            logger.exception("Failed to update dog status for %s", dog_id)
            return json.dumps({"success": False, "dog_id": dog_id, "error": str(exc)}, default=str)
