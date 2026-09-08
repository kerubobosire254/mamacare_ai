"""
Seeds realistic demo data into your LIVE MamaCare backend using its real
endpoints — no CALL-E credits spent. It registers mothers (which auto-creates
their Day 3/7/Week 6 schedule via your real backend logic), then simulates
completed calls by POSTing to /webhooks/call-complete with varied, realistic
answers — the exact same path a real CALL-E webhook would hit.

Usage:
    pip install requests --break-system-packages
    python seed_demo_data.py
"""
import requests
import random
from datetime import date, timedelta

BASE_URL = "https://mamacare-ai-1.onrender.com"  # change if your Render URL differs

FIRST_NAMES = [
    "Jane", "Mary", "Susan", "Anne", "Grace", "Faith", "Joyce", "Mercy",
    "Esther", "Lucy", "Naomi", "Ruth", "Sarah", "Winnie", "Caroline",
]
LAST_INITIALS = ["W.", "A.", "K.", "M.", "O.", "N.", "J.", "T."]

# Each scenario: (weight, answers_dict, summary)
SCENARIOS = [
    (14, dict(bleeding_concern=False, fever=False, headache_or_convulsions=False,
              wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
              baby_feeding_well=True, baby_breathing_normal=True),
     "Everything reported normal, baby feeding well"),

    (3, dict(bleeding_concern=False, fever=True, headache_or_convulsions=False,
             wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=True),
     "Mild fever reported, no other concerns"),

    (2, dict(bleeding_concern=False, fever=False, headache_or_convulsions=False,
             wound_concern=True, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=True),
     "Wound tenderness reported near C-section site"),

    (2, dict(bleeding_concern=False, fever=False, headache_or_convulsions=False,
             wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=False, baby_breathing_normal=True),
     "Baby having difficulty feeding"),

    (2, dict(bleeding_concern=False, fever=False, headache_or_convulsions=False,
             wound_concern=False, emotional_concern=True, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=True),
     "Mother reported feeling overwhelmed since delivery"),

    (2, dict(bleeding_concern=True, fever=False, headache_or_convulsions=False,
             wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=True),
     "Heavy/worsening bleeding reported"),

    (1, dict(bleeding_concern=False, fever=False, headache_or_convulsions=True,
             wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=True),
     "Severe headache and blurred vision reported"),

    (1, dict(bleeding_concern=False, fever=False, headache_or_convulsions=False,
             wound_concern=False, emotional_concern=False, self_harm_disclosed=False,
             baby_feeding_well=True, baby_breathing_normal=False),
     "Newborn showing breathing difficulty"),
]


def weighted_scenario():
    weights = [w for w, _, _ in SCENARIOS]
    return random.choices(SCENARIOS, weights=weights, k=1)[0]


def register_mother(name, phone, delivery_date, delivery_type):
    r = requests.post(f"{BASE_URL}/mothers", json={
        "name": name,
        "phone": phone,
        "delivery_date": delivery_date.isoformat(),
        "consent_given": True,
        "pregnancy": {"delivery_type": delivery_type},
    })
    r.raise_for_status()
    return r.json()


def get_schedules(mother_id):
    r = requests.get(f"{BASE_URL}/mothers/{mother_id}/schedules")
    r.raise_for_status()
    return r.json()


def simulate_call(schedule_id, answers, summary):
    payload = {
        "schedule_id": schedule_id,
        "call_id": f"demo-{schedule_id}-{random.randint(1000,9999)}",
        "extracted": {**answers, "call_summary": summary},
    }
    r = requests.post(f"{BASE_URL}/webhooks/call-complete", json=payload)
    r.raise_for_status()
    return r.json()


def main():
    count = 18
    print(f"Seeding {count} demo mothers against {BASE_URL} ...")

    for i in range(count):
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_INITIALS)}"
        phone = f"+2547{random.randint(10000000, 99999999)}"
        days_ago = random.randint(0, 45)
        delivery_date = date.today() - timedelta(days=days_ago)
        delivery_type = random.choice(["vaginal", "vaginal", "vaginal", "c_section"])

        mother = register_mother(name, phone, delivery_date, delivery_type)
        schedules = get_schedules(mother["id"])

        # Simulate calls only for schedules whose due date has already passed
        due_schedules = [s for s in schedules if s["scheduled_date"] <= date.today().isoformat()]

        for sched in due_schedules:
            # ~85% of due calls actually connect; rest simulate no-answer (left pending)
            if random.random() < 0.85:
                _, answers, summary = weighted_scenario()
                simulate_call(sched["id"], answers, summary)

        print(f"  [{i+1}/{count}] {name} — {delivery_type}, {len(due_schedules)} call(s) simulated")

    print("Done. Refresh your dashboard to see the populated data.")


if __name__ == "__main__":
    main()
