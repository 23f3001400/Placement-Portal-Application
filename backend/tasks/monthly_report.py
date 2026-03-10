from datetime import datetime, timezone
from calendar import monthrange
from celery import shared_task


@shared_task(name="tasks.monthly_report.send_monthly_report")
def send_monthly_report():
    from app import app, mail

    with app.app_context():
        from flask import current_app
        from flask_mail import Message as MailMessage
        from models import (
            db, Student, Company, PlacementDrive, Application,
        )

        admin_email = current_app.config.get("ADMIN_EMAIL", "admin@ppa.com")

        # Determine the previous month
        now = datetime.now(timezone.utc)
        if now.month == 1:
            year, month = now.year - 1, 12
        else:
            year, month = now.year, now.month - 1

        first_day = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = datetime(year, month, monthrange(year, month)[1], 23, 59, 59, tzinfo=timezone.utc)
        month_label = first_day.strftime("%B %Y")

        # Gather statistics
        drives = PlacementDrive.query.filter(
            PlacementDrive.created_at >= first_day,
            PlacementDrive.created_at <= last_day,
        ).all()

        drive_ids = [d.id for d in drives]

        total_drives = len(drives)
        approved_drives = sum(1 for d in drives if d.status in ("approved", "completed"))

        applications = (
            Application.query.filter(
                Application.applied_at >= first_day,
                Application.applied_at <= last_day,
            ).all()
        )
        total_applications = len(applications)
        total_selected = sum(1 for a in applications if a.status == "selected")
        total_rejected = sum(1 for a in applications if a.status == "rejected")
        total_shortlisted = sum(1 for a in applications if a.status in ("shortlisted", "interview"))

        total_students = Student.query.count()
        total_companies = Company.query.filter_by(status="approved").count()
        placement_rate = round((total_selected / total_students) * 100, 1) if total_students else 0

        # Per-company breakdown
        company_rows = []
        companies_with_drives = set()
        for d in drives:
            companies_with_drives.add(d.company_id)

        for cid in companies_with_drives:
            company = Company.query.get(cid)
            if not company:
                continue
            c_drives = [d for d in drives if d.company_id == cid]
            c_drive_ids = [d.id for d in c_drives]
            c_apps = [a for a in applications if a.drive_id in c_drive_ids]
            c_selected = sum(1 for a in c_apps if a.status == "selected")
            top_pkg = max((d.package_lpa for d in c_drives if d.package_lpa), default=0)
            company_rows.append({
                "name": company.name,
                "drives": len(c_drives),
                "applications": len(c_apps),
                "selected": c_selected,
                "top_package": top_pkg,
            })

        company_rows.sort(key=lambda r: r["selected"], reverse=True)

        # Build HTML report
        company_table_rows = ""
        for idx, r in enumerate(company_rows, 1):
            company_table_rows += f"""
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;">{idx}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;">{r['name']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;">{r['drives']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;">{r['applications']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;color:#16a34a;font-weight:700;">{r['selected']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;">{r['top_package']} LPA</td>
            </tr>"""

        html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f6f9;margin:0;padding:30px;">
<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 30px;color:#fff;">
        <h1 style="margin:0;font-size:22px;">📊 Monthly Placement Activity Report</h1>
        <p style="margin:8px 0 0;opacity:0.9;font-size:15px;">{month_label}</p>
    </div>

    <div style="padding:30px;">
        <!-- KPI Cards -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
            <td style="padding:6px;">
                <div style="background:#f0f4ff;border-radius:10px;padding:18px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#4f46e5;">{total_drives}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Drives Conducted</div>
                </div>
            </td>
            <td style="padding:6px;">
                <div style="background:#fef3e2;border-radius:10px;padding:18px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#ea580c;">{total_applications}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Applications</div>
                </div>
            </td>
            <td style="padding:6px;">
                <div style="background:#e8faf0;border-radius:10px;padding:18px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#16a34a;">{total_selected}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Students Selected</div>
                </div>
            </td>
            <td style="padding:6px;">
                <div style="background:#fce8e8;border-radius:10px;padding:18px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#dc2626;">{total_rejected}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Rejected</div>
                </div>
            </td>
        </tr>
        </table>

        <!-- Summary -->
        <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:28px;border-left:4px solid #4f46e5;">
            <h3 style="margin:0 0 12px;color:#1e293b;font-size:16px;">📋 Summary</h3>
            <table style="font-size:14px;color:#475569;" cellpadding="4">
                <tr><td>Total Registered Students</td><td style="font-weight:600;padding-left:20px;">{total_students}</td></tr>
                <tr><td>Approved Companies</td><td style="font-weight:600;padding-left:20px;">{total_companies}</td></tr>
                <tr><td>Drives Approved</td><td style="font-weight:600;padding-left:20px;">{approved_drives}</td></tr>
                <tr><td>Shortlisted / Interview</td><td style="font-weight:600;padding-left:20px;">{total_shortlisted}</td></tr>
                <tr><td>Placement Rate</td><td style="font-weight:600;padding-left:20px;color:#16a34a;">{placement_rate}%</td></tr>
            </table>
        </div>

        <!-- Company Breakdown -->
        <h3 style="margin:0 0 14px;color:#1e293b;font-size:16px;">🏢 Company-wise Breakdown</h3>
        {"<p style='color:#94a3b8;font-size:14px;'>No drives were conducted this month.</p>" if not company_rows else f'''
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
                <tr style="background:#f1f5f9;">
                    <th style="padding:10px 14px;text-align:left;">#</th>
                    <th style="padding:10px 14px;text-align:left;">Company</th>
                    <th style="padding:10px 14px;text-align:center;">Drives</th>
                    <th style="padding:10px 14px;text-align:center;">Applications</th>
                    <th style="padding:10px 14px;text-align:center;">Selected</th>
                    <th style="padding:10px 14px;text-align:center;">Top Pkg</th>
                </tr>
            </thead>
            <tbody>{company_table_rows}</tbody>
        </table>'''}

    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:18px 30px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
        Generated automatically by <strong>Placement Portal Application</strong> on {now.strftime('%d %b %Y, %I:%M %p')}
    </div>
</div>
</body>
</html>
"""

        # Send email
        msg = MailMessage(
            subject=f"PPA Monthly Report — {month_label}",
            recipients=[admin_email],
            html=html,
        )

        try:
            mail.send(msg)
            return f"Monthly report for {month_label} sent to {admin_email}."
        except Exception as exc:
            return f"Failed to send report email: {exc}"
