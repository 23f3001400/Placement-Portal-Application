import json
import urllib.request
from datetime import datetime, timedelta, timezone
from celery import shared_task


@shared_task(name="tasks.reminders.send_daily_reminders")
def send_daily_reminders():
    from app import app

    with app.app_context():
        from flask import current_app
        from models import PlacementDrive, Student

        webhook_url = current_app.config.get("GCHAT_WEBHOOK_URL", "")
        if not webhook_url:
            return "GCHAT_WEBHOOK_URL not configured — skipping."

        now = datetime.utcnow()
        deadline = now + timedelta(days=3)

        upcoming_drives = (
            PlacementDrive.query
            .filter(
                PlacementDrive.status == "approved",
                PlacementDrive.last_date_to_apply.isnot(None),
                PlacementDrive.last_date_to_apply >= now,
                PlacementDrive.last_date_to_apply <= deadline,
            )
            .order_by(PlacementDrive.last_date_to_apply.asc())
            .all()
        )

        if not upcoming_drives:
            return "No upcoming deadlines in the next 3 days."

        # Count active students for context
        total_students = Student.query.filter_by(status="active").count()

        # Build the message
        lines = [
            "📢 *PPA — Daily Deadline Reminder*",
            f"_{now.strftime('%A, %d %B %Y')}_",
            "",
            f"🎓 *{total_students}* active students | "
            f"*{len(upcoming_drives)}* upcoming deadline(s)",
            "",
        ]

        for d in upcoming_drives:
            days_left = (d.last_date_to_apply - now).days
            urgency = "🔴" if days_left <= 1 else "🟡" if days_left <= 2 else "🟢"
            lines.append(
                f"{urgency} *{d.title}* — {d.company.name}\n"
                f"   Role: {d.role_offered or '—'} | "
                f"Package: {d.package_lpa or '—'} LPA\n"
                f"   ⏰ Deadline: {d.last_date_to_apply.strftime('%d %b %Y')} "
                f"({days_left} day{'s' if days_left != 1 else ''} left)\n"
            )

        lines.append("—\n_Sent automatically by Placement Portal Application_")

        message = {"text": "\n".join(lines)}

        # POST to Google Chat Webhook
        req = urllib.request.Request(
            webhook_url,
            data=json.dumps(message).encode("utf-8"),
            headers={"Content-Type": "application/json; charset=UTF-8"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return f"Sent {len(upcoming_drives)} reminder(s). Status: {resp.status}"
        except Exception as exc:
            return f"Webhook POST failed: {exc}"
