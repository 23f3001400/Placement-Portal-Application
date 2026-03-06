"""User-triggered async task — Export student applications as CSV.

Triggered from the student dashboard via API. Generates a CSV file
containing the student's full application history and saves it to
the exports/ directory.
"""

import csv
import os
from datetime import datetime, timezone
from celery import shared_task


@shared_task(name="tasks.export_csv.export_applications_csv", bind=True)
def export_applications_csv(self, student_id):
    """Generate a CSV export of all applications for *student_id*."""
    from app import app  # local import to avoid circular deps

    with app.app_context():
        from flask import current_app
        from models import Student, Application

        student = Student.query.get(student_id)
        if not student:
            return {"error": "Student not found."}

        applications = (
            Application.query.filter_by(student_id=student_id)
            .order_by(Application.applied_at.desc())
            .all()
        )

        # Prepare export directory
        export_dir = current_app.config["EXPORT_FOLDER"]
        os.makedirs(export_dir, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"applications_{student_id}_{timestamp}.csv"
        filepath = os.path.join(export_dir, filename)

        # Write CSV
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Student ID",
                "Student Name",
                "Company",
                "Drive Title",
                "Role",
                "Package (LPA)",
                "Location",
                "Status",
                "Applied On",
                "Drive Date",
                "Deadline",
            ])

            for a in applications:
                d = a.drive
                writer.writerow([
                    student.id,
                    student.name,
                    d.company.name if d.company else "",
                    d.title,
                    d.role_offered or "",
                    d.package_lpa or "",
                    d.location or "",
                    a.status,
                    a.applied_at.strftime("%d-%b-%Y") if a.applied_at else "",
                    d.drive_date.strftime("%d-%b-%Y") if d.drive_date else "",
                    d.last_date_to_apply.strftime("%d-%b-%Y") if d.last_date_to_apply else "",
                ])

        return {"filename": filename, "count": len(applications)}
