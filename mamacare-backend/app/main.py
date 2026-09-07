import os
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from . import models, schemas
from .database import engine, get_db
from .risk_engine import assess_risk
from .calle_prompts import build_screening_task, SCREENING_RESULT_SCHEMA
from . import calle_client

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MamaCare AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your deployed frontend URL before submission
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Mothers ----------

@app.post("/mothers", response_model=schemas.MotherOut)
def create_mother(mother: schemas.MotherCreate, db: Session = Depends(get_db)):
    if not mother.consent_given:
        raise HTTPException(status_code=400, detail="Consent is required to register a mother")

    mother_data = mother.model_dump(exclude={"pregnancy"})
    db_mother = models.Mother(**mother_data)
    db.add(db_mother)
    db.commit()
    db.refresh(db_mother)

    if mother.pregnancy:
        db_pregnancy = models.Pregnancy(mother_id=db_mother.id, **mother.pregnancy.model_dump())
        db.add(db_pregnancy)

    # Auto-generate the postnatal follow-up schedule
    for offset, label in [(3, "Day 3"), (7, "Day 7"), (42, "Week 6")]:
        db.add(models.Schedule(
            mother_id=db_mother.id,
            scheduled_date=db_mother.delivery_date + timedelta(days=offset),
            label=label,
        ))
    db.commit()

    return db_mother


@app.get("/mothers", response_model=list[schemas.MotherOut])
def list_mothers(db: Session = Depends(get_db)):
    return db.query(models.Mother).order_by(models.Mother.created_at.desc()).all()


@app.get("/mothers/{mother_id}/schedules", response_model=list[schemas.ScheduleOut])
def get_mother_schedules(mother_id: int, db: Session = Depends(get_db)):
    return db.query(models.Schedule).filter(models.Schedule.mother_id == mother_id).all()


# ---------- Schedules / Calls ----------

@app.get("/schedules", response_model=list[schemas.ScheduleOut])
def list_schedules(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Schedule)
    if status:
        query = query.filter(models.Schedule.status == status)
    return query.all()


@app.post("/schedules/{schedule_id}/trigger-call")
def trigger_call(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    mother = db.query(models.Mother).filter(models.Mother.id == schedule.mother_id).first()
    pregnancy = db.query(models.Pregnancy).filter(models.Pregnancy.mother_id == mother.id).first()

    # Pull the most recent previous call for this mother, for "memory"
    previous_log = (
        db.query(models.CallLog)
        .join(models.Schedule, models.CallLog.schedule_id == models.Schedule.id)
        .filter(models.Schedule.mother_id == mother.id)
        .order_by(models.CallLog.called_at.desc())
        .first()
    )
    previous_summary = previous_log.transcript_summary if previous_log else None
    is_c_section = bool(pregnancy and pregnancy.delivery_type == "c_section")

    task = build_screening_task(
        mother_name=mother.name,
        is_c_section=is_c_section,
        previous_call_summary=previous_summary,
    )

    webhook_base = os.getenv("WEBHOOK_BASE_URL", "http://127.0.0.1:8000")

    try:
        result = calle_client.start_call(
            phone=mother.phone,
            task=task,
            result_schema=SCREENING_RESULT_SCHEMA,
            webhook_url=f"{webhook_base}/webhooks/call-complete",
            schedule_id=schedule.id,
        )
    except Exception as e:
        schedule.attempt_count += 1
        db.commit()
        raise HTTPException(status_code=502, detail=f"CALL-E request failed: {e}")

    schedule.attempt_count += 1
    db.commit()

    return {"status": "call_triggered", "calle_response": result}


# ---------- Webhook ----------

@app.post("/webhooks/call-complete")
def call_complete(payload: schemas.CallCompleteWebhook, db: Session = Depends(get_db)):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == payload.schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found for this webhook")

    answers = payload.extracted
    risk_tier, reason = assess_risk(answers)

    call_log = models.CallLog(
        schedule_id=schedule.id,
        call_id=payload.call_id,
        transcript_summary=answers.get("call_summary"),
        risk_answers=answers,
        risk_tier=risk_tier,
        risk_reason=reason,
        self_harm_flag=answers.get("self_harm_disclosed", False),
        emotional_flag=answers.get("emotional_concern", False),
    )
    db.add(call_log)
    schedule.status = "completed"
    db.commit()
    db.refresh(call_log)

    if risk_tier in ("urgent", "emergency"):
        db.add(models.Escalation(call_log_id=call_log.id, reason=reason))
        db.commit()

    return {"status": "processed", "risk_tier": risk_tier, "reason": reason}


@app.post("/schedules/{schedule_id}/mark-no-answer")
def mark_no_answer(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule.status = "no_answer" if schedule.attempt_count >= 3 else "pending"
    db.commit()
    return {"status": schedule.status, "attempt_count": schedule.attempt_count}


# ---------- Call logs / Escalations ----------

@app.get("/call-logs", response_model=list[schemas.CallLogOut])
def list_call_logs(db: Session = Depends(get_db)):
    return db.query(models.CallLog).order_by(models.CallLog.called_at.desc()).all()


@app.get("/escalations", response_model=list[schemas.EscalationOut])
def list_escalations(db: Session = Depends(get_db)):
    return db.query(models.Escalation).order_by(models.Escalation.id.desc()).all()


@app.post("/escalations/{escalation_id}/resolve", response_model=schemas.EscalationOut)
def resolve_escalation(escalation_id: int, db: Session = Depends(get_db)):
    escalation = db.query(models.Escalation).filter(models.Escalation.id == escalation_id).first()
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    escalation.status = "resolved"
    db.commit()
    db.refresh(escalation)
    return escalation


@app.get("/")
def root():
    return {"status": "MamaCare AI backend running"}
