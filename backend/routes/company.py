"""Company routes — profile, drives, applicants, status updates, interviews."""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_security import auth_required, roles_required, current_user
from models import db, Company, PlacementDrive, Application, Interview, Student
from extensions import cache

company_bp = Blueprint("company", __name__, url_prefix="/api/company")


# ── Profile ──────────────────────────────────────────────────────────────
@company_bp.route("/profile", methods=["GET"])
@auth_required("token")
@roles_required("company")
def get_profile():
    c = current_user.company
    if not c:
        return jsonify(msg="Company profile not found."), 404
    return jsonify(
        id=c.id,
        name=c.name,
        description=c.description,
        website=c.website,
        industry=c.industry,
        status=c.status,
        email=current_user.email,
    ), 200


@company_bp.route("/profile", methods=["PUT"])
@auth_required("token")
@roles_required("company")
def update_profile():
    c = current_user.company
    if not c:
        return jsonify(msg="Company profile not found."), 404
    data = request.get_json() or {}
    c.name = data.get("name", c.name)
    c.description = data.get("description", c.description)
    c.website = data.get("website", c.website)
    c.industry = data.get("industry", c.industry)
    db.session.commit()
    return jsonify(msg="Profile updated."), 200


# ── Drives ───────────────────────────────────────────────────────────────
@company_bp.route("/drives", methods=["GET"])
@auth_required("token")
@roles_required("company")
def list_drives():
    c = current_user.company
    if not c:
        return jsonify(msg="Company profile not found."), 404

    # Only approved companies can view their drives
    drives = PlacementDrive.query.filter_by(company_id=c.id).order_by(
        PlacementDrive.created_at.desc()
    ).all()

    # Auto-close drives whose last_date_to_apply has passed
    now = datetime.utcnow()
    for d in drives:
        if d.status == "approved" and d.last_date_to_apply and d.last_date_to_apply < now:
            d.status = "closed"
    db.session.commit()
    result = []
    for d in drives:
        result.append(
            dict(
                id=d.id,
                title=d.title,
                description=d.description,
                role_offered=d.role_offered,
                package_lpa=d.package_lpa,
                location=d.location,
                eligibility_tenth=d.eligibility_tenth,
                eligibility_twelfth=d.eligibility_twelfth,
                eligibility_grad=d.eligibility_grad,
                eligibility_branches=d.eligibility_branches,
                eligibility_graduating_years=d.eligibility_graduating_years,
                drive_date=d.drive_date.isoformat() if d.drive_date else "",
                last_date_to_apply=d.last_date_to_apply.isoformat()
                if d.last_date_to_apply
                else "",
                status=d.status,
                applicants_count=len(d.applications),
                created_at=d.created_at.isoformat() if d.created_at else "",
            )
        )
    return jsonify(result), 200


@company_bp.route("/drives", methods=["POST"])
@auth_required("token")
@roles_required("company")
def create_drive():
    c = current_user.company
    if not c:
        return jsonify(msg="Company profile not found."), 404
    if c.status != "approved":
        return jsonify(msg="Your company must be approved before creating drives."), 403

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify(msg="Title is required."), 400

    drive = PlacementDrive(
        company_id=c.id,
        title=title,
        description=data.get("description", ""),
        role_offered=data.get("role_offered", ""),
        package_lpa=float(data.get("package_lpa", 0)),
        location=data.get("location", ""),
        eligibility_tenth=float(data.get("eligibility_tenth", 0)),
        eligibility_twelfth=float(data.get("eligibility_twelfth", 0)),
        eligibility_grad=float(data.get("eligibility_grad", 0)),
        eligibility_branches=data.get("eligibility_branches", ""),
        eligibility_graduating_years=data.get("eligibility_graduating_years", ""),
        drive_date=datetime.fromisoformat(data["drive_date"])
        if data.get("drive_date")
        else None,
        last_date_to_apply=datetime.fromisoformat(data["last_date_to_apply"])
        if data.get("last_date_to_apply")
        else None,
        status="pending",
    )
    db.session.add(drive)
    db.session.commit()
    cache.delete("admin_dashboard")
    cache.delete("admin_reports")
    cache.delete("student_drives")
    return jsonify(msg="Drive created. Waiting for admin approval.", id=drive.id), 201


@company_bp.route("/drives/<int:did>", methods=["PUT"])
@auth_required("token")
@roles_required("company")
def update_drive(did):
    c = current_user.company
    drive = PlacementDrive.query.get_or_404(did)
    if drive.company_id != c.id:
        return jsonify(msg="Unauthorized."), 403
    data = request.get_json() or {}
    drive.title = data.get("title", drive.title)
    drive.description = data.get("description", drive.description)
    drive.role_offered = data.get("role_offered", drive.role_offered)
    drive.package_lpa = float(data.get("package_lpa", drive.package_lpa))
    drive.location = data.get("location", drive.location)
    drive.eligibility_tenth = float(data.get("eligibility_tenth", drive.eligibility_tenth))
    drive.eligibility_twelfth = float(data.get("eligibility_twelfth", drive.eligibility_twelfth))
    drive.eligibility_grad = float(data.get("eligibility_grad", drive.eligibility_grad))
    drive.eligibility_branches = data.get("eligibility_branches", drive.eligibility_branches)
    drive.eligibility_graduating_years = data.get("eligibility_graduating_years", drive.eligibility_graduating_years)
    if data.get("drive_date"):
        drive.drive_date = datetime.fromisoformat(data["drive_date"])
    if data.get("last_date_to_apply"):
        drive.last_date_to_apply = datetime.fromisoformat(data["last_date_to_apply"])
    db.session.commit()
    return jsonify(msg="Drive updated."), 200


@company_bp.route("/drives/<int:did>/close", methods=["PUT"])
@auth_required("token")
@roles_required("company")
def close_drive(did):
    c = current_user.company
    drive = PlacementDrive.query.get_or_404(did)
    if drive.company_id != c.id:
        return jsonify(msg="Not your drive."), 403
    drive.status = "closed"
    db.session.commit()
    return jsonify(msg="Drive closed."), 200


@company_bp.route("/drives/<int:did>", methods=["DELETE"])
@auth_required("token")
@roles_required("company")
def delete_drive(did):
    c = current_user.company
    drive = PlacementDrive.query.get_or_404(did)
    if drive.company_id != c.id:
        return jsonify(msg="Not your drive."), 403
    db.session.delete(drive)
    db.session.commit()
    return jsonify(msg="Drive deleted."), 200


# ── Applicants ───────────────────────────────────────────────────────────
@company_bp.route("/drives/<int:did>/applicants", methods=["GET"])
@auth_required("token")
@roles_required("company")
def view_applicants(did):
    c = current_user.company
    drive = PlacementDrive.query.get_or_404(did)
    if drive.company_id != c.id:
        return jsonify(msg="Unauthorized."), 403

    apps = Application.query.filter_by(drive_id=did).all()
    result = []
    for a in apps:
        s = a.student
        result.append(
            dict(
                application_id=a.id,
                student_id=s.id,
                student_name=s.name,
                email=s.user.email,
                phone=s.phone,
                tenth_marks=s.tenth_marks,
                twelfth_marks=s.twelfth_marks,
                grad_marks=s.grad_marks,
                degree=s.degree,
                branch=s.branch,
                skills=s.skills,
                resume_path=s.resume_path,
                status=a.status,
                applied_at=a.applied_at.isoformat() if a.applied_at else "",
            )
        )
    return jsonify(result), 200


# ── Update application status ───────────────────────────────────────────
@company_bp.route("/applications/<int:aid>", methods=["PUT"])
@auth_required("token")
@roles_required("company")
def update_application(aid):
    app = Application.query.get_or_404(aid)
    drive = PlacementDrive.query.get(app.drive_id)
    if not drive or drive.company_id != current_user.company.id:
        return jsonify(msg="Unauthorized."), 403

    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status and new_status in ("shortlisted", "interview", "selected", "rejected"):
        app.status = new_status
    db.session.commit()
    cache.delete("admin_dashboard")
    cache.delete("admin_reports")
    return jsonify(msg="Application status updated.", status=app.status), 200


# ── Interviews ───────────────────────────────────────────────────────────
@company_bp.route("/interviews", methods=["POST"])
@auth_required("token")
@roles_required("company")
def schedule_interview():
    data = request.get_json() or {}
    application_id = data.get("application_id")
    if not application_id:
        return jsonify(msg="application_id is required."), 400

    app = Application.query.get_or_404(application_id)
    drive = PlacementDrive.query.get(app.drive_id)
    if not drive or drive.company_id != current_user.company.id:
        return jsonify(msg="Unauthorized."), 403

    interview = Interview(
        application_id=app.id,
        scheduled_at=datetime.fromisoformat(data["scheduled_at"])
        if data.get("scheduled_at")
        else datetime.now(timezone.utc),
        mode=data.get("mode", "online"),
        link=data.get("link", ""),
        venue=data.get("venue", ""),
        notes=data.get("notes", ""),
    )
    app.status = "interview"
    db.session.add(interview)
    db.session.commit()
    return jsonify(msg="Interview scheduled.", id=interview.id), 201


@company_bp.route("/interviews", methods=["GET"])
@auth_required("token")
@roles_required("company")
def list_interviews():
    c = current_user.company
    drive_ids = [d.id for d in c.drives]
    if not drive_ids:
        return jsonify([]), 200

    apps = Application.query.filter(Application.drive_id.in_(drive_ids)).all()
    app_ids = [a.id for a in apps]
    if not app_ids:
        return jsonify([]), 200

    interviews = Interview.query.filter(Interview.application_id.in_(app_ids)).order_by(
        Interview.scheduled_at.desc()
    ).all()

    result = []
    for i in interviews:
        a = i.application
        s = a.student
        d = a.drive
        result.append(
            dict(
                id=i.id,
                application_id=a.id,
                student_name=s.name,
                student_email=s.user.email,
                drive_title=d.title,
                scheduled_at=i.scheduled_at.isoformat() if i.scheduled_at else "",
                mode=i.mode,
                link=i.link,
                venue=i.venue,
                notes=i.notes,
                application_status=a.status,
            )
        )
    return jsonify(result), 200


# ── Reports ──────────────────────────────────────────────────────────────
@company_bp.route("/reports", methods=["GET"])
@auth_required("token")
@roles_required("company")
def reports():
    c = current_user.company
    if not c:
        return jsonify(msg="Company profile not found."), 404

    drives = PlacementDrive.query.filter_by(company_id=c.id).all()
    drive_ids = [d.id for d in drives]

    total_apps = Application.query.filter(Application.drive_id.in_(drive_ids)).count() if drive_ids else 0
    total_selected = (
        Application.query.filter(Application.drive_id.in_(drive_ids), Application.status == "selected").count()
        if drive_ids else 0
    )
    total_rejected = (
        Application.query.filter(Application.drive_id.in_(drive_ids), Application.status == "rejected").count()
        if drive_ids else 0
    )
    total_shortlisted = (
        Application.query.filter(Application.drive_id.in_(drive_ids), Application.status == "shortlisted").count()
        if drive_ids else 0
    )
    total_interview = (
        Application.query.filter(Application.drive_id.in_(drive_ids), Application.status == "interview").count()
        if drive_ids else 0
    )

    drive_stats = []
    for d in drives:
        d_apps = Application.query.filter_by(drive_id=d.id).count()
        d_selected = Application.query.filter_by(drive_id=d.id, status="selected").count()
        d_rejected = Application.query.filter_by(drive_id=d.id, status="rejected").count()
        d_shortlisted = Application.query.filter_by(drive_id=d.id, status="shortlisted").count()
        d_interview = Application.query.filter_by(drive_id=d.id, status="interview").count()
        drive_stats.append(dict(
            title=d.title,
            applications=d_apps,
            selected=d_selected,
            rejected=d_rejected,
            shortlisted=d_shortlisted,
            interview=d_interview,
        ))

    return jsonify(
        total_drives=len(drives),
        total_applications=total_apps,
        total_selected=total_selected,
        total_rejected=total_rejected,
        total_shortlisted=total_shortlisted,
        total_interview=total_interview,
        drive_stats=drive_stats,
    ), 200
