from __future__ import annotations

import base64
import json
import logging
import os

import google.genai as genai
from pydantic import BaseModel, Field

try:
    from crewai.tools import BaseTool
except Exception:
    class BaseTool:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

from services.llm_parsing import extract_json_object

logger = logging.getLogger(__name__)


def _clip_text(value: str | None, limit: int = 140) -> str | None:
    text = (value or "").strip()
    if not text:
        return None
    if len(text) <= limit:
        return text
    return f"{text[: limit - 3]}..."


def _compact_assessment_payload(payload: dict) -> str:
    compact = {
        "is_injured": bool(payload.get("is_injured")),
        "injury_description": _clip_text(payload.get("injury_description")),
        "estimated_age": payload.get("estimated_age") or "unknown",
        "is_aggressive": bool(payload.get("is_aggressive")),
        "body_condition_score": payload.get("body_condition_score"),
        "body_condition_label": payload.get("body_condition_label"),
        "visible_conditions": [
            _clip_text(str(item), 40) for item in (payload.get("visible_conditions") or [])[:3]
            if _clip_text(str(item), 40)
        ],
        "priority": payload.get("priority") or "medium",
        "priority_reason": _clip_text(payload.get("priority_reason"), 120) or "",
        "rescue_needed": bool(payload.get("rescue_needed")),
        "triage_reasoning": _clip_text(payload.get("triage_reasoning"), 120) or "",
    }
    return json.dumps(compact)


class ImageAssessInput(BaseModel):
    image_base64: str | None = Field(default=None, description="Base64 encoded image of the dog")
    description: str | None = Field(default=None, description="Reporter's description of the situation")


class DogImageAssessTool(BaseTool):
    name: str = "assess_dog_image"
    description: str = (
        "Analyzes a dog image using Gemini Vision to assess injury severity, urgency, and "
        "condition. Returns structured JSON."
    )
    args_schema: type[BaseModel] = ImageAssessInput
    default_image_base64: str = ""
    default_description: str = ""

    def __init__(self, image_base64: str = "", description: str = "", **data):
        super().__init__(
            default_image_base64=image_base64,
            default_description=description,
            **data,
        )

    def _run(self, image_base64: str | None = None, description: str | None = None) -> str:
        image_base64 = image_base64 or self.default_image_base64
        description = (description or self.default_description or "").strip()[:280]

        if not os.getenv("GEMINI_API_KEY"):
            return json.dumps(
                {
                    "is_injured": False,
                    "injury_description": description or None,
                    "estimated_age": "unknown",
                    "is_aggressive": False,
                    "body_condition_score": None,
                    "body_condition_label": None,
                    "visible_conditions": [],
                    "priority": "medium",
                    "priority_reason": "Gemini is unavailable, so a safe fallback assessment was returned.",
                    "rescue_needed": False,
                    "triage_reasoning": "Image analysis was skipped because GEMINI_API_KEY is not configured.",
                }
            )

        try:
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            image_data = base64.b64decode(image_base64) if image_base64 else b""
        except Exception as exc:
            logger.exception("Failed to prepare image payload for Gemini")
            return json.dumps(
                {
                    "is_injured": False,
                    "injury_description": description or None,
                    "estimated_age": "unknown",
                    "is_aggressive": False,
                    "body_condition_score": None,
                    "body_condition_label": None,
                    "visible_conditions": [],
                    "priority": "medium",
                    "priority_reason": "The uploaded image could not be processed.",
                    "rescue_needed": False,
                    "triage_reasoning": f"Image analysis setup failed: {exc}",
                }
            )

        prompt = f"""Assess this stray dog emergency image.

Reporter note: {description or "No description provided"}

Respond ONLY as compact JSON.
{{
  "is_injured": true,
  "injury_description": "short phrase or null",
  "estimated_age": "puppy / young / adult / senior",
  "is_aggressive": false,
  "body_condition_score": 1,
  "body_condition_label": "emaciated / thin / normal / overweight",
  "visible_conditions": ["up to 3 short items"],
  "priority": "urgent / medium / low",
  "priority_reason": "one short sentence",
  "rescue_needed": true,
  "triage_reasoning": "one short sentence"
}}

Keep every string under 140 characters."""

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=[
                    genai.types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
                    prompt,
                ],
            )
            raw = extract_json_object(response.text or "")
            try:
                return _compact_assessment_payload(json.loads(raw))
            except Exception:
                return raw
        except Exception as exc:
            logger.exception("Gemini image assessment failed")
            return json.dumps(
                {
                    "is_injured": False,
                    "injury_description": description or None,
                    "estimated_age": "unknown",
                    "is_aggressive": False,
                    "body_condition_score": None,
                    "body_condition_label": None,
                    "visible_conditions": [],
                    "priority": "medium",
                    "priority_reason": "Automated image assessment failed, so the case needs manual review.",
                    "rescue_needed": False,
                    "triage_reasoning": f"Gemini image analysis failed: {exc}",
                }
            )

        
# from __future__ import annotations

# import base64
# import os

# import google.genai as genai
# from crewai.tools import BaseTool
# from pydantic import BaseModel, Field

# from services.llm_parsing import extract_json_object

# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# class ImageAssessInput(BaseModel):
#     image_base64: str = Field(description="Base64 encoded image of the dog")
#     description: str = Field(description="Reporter's description of the situation")


# class DogImageAssessTool(BaseTool):
#     name: str = "assess_dog_image"
#     description: str = (
#         "Analyzes a dog image using Gemini Vision to assess injury severity, urgency, and "
#         "condition. Returns structured JSON."
#     )
#     args_schema: type[BaseModel] = ImageAssessInput

#     def _run(self, image_base64: str, description: str) -> str:
#         if not os.getenv("GEMINI_API_KEY"):
#             raise RuntimeError("GEMINI_API_KEY is not configured.")

#         model = genai.GenerativeModel("gemini-1.5-flash")
#         image_data = base64.b64decode(image_base64)

#         prompt = f"""You are a veterinary triage specialist assessing a stray dog emergency.

# Reporter's description: {description}

# Analyze the image carefully and respond ONLY with a valid JSON object.
# {{
#   "is_injured": true,
#   "injury_description": "detailed description of visible injuries or null",
#   "estimated_age": "puppy / young / adult / senior",
#   "is_aggressive": false,
#   "body_condition_score": 1,
#   "body_condition_label": "emaciated / thin / normal / overweight",
#   "visible_conditions": ["list", "of", "conditions"],
#   "priority": "urgent / medium / low",
#   "priority_reason": "detailed reasoning for this priority level",
#   "rescue_needed": true,
#   "triage_reasoning": "your full reasoning process"
# }}

# Priority guidelines:
# - urgent: active bleeding, unable to move, severe trauma, very young puppy alone, seizures
# - medium: mange, malnourished, limping but mobile, visible wounds not life-threatening
# - low: healthy stray, minor issues, monitoring needed"""

#         response = model.generate_content(
#             [{"mime_type": "image/jpeg", "data": image_data}, prompt]
#         )
#         return extract_json_object(response.text or "")
