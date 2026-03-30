from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


PriorityLevel = Literal["urgent", "medium", "low"]
DogStatus = Literal["processing", "reported", "monitoring", "rescue_dispatched", "rescued"]


class TriageAssessment(BaseModel):
    is_injured: bool = False
    injury_description: str | None = None
    estimated_age: str = "unknown"
    is_aggressive: bool = False
    body_condition_score: int | None = None
    body_condition_label: str | None = None
    visible_conditions: list[str] = Field(default_factory=list)
    priority: PriorityLevel = "medium"
    priority_reason: str = ""
    rescue_needed: bool = False
    triage_reasoning: str = ""


class DuplicateCheckResult(BaseModel):
    is_duplicate: bool = False
    duplicate_of_id: str | None = None
    confidence: Literal["high", "medium", "low"] = "low"
    reasoning: str = ""


class RescueResult(BaseModel):
    rescue_dispatched: bool = False
    ngo_name: str = ""
    ngo_email: str = ""
    email_sent: bool = False
    status_updated: bool = False
    status: DogStatus = "reported"
    email_body: str = ""
    actions_taken: list[str] = Field(default_factory=list)
    reasoning: str = ""


class ReportResponse(BaseModel):
    dog_id: str
    status: Literal["success", "duplicate"] = "success"
    assessment: TriageAssessment
    rescue_dispatched: bool = False
    ngo_name: str = ""
    is_duplicate: bool = False
    possible_ngos: list[dict[str, Any]] = Field(default_factory=list)
    status_updates: list[str] = Field(default_factory=list)
    agent_reasoning: dict[str, Any] = Field(default_factory=dict)


class SOSRequest(BaseModel):
    bite_location: str
    severity: str
    symptoms: list[str]
    lat: float = 28.6139
    lng: float = 77.2090


class SOSResponse(BaseModel):
    risk_level: Literal["high", "medium", "low"]
    risk_explanation: str
    immediate_steps: list[str]
    seek_care_urgency: Literal["immediately", "within 24 hours", "within 72 hours", "monitor at home"]
    pep_recommended: bool
