SCREENING_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "bleeding_concern": {"type": "boolean"},
        "fever": {"type": "boolean"},
        "headache_or_convulsions": {"type": "boolean"},
        "wound_concern": {"type": "boolean"},
        "emotional_concern": {"type": "boolean"},
        "self_harm_disclosed": {"type": "boolean"},
        "baby_feeding_well": {"type": "boolean"},
        "baby_breathing_normal": {"type": "boolean"},
        "call_summary": {"type": "string"},
    },
    "required": [
        "bleeding_concern", "fever", "headache_or_convulsions",
        "wound_concern", "emotional_concern", "self_harm_disclosed",
        "baby_feeding_well", "baby_breathing_normal", "call_summary",
    ],
}


def build_screening_task(
    mother_name: str,
    is_c_section: bool = False,
    previous_call_summary: str | None = None,
) -> str:
    wound_question = (
        "Ask how her surgical wound is healing — any pain, redness, or discharge."
        if is_c_section
        else "Ask if she has any pain, bleeding, or discharge near her stitches, if she had any."
    )

    memory_line = ""
    if previous_call_summary:
        memory_line = (
            f"Note: in the last call, she mentioned: '{previous_call_summary}'. "
            "Gently ask how that specific issue is doing now before moving to the standard questions.\n"
        )

    return f"""
You are calling {mother_name}, a postpartum mother, for a brief wellbeing check-in on behalf of her clinic.
Speak warmly and calmly, like a caring health worker on the phone, not like a form being read aloud.
Keep the whole call short and natural.

{memory_line}
Ask about, in this order:
1. Bleeding — is it normal, or heavy/worsening?
2. Fever — any fever or feeling unusually hot?
3. Any severe headache, blurred vision, or fits/convulsions?
4. {wound_question}
5. How she's feeling emotionally since the baby arrived — overwhelmed, low, or struggling to cope?
   IMPORTANT: if she discloses thoughts of harming herself or the baby, stop the screening checklist
   immediately. Do not ask further questions. Tell her gently and clearly that a health worker will
   call her right away, thank her for telling you, and end the call kindly.
6. Is baby feeding well?
7. Is baby breathing normally, and not unusually hot or cold to touch?

At the end, produce a short one-sentence call_summary capturing anything notable she mentioned,
even if it doesn't map to the fields above — this will be used to personalize her next call.
""".strip()
