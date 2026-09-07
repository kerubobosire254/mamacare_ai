from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from .database import Base


class Mother(Base):
    __tablename__ = "mothers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    delivery_date = Column(Date, nullable=False)
    consent_given = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Pregnancy(Base):
    """Lightweight context record. Not called during pregnancy in the MVP —
    used to personalize postnatal calls (e.g. C-section wound question)."""
    __tablename__ = "pregnancies"

    id = Column(Integer, primary_key=True, index=True)
    mother_id = Column(Integer, ForeignKey("mothers.id"), nullable=False)
    delivery_type = Column(String, nullable=True)  # "vaginal" or "c_section"
    known_risk_factors = Column(String, nullable=True)
    preferred_language = Column(String, default="English")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    mother_id = Column(Integer, ForeignKey("mothers.id"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    label = Column(String, default="")  # "Day 3", "Day 7", "Week 6"
    status = Column(String, default="pending")  # pending / completed / missed / no_answer
    attempt_count = Column(Integer, default=0)


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    call_id = Column(String, nullable=True)
    transcript_summary = Column(String, nullable=True)
    risk_answers = Column(JSON, nullable=True)
    risk_tier = Column(String, nullable=True)  # routine / urgent / emergency
    risk_reason = Column(String, nullable=True)
    self_harm_flag = Column(Boolean, default=False)
    emotional_flag = Column(Boolean, default=False)
    called_at = Column(DateTime(timezone=True), server_default=func.now())


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True)
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    status = Column(String, default="pending")  # pending / nurse_notified / resolved
    reason = Column(String, nullable=True)
    notified_at = Column(DateTime(timezone=True), nullable=True)
