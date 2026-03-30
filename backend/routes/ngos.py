from __future__ import annotations

from fastapi import APIRouter

from services.supabase_service import get_client

router = APIRouter()


@router.get("/ngos")
def get_ngos():
    supabase = get_client()
    response = supabase.table("ngos").select("*").execute()
    print("DEBUG NGOS RESPONSE:", response)        # 👈 add this
    print("DEBUG NGOS DATA:", response.data)
    return response.data or []
