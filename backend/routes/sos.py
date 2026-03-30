from __future__ import annotations

import json
import logging
import os

import google.genai as genai
from fastapi import APIRouter

from config import load_backend_env
from models import SOSRequest, SOSResponse
from services.llm_parsing import extract_json_object

router = APIRouter()
logger = logging.getLogger(__name__)


def build_fallback_sos(req: SOSRequest, reason: str) -> SOSResponse:
    symptom_text = " ".join(req.symptoms).lower()
    severity_text = req.severity.lower()
    high_risk = severity_text == "deep" or any(term in symptom_text for term in ("foaming", "unprovoked", "strange"))

    return SOSResponse(
        risk_level="high" if high_risk else "medium",
        risk_explanation=(
            "This is a fallback medical guidance response because the AI service was unavailable. "
            f"Reason: {reason}"
        ),
        immediate_steps=[
            "Wash the wound thoroughly with soap and running water for at least 15 minutes.",
            "Apply an antiseptic if available and avoid tightly bandaging the wound.",
            "Seek medical attention as soon as possible for rabies and tetanus evaluation.",
            "If possible, note the dog's behavior and location for follow-up.",
        ],
        seek_care_urgency="immediately" if high_risk else "within 24 hours",
        pep_recommended=high_risk or severity_text in {"bleeding", "deep"},
    )


@router.post("/sos", response_model=SOSResponse)
def sos_guidance(req: SOSRequest):
    load_backend_env()
    if not os.getenv("GEMINI_API_KEY"):
        return build_fallback_sos(req, "GEMINI_API_KEY is not configured.")

    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    except Exception as exc:
        logger.exception("Failed to initialize Gemini client for SOS guidance")
        return build_fallback_sos(req, str(exc))

    prompt = f"""You are an emergency medical triage assistant for dog bite cases in India.

Patient info:
- Bite location: {req.bite_location}
- Wound severity: {req.severity}
- Dog symptoms observed: {", ".join(req.symptoms) if req.symptoms else "none reported"}

Assess rabies risk and respond ONLY with a valid JSON object.
{{
  "risk_level": "high / medium / low",
  "risk_explanation": "2 sentence plain language explanation",
  "immediate_steps": ["step 1", "step 2", "step 3", "step 4"],
  "seek_care_urgency": "immediately / within 24 hours / within 72 hours / monitor at home",
  "pep_recommended": true or false
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[prompt],
        )
        raw = extract_json_object(response.text or "")
        return SOSResponse.model_validate(json.loads(raw))
    except Exception as exc:
        logger.exception("Gemini SOS guidance failed")
        return build_fallback_sos(req, str(exc))
        
# from __future__ import annotations

# import json
# import os

# import google.genai as genai
# from fastapi import APIRouter, HTTPException

# from models import SOSRequest, SOSResponse
# from services.llm_parsing import extract_json_object

# # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# router = APIRouter()


# @router.post("/sos", response_model=SOSResponse)
# def sos_guidance(req: SOSRequest):
#     if not os.getenv("GEMINI_API_KEY"):
#         raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

#     model = genai.GenerativeModel("gemini-1.5-flash")
#     prompt = f"""You are an emergency medical triage assistant for dog bite cases in India.

# Patient info:
# - Bite location: {req.bite_location}
# - Wound severity: {req.severity}
# - Dog symptoms observed: {", ".join(req.symptoms) if req.symptoms else "none reported"}

# Assess rabies risk and respond ONLY with a valid JSON object.
# {{
#   "risk_level": "high / medium / low",
#   "risk_explanation": "2 sentence plain language explanation",
#   "immediate_steps": ["step 1", "step 2", "step 3", "step 4"],
#   "seek_care_urgency": "immediately / within 24 hours / within 72 hours / monitor at home",
#   "pep_recommended": true or false
# }}"""

#     response = model.generate_content(prompt)
#     raw = extract_json_object(response.text or "")
#     try:
#         return SOSResponse.model_validate(json.loads(raw))
#     except json.JSONDecodeError as exc:
#         raise HTTPException(status_code=502, detail=f"Gemini returned invalid JSON: {exc}") from exc
