from __future__ import annotations

import logging

from fastapi import APIRouter

from services.supabase_service import get_client_safe

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ngos")
def get_ngos():
    supabase = get_client_safe()
    if supabase is None:
        return []

    try:
        response = supabase.table("ngos").select("*").execute()
        return response.data or []
    except Exception:
        logger.exception("Failed to fetch NGOs")
        return []
