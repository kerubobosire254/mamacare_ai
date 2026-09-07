import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.risk_engine import assess_risk


def base_answers(**overrides):
    answers = {
        "bleeding_concern": False,
        "fever": False,
        "headache_or_convulsions": False,
        "wound_concern": False,
        "emotional_concern": False,
        "self_harm_disclosed": False,
        "baby_feeding_well": True,
        "baby_breathing_normal": True,
        "call_summary": "",
    }
    answers.update(overrides)
    return answers


def test_routine_when_no_danger_signs():
    tier, reason = assess_risk(base_answers())
    assert tier == "routine"


def test_emergency_on_heavy_bleeding():
    tier, reason = assess_risk(base_answers(bleeding_concern=True))
    assert tier == "emergency"
    assert "bleeding" in reason.lower()


def test_emergency_on_convulsions():
    tier, reason = assess_risk(base_answers(headache_or_convulsions=True))
    assert tier == "emergency"


def test_urgent_on_fever():
    tier, reason = assess_risk(base_answers(fever=True))
    assert tier == "urgent"


def test_urgent_on_newborn_breathing_issue():
    tier, reason = assess_risk(base_answers(baby_breathing_normal=False))
    assert tier == "urgent"


def test_urgent_on_emotional_distress():
    tier, reason = assess_risk(base_answers(emotional_concern=True))
    assert tier == "urgent"


def test_self_harm_bypasses_normal_flow_and_overrides_everything():
    # Even with no other symptoms, self-harm disclosure alone is emergency
    tier, reason = assess_risk(base_answers(self_harm_disclosed=True))
    assert tier == "emergency"
    assert "self-harm" in reason.lower()


def test_self_harm_overrides_even_when_other_signs_present():
    tier, reason = assess_risk(base_answers(self_harm_disclosed=True, fever=True, bleeding_concern=True))
    assert tier == "emergency"
    assert "self-harm" in reason.lower()
