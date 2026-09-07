"""
Thin wrapper around CALL-E's API.

NOTE: verify the exact endpoint paths and payload shape against your CALL-E
account's docs/dashboard before your first real call — API surfaces on new
platforms can shift. This wrapper is written to be easy to adjust in one
place if a field name differs from what's here.
"""
import os
import uuid
import httpx
from dotenv import load_dotenv

load_dotenv()

CALLE_API_KEY = os.getenv("CALLE_API_KEY")
CALLE_API_BASE = os.getenv("CALLE_API_BASE", "https://api.heycall-e.com")


def _headers(idempotency_key: str):
    return {
        "Authorization": f"Bearer {CALLE_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key,
    }


def start_call(
    phone: str,
    task: str,
    result_schema: dict,
    webhook_url: str,
    schedule_id: int,
) -> dict:
    """
    Fires a call via CALL-E's API. Returns CALL-E's response (should include
    a call_id/run_id you can poll or wait for the webhook on).

    schedule_id is passed through so your webhook handler knows which
    schedule row this result belongs to when CALL-E calls back — until
    metadata pass-through is confirmed, it's also embedded in the task
    text itself as a fallback (see build_screening_task usage in main.py).
    """
    idempotency_key = f"schedule_{schedule_id}_{uuid.uuid4().hex[:8]}"

    payload = {
        "task": task,
        "recipients": [
            {"phones": [phone], "region": "US", "locale": "en-US"}
        ],
        "result_schema": {
            "type": "object",
            "required": ["completed_count"],
            "properties": {"completed_count": {"type": "integer"}},
        },
        "recipient_result_schema": result_schema,
        "webhook_url": webhook_url,
        "metadata": {"schedule_id": schedule_id},
    }

    with httpx.Client(timeout=90.0) as client:
        response = client.post(
            f"{CALLE_API_BASE}/v1/calls",
            headers=_headers(idempotency_key),
            json=payload,
        )
        if response.status_code >= 400:
            # Surface CALL-E's actual error body, not just the status code —
            # this is what tells you which field was rejected.
            raise RuntimeError(f"{response.status_code} error from CALL-E: {response.text}")
        return response.json()


def get_call_status(call_id: str) -> dict:
    with httpx.Client(timeout=90.0) as client:
        response = client.get(
            f"{CALLE_API_BASE}/v1/calls/{call_id}",
            headers={"Authorization": f"Bearer {CALLE_API_KEY}"},
        )
        response.raise_for_status()
        return response.json()
