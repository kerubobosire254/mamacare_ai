# MamaCare AI

Built for CALL-E: Your Code Is Calling, by Kerubo Bosire.

## The problem

For many mothers, leaving the hospital after childbirth does not mean the risk is over. The postpartum period is one of the most critical and vulnerable stages for both mother and baby, yet it remains one of the most neglected parts of the maternal healthcare journey.

In Kenya, maternal mortality remains high, with an estimated 355 maternal deaths per 100,000 live births, while preventable complications such as postpartum haemorrhage and hypertensive disorders continue to contribute substantially to maternal deaths. The danger is not only physical. Mothers can experience postpartum depression, infection, breastfeeding difficulties and other complications, while newborns face their own risks during the first days and weeks of life. Kenya's neonatal mortality rate is around 21 deaths per 1,000 live births.

The gap widens in rural and underserved communities, where distance and limited healthcare resources make it harder for a mother to return to a facility when something feels wrong.

The mother is home. The healthcare provider is at the facility. Neither may know what is happening in between.

## The solution

MamaCare bridges that gap. Instead of relying on every mother to return to the facility, or on healthcare workers to manually call every patient, MamaCare uses CALL-E to place scheduled check in calls to mothers after they leave hospital.

CALL-E is the piece that makes this possible. It is a platform that lets an application place real phone calls, hold a natural conversation around a goal you define, and return the conversation as structured data your system can act on. MamaCare gives CALL-E a screening goal, asking about bleeding, fever, wound healing, emotional wellbeing, and how the baby is feeding and breathing, and CALL-E handles the actual call. When it ends, CALL-E sends the answers back to MamaCare as structured data through a webhook.

From there, MamaCare's own risk engine decides what happens next. Routine answers close the loop quietly. Concerning answers get flagged as urgent or emergency, with the exact reason attached, and a nurse is alerted. If a mother discloses thoughts of self harm, the screening stops immediately and routes straight to a human, never scored like a normal symptom.

MamaCare does not replace doctors. It helps healthcare teams reach the mothers who may need them most, without needing the staff hours to call every single one by hand.

## How it works

```
Clinic registers a mother
        ↓
Day 3, Day 7, and Week 6 check ins are scheduled automatically
        ↓
CALL-E places the call and asks the screening questions
   (referencing what she said in her last call, where relevant)
        ↓
CALL-E returns the answers as structured data through a webhook
        ↓
MamaCare's risk engine scores the call: routine, urgent, or emergency
   with a clear, explainable reason attached to every score
        ↓
High risk cases are escalated to a nurse, who can review and resolve
```

## Tech stack

### Backend
- FastAPI, Python
- SQLAlchemy for the data models
- Pydantic for request and response validation
- PostgreSQL, hosted on Neon
- psycopg as the database driver
- httpx for calling the CALL-E API
- python-dotenv for environment configuration
- pytest for testing, covering the risk engine in full including the self harm override

### Calling
- CALL-E API, integrated directly through a custom task prompt and structured result schema

### Frontend
- React with Vite
- React Router for navigation across the dashboard, mothers, mother profile, follow ups, escalations, and analytics views
- A custom design system built in plain CSS

### Infrastructure and tooling
- GitHub for version control
- GitHub Codespaces as the development environment
- Render for backend deployment
- Neon for the hosted database
- Vercel for frontend deployment

## A known limitation

CALL-E's documentation lists Kenya and English as a supported region and language, but the live API currently rejects that combination when placing a real call. We confirmed this against our own deployed backend and a real Kenyan number. Every other part of the system, registration, scheduling, the CALL-E integration itself, webhook handling, risk scoring, and escalation, is built, tested, and working. We have reported this to the CALL-E team as feedback.

## Running it locally

### Backend
```bash
cd mamacare-backend
pip install -r requirements.txt --break-system-packages
cp .env.example .env
uvicorn app.main:app --reload
pytest tests/ -v
```

### Frontend
```bash
cd mamacare-frontend
npm install
npm run dev
```

