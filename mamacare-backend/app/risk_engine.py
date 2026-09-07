def assess_risk(answers: dict) -> tuple[str, str]:
    """
    Deterministic, explainable risk tiering — no black box.
    Returns (risk_tier, reason). Self-harm always short-circuits everything else.
    """

    if answers.get("self_harm_disclosed"):
        return "emergency", "Self-harm disclosure — immediate human handoff, bypasses normal scoring"

    if answers.get("bleeding_concern") or answers.get("headache_or_convulsions"):
        reasons = []
        if answers.get("bleeding_concern"):
            reasons.append("heavy/worsening bleeding")
        if answers.get("headache_or_convulsions"):
            reasons.append("severe headache, vision changes, or convulsions")
        return "emergency", " and ".join(reasons).capitalize() + " reported"

    urgent_reasons = []
    if answers.get("fever"):
        urgent_reasons.append("fever")
    if answers.get("wound_concern"):
        urgent_reasons.append("wound concern")
    if not answers.get("baby_breathing_normal", True):
        urgent_reasons.append("newborn breathing concern")
    if not answers.get("baby_feeding_well", True):
        urgent_reasons.append("newborn feeding difficulty")
    if answers.get("emotional_concern"):
        urgent_reasons.append("emotional distress reported")

    if urgent_reasons:
        return "urgent", ", ".join(urgent_reasons).capitalize() + " reported"

    return "routine", "No danger signs reported"
