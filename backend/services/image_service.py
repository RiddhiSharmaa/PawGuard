from __future__ import annotations

import base64
import logging
import mimetypes
import os
import uuid

from services.supabase_service import get_client

logger = logging.getLogger(__name__)


def encode_image_to_base64(image_bytes: bytes) -> str:
    return base64.standard_b64encode(image_bytes).decode("utf-8")


def upload_image_to_supabase(image_bytes: bytes, filename: str) -> str:
    supabase = get_client()
    ext = os.path.splitext(filename)[1] or ".jpg"
    content_type = mimetypes.guess_type(filename)[0] or "image/jpeg"
    unique_name = f"{uuid.uuid4()}{ext.lower()}"
    path = f"dogs/{unique_name}"

    try:
        supabase.storage.from_("dog-images").upload(
            path=path,
            file=image_bytes,
            file_options={"content-type": content_type, "upsert": False},
        )
        public_url = supabase.storage.from_("dog-images").get_public_url(path)
        if isinstance(public_url, dict):
            return public_url.get("publicUrl") or public_url.get("public_url") or path
        return public_url
    except Exception:
        logger.exception("Supabase storage upload failed for %s", path)
        raise
