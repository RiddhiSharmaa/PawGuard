from __future__ import annotations

import logging
import os

from supabase import Client, create_client

from config import load_backend_env

_client: Client | None = None
logger = logging.getLogger(__name__)


def _get_supabase_credentials() -> tuple[str | None, str | None]:
    load_backend_env()
    return (
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    )


def is_supabase_configured() -> bool:
    supabase_url, supabase_key = _get_supabase_credentials()
    return bool(supabase_url and supabase_key)


def get_client() -> Client:
    global _client
    if _client is None:
        supabase_url, supabase_key = _get_supabase_credentials()
        if not supabase_url or not supabase_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured.")
        _client = create_client(supabase_url, supabase_key)
    return _client


def get_client_safe() -> Client | None:
    try:
        return get_client()
    except Exception:
        logger.exception("Failed to initialize Supabase client")
        return None
