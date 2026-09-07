"""
Thin wrapper around CALL-E's API.

NOTE: verify the exact endpoint paths and payload shape against your CALL-E
account's docs/dashboard before your first real call — API surfaces on new
platforms can shift. This wrapper is written to be easy to adjust in one
place if a field name differs from what's here.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

CALLE_API_KEY = os.getenv("CALLE_API_KEY")
CALLE_API_BASE = os.getenv("CALLE_API_BASE", "https://api.heycall-e.com")


def _headers():
    return {
        "Authorization": f"Bearer {CALLE_API_KEY}",
        "Content-Type": "application/json",
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
    a run_id/call_id you can poll or wait for the webhook on).

    schedule_id is passed through in metadata so your webhook handler knows
    which schedule row this result belongs to when CALL-E calls back.
    """
    payload = {
        "recipient": {"phone": phone, "region": "KE", "locale": "en"},
        "task": task,
        "result_schema": result_schema,
        "webhook_url": webhook_url,
        "metadata": {"schedule_id": schedule_id},
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{CALLE_API_BASE}/v1/calls",
            headers=_headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json()


def get_call_status(call_id: str) -> dict:
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            f"{CALLE_API_BASE}/v1/calls/{call_id}",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()
