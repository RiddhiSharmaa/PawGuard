from __future__ import annotations

import json
import os

import requests
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class SendEmailInput(BaseModel):
    to_email: str = Field(description="Recipient email address")
    to_name: str = Field(description="Recipient NGO name")
    subject: str = Field(description="Email subject line")
    body: str = Field(description="Full email body text")


class SendRescueEmailTool(BaseTool):
    name: str = "send_rescue_email"
    description: str = "Sends a rescue request email to an NGO."
    args_schema: type[BaseModel] = SendEmailInput

    def _run(self, to_email: str, to_name: str, subject: str, body: str) -> str:
        if not os.getenv("RESEND_API_KEY"):
            return json.dumps({"success": False, "error": "RESEND_API_KEY is not configured."})

        try:
            response = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {os.getenv('RESEND_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": os.getenv("RESEND_FROM_EMAIL", "alerts@streetguard.app"),
                    "to": [to_email],
                    "subject": subject,
                    "text": body,
                },
                timeout=20,
            )
            if response.ok:
                return json.dumps(
                    {
                        "success": True,
                        "email_sent_to": to_email,
                        "recipient_name": to_name,
                        "provider_response": response.json(),
                    }
                )
            return json.dumps({"success": False, "error": response.text, "status_code": response.status_code})
        except Exception as exc:
            return json.dumps({"success": False, "error": str(exc)})
