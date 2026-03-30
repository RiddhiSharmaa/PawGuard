from __future__ import annotations

import json
from typing import Any


def extract_json_object(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if not text:
        return "{}"

    if "```" in text:
        parts = text.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{") and candidate.endswith("}"):
                return candidate

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_json_maybe(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        return payload

    raw_text = str(payload or "").strip()
    json_text = extract_json_object(raw_text)
    try:
        loaded = json.loads(json_text)
        return loaded if isinstance(loaded, dict) else {"raw_output": loaded}
    except json.JSONDecodeError:
        return {"raw_output": raw_text}
