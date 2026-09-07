# MamaCare AI

An AI-powered postnatal follow-up system built on CALL-E. It calls postpartum mothers on a schedule (Day 3, Day 7, Week 6), screens for danger signs in mother and newborn, and escalates high-risk cases to a nurse — automatically, with an explainable reason attached to every escalation.

## The problem

Only about half of postpartum women in Kenya ever receive a follow-up check, despite Ministry of Health guidance recommending several. The gap is worst in poorer, more rural counties where clinics don't have staff capacity to call every mother due for a check-in. MamaCare AI uses CALL-E to close that reach gap.

## What's built vs. what's scoped out (read this before judging)

**Built and working end to end:**
- Mother registration with auto-generated Day 3 / Day 7 / Week 6 schedule
- CALL-E integration: task prompt + structured result_schema for the screening call
- Deterministic, explainable risk-tiering engine (routine / urgent / emergency) — tested with pytest
- Self-harm disclosure hard-override — bypasses all other scoring, always routes to immediate human handoff
- "Memory" — each call references what the mother said in her previous call
- Escalation tracking with a stated reason, not just a score
- React dashboard for clinic staff: register mothers, trigger calls, see outcomes color-coded by risk tier

**Deliberately out of scope for this MVP** (see Section 8 of the plan for why):
- Antenatal calling — pregnancy is tracked as context (delivery type feeds the postnatal wound question) but no calls are placed during pregnancy, to conserve CALL-E's call budget for the postpartum window where the drop-off problem is sharpest
- SMS reminders, multi-clinic support, authentication — not built; noted as v2 roadmap
- Swahili/multi-language calling — CALL-E's Kenya region is currently English-only; this is a known real-world limitation, not an oversight

## Stack

FastAPI + PostgreSQL (Neon/Supabase) + CALL-E API + React (Vite) + pytest

## Setup

### Backend

```bash
cd mamacare
pip install -r requirements.txt --break-system-packages
cp .env.example .env
# fill in DATABASE_URL and CALLE_API_KEY in .env
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` for the interactive API.

### Run tests

```bash
pytest tests/ -v
```

### Frontend

```bash
cd mamacare-frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Set `VITE_API_BASE` in a `.env` file there if your backend isn't on `127.0.0.1:8000`.

## Testing the pipeline without spending CALL-E credits

Before triggering any real call, test the webhook logic directly:

```bash
curl -X POST http://127.0.0.1:8000/webhooks/call-complete \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": 1,
    "call_id": "test123",
    "extracted": {
      "bleeding_concern": true,
      "fever": false,
      "headache_or_convulsions": false,
      "wound_concern": false,
      "emotional_concern": false,
      "self_harm_disclosed": false,
      "baby_feeding_well": true,
      "baby_breathing_normal": true,
      "call_summary": "Reported heavy bleeding"
    }
  }'
```

Expect `{"status": "processed", "risk_tier": "emergency"}`.

## Triggering a real call

Once a mother is registered and you have her `schedule_id` (via `GET /mothers/{id}/schedules`):

```bash
curl -X POST http://127.0.0.1:8000/schedules/{schedule_id}/trigger-call
```

This calls CALL-E's API with the screening task, the result_schema, and your webhook URL. Verify your `WEBHOOK_BASE_URL` in `.env` is a publicly reachable URL (e.g. your deployed Render backend, or an ngrok tunnel for local testing) — CALL-E needs to be able to reach it to deliver the result.

## Data model

- `mothers` — name, phone, delivery date, consent
- `pregnancies` — delivery type, risk factors, language (context only, no calls)
- `schedules` — Day 3 / Day 7 / Week 6, status, attempt count
- `call_logs` — full structured answers, risk tier, risk reason, self-harm/emotional flags
- `escalations` — status, reason, linked to the call that triggered it

## Risk tiering logic

See `app/risk_engine.py` — fully deterministic and unit tested (`tests/test_risk_engine.py`). Self-harm disclosure always overrides every other signal and routes to immediate human handoff, never conversational scoring.
