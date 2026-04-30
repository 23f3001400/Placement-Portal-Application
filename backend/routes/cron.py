"""HTTP cron endpoints for scheduled tasks.

These replace Celery Beat on platforms where background workers
are not available (e.g. Render free tier).  Protect with CRON_SECRET.

Usage:
  - Set CRON_SECRET env var on your deployment.
  - Use an external cron service (e.g. cron-job.org) to hit:
      POST /api/cron/daily-reminders   Header: X-Cron-Secret: <secret>
      POST /api/cron/monthly-report    Header: X-Cron-Secret: <secret>
"""

import os
from flask import Blueprint, request, jsonify, current_app

cron_bp = Blueprint("cron", __name__, url_prefix="/api/cron")


def _check_cron_secret():
    """Validate the cron secret header."""
    secret = os.environ.get("CRON_SECRET", "")
    if not secret:
        return None  # No secret configured — allow (local dev)
    provided = request.headers.get("X-Cron-Secret", "")
    if provided != secret:
        return jsonify(msg="Unauthorized."), 401
    return None


@cron_bp.route("/daily-reminders", methods=["POST"])
def trigger_daily_reminders():
    err = _check_cron_secret()
    if err:
        return err

    from tasks.reminders import send_daily_reminders
    result = send_daily_reminders()
    return jsonify(msg="Daily reminders executed.", result=str(result)), 200


@cron_bp.route("/monthly-report", methods=["POST"])
def trigger_monthly_report():
    err = _check_cron_secret()
    if err:
        return err

    from tasks.monthly_report import send_monthly_report
    result = send_monthly_report()
    return jsonify(msg="Monthly report executed.", result=str(result)), 200
