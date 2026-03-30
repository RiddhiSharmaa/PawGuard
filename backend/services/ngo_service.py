from __future__ import annotations

import logging
from typing import Any

from services.supabase_service import get_client_safe
from tools.db_tool import haversine

logger = logging.getLogger(__name__)


def get_specialization_for_case(priority: str, description: str, visible_conditions: list[str]) -> str:
    normalized = " ".join([priority, description, *visible_conditions]).lower()
    if any(keyword in normalized for keyword in ("puppy", "abandoned", "alone")):
        return "abandoned"
    if any(keyword in normalized for keyword in ("injur", "bleed", "wound", "limp", "fracture", "trauma")):
        return "injured"
    return "general"


def get_candidate_ngos(
    latitude: float,
    longitude: float,
    specialization: str = "general",
    limit: int = 3,
) -> list[dict[str, Any]]:
    supabase = get_client_safe()
    if supabase is None:
        return []

    try:
        query = supabase.table("ngos").select("*")
        if specialization and specialization != "any":
            query = query.or_(f"specialization.eq.{specialization},specialization.eq.general")

        response = query.execute()
        ngos = response.data or []
    except Exception:
        logger.exception("Failed to load NGO candidates from Supabase")
        return []

    ranked: list[dict[str, Any]] = []
    for ngo in ngos:
        ngo_lat = ngo.get("latitude")
        ngo_lng = ngo.get("longitude")
        distance_km = None
        if ngo_lat is not None and ngo_lng is not None:
            distance_km = round(haversine(latitude, longitude, ngo_lat, ngo_lng), 2)

        ranked.append(
            {
                "name": ngo.get("name", ""),
                "email": ngo.get("email", ""),
                "phone": ngo.get("phone", ""),
                "specialization": ngo.get("specialization", "general"),
                "distance_km": distance_km,
                "coverage_area": ngo.get("coverage_area") or ngo.get("city") or "",
            }
        )

    ranked.sort(key=lambda item: item["distance_km"] if item["distance_km"] is not None else 99999)
    return ranked[:limit]
