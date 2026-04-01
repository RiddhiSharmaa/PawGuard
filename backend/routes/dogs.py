from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from services.supabase_service import get_client_safe

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dogs")
def get_dogs():
    supabase = get_client_safe()
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase client is not configured for the backend.")

    try:
        response = supabase.table("dogs").select("*").order("reported_at", desc=True).execute()
        logger.info("Fetched %s dog reports from Supabase", len(response.data or []))
        return response.data or []
    except Exception as exc:
        logger.exception("Failed to fetch dog reports")
        raise HTTPException(status_code=503, detail=f"Failed to fetch dog reports from Supabase: {exc}") from exc


@router.get("/dogs/{dog_id}")
def get_dog(dog_id: str):
    supabase = get_client_safe()
    if supabase is None:
        raise HTTPException(status_code=503, detail="Dog report service is currently unavailable.")

    try:
        response = supabase.table("dogs").select("*").eq("id", dog_id).limit(1).execute()
    except Exception as exc:
        logger.exception("Failed to fetch dog report %s", dog_id)
        raise HTTPException(status_code=503, detail="Dog report lookup failed.") from exc

    if not response.data:
        raise HTTPException(status_code=404, detail="Dog report not found.")
    return response.data[0]
