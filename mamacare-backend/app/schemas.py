from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Any


class PregnancyIn(BaseModel):
    delivery_type: Optional[str] = None  # "vaginal" | "c_section"
    known_risk_factors: Optional[str] = None
    preferred_language: Optional[str] = "English"


class MotherCreate(BaseModel):
    name: str
    phone: str
    delivery_date: date
    consent_given: bool
    pregnancy: Optional[PregnancyIn] = None


class MotherOut(BaseModel):
    id: int
    name: str
    phone: str
    delivery_date: date
    consent_given: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleOut(BaseModel):
    id: int
    mother_id: int
    scheduled_date: date
    label: str
    status: str
    attempt_count: int

    class Config:
        from_attributes = True


class CallLogOut(BaseModel):
    id: int
    schedule_id: int
    call_id: Optional[str] = None
    transcript_summary: Optional[str] = None
    risk_answers: Optional[dict[str, Any]] = None
    risk_tier: Optional[str] = None
    risk_reason: Optional[str] = None
    self_harm_flag: bool
    emotional_flag: bool
    called_at: datetime

    class Config:
        from_attributes = True


class EscalationOut(BaseModel):
    id: int
    call_log_id: int
    status: str
    reason: Optional[str] = None
    notified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CallCompleteWebhook(BaseModel):
    """Shape of the payload MamaCare's own trigger-call endpoint sends to
    /webhooks/call-complete. In production this is what you map CALL-E's
    real webhook payload into."""
    schedule_id: int
    call_id: Optional[str] = None
    extracted: dict[str, Any]
