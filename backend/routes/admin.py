"""Admin routes — dashboard, manage companies / students / drives, reports."""

from flask import Blueprint, request, jsonify
from flask_security import auth_required, roles_required, current_user
from models import db, User, Company, Student, PlacementDrive, Application
from extensions import cache

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _require_admin():
    """Helper; already covered by @roles_required but kept for clarity."""
    pass


# ── Dashboard stats ─────────────────────────────────────────────────────
@admin_bp.route("/dashboard", methods=["GET"])
@auth_required("token")
@roles_required("admin")
@cache.cached(timeout=60, key_prefix="admin_dashboard")
def dashboard():
    total_students = Student.query.count()
    total_companies = Company.query.count()
    total_drives = PlacementDrive.query.count()
    total_applications = Application.query.count()
    selected = Application.query.filter_by(status="selected").count()
    pending_companies = Company.query.filter_by(status="pending").count()
    pending_drives = PlacementDrive.query.filter_by(status="pending").count()
    return jsonify(
        total_students=total_students,
        total_companies=total_companies,
        total_drives=total_drives,
        total_applications=total_applications,
        total_selected=selected,
        pending_companies=pending_companies,
        pending_drives=pending_drives,
    ), 200


# ── Companies ────────────────────────────────────────────────────────────
@admin_bp.route("/companies", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def list_companies():
    q = request.args.get("q", "").strip()
    status_filter = request.args.get("status", "").strip()
    query = Company.query
    if q:
        query = query.filter(Company.name.ilike(f"%{q}%"))
    if status_filter:
        query = query.filter_by(status=status_filter)
    companies = query.order_by(Company.created_at.desc()).all()
    result = []
    for c in companies:
        result.append(
            dict(
                id=c.id,
                name=c.name,
                description=c.description,
                website=c.website,
                industry=c.industry,
                status=c.status,
                email=c.user.email,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
        )
    return jsonify(result), 200


@admin_bp.route("/companies/<int:cid>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def update_company(cid):
    company = Company.query.get_or_404(cid)
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status and new_status in ("approved", "rejected", "blacklisted", "pending"):
        company.status = new_status
        # If blacklisted, also deactivate user account
        if new_status == "blacklisted":
            company.user.active = False
        elif new_status == "approved":
            company.user.active = True
    db.session.commit()
    return jsonify(msg="Company updated.", status=company.status), 200


@admin_bp.route("/companies/<int:cid>", methods=["DELETE"])
@auth_required("token")
@roles_required("admin")
def delete_company(cid):
    company = Company.query.get_or_404(cid)
    user = company.user
    db.session.delete(company)
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg="Company deleted."), 200


# ── Students ─────────────────────────────────────────────────────────────
@admin_bp.route("/students", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def list_students():
    q = request.args.get("q", "").strip()
    status_filter = request.args.get("status", "").strip()
    query = Student.query
    if q:
        query = query.filter(
            (Student.name.ilike(f"%{q}%"))
            | (Student.branch.ilike(f"%{q}%"))
        )
    if status_filter:
        query = query.filter_by(status=status_filter)
    students = query.order_by(Student.created_at.desc()).all()
    result = []
    for s in students:
        result.append(
            dict(
                id=s.id,
                name=s.name,
                email=s.user.email,
                phone=s.phone,
                tenth_marks=s.tenth_marks,
                twelfth_marks=s.twelfth_marks,
                grad_marks=s.grad_marks,
                degree=s.degree,
                branch=s.branch,
                skills=s.skills,
                graduating_year=s.graduating_year,
                status=s.status,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
        )
    return jsonify(result), 200


@admin_bp.route("/students/<int:sid>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def update_student(sid):
    student = Student.query.get_or_404(sid)
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status and new_status in ("active", "blacklisted"):
        student.status = new_status
        if new_status == "blacklisted":
            student.user.active = False
        else:
            student.user.active = True
    db.session.commit()
    return jsonify(msg="Student updated.", status=student.status), 200


@admin_bp.route("/students/<int:sid>", methods=["DELETE"])
@auth_required("token")
@roles_required("admin")
def delete_student(sid):
    student = Student.query.get_or_404(sid)
    user = student.user
    db.session.delete(student)
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg="Student deleted."), 200


# ── Placement Drives ────────────────────────────────────────────────────
@admin_bp.route("/drives", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def list_drives():
    status_filter = request.args.get("status", "").strip()
    query = PlacementDrive.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    drives = query.order_by(PlacementDrive.created_at.desc()).all()
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
                company_name=d.company.name,
                company_id=d.company_id,
                status=d.status,
                drive_date=d.drive_date.isoformat() if d.drive_date else "",
                last_date_to_apply=d.last_date_to_apply.isoformat()
                if d.last_date_to_apply
                else "",
                eligibility_tenth=d.eligibility_tenth,
                eligibility_twelfth=d.eligibility_twelfth,
                eligibility_grad=d.eligibility_grad,
                eligibility_branches=d.eligibility_branches,
                eligibility_graduating_years=d.eligibility_graduating_years,
                applicants_count=len(d.applications),
                created_at=d.created_at.isoformat() if d.created_at else "",
            )
        )
    return jsonify(result), 200


@admin_bp.route("/drives/<int:did>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def update_drive(did):
    drive = PlacementDrive.query.get_or_404(did)
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status and new_status in ("approved", "rejected", "pending", "completed"):
        drive.status = new_status
    db.session.commit()
    return jsonify(msg="Drive updated.", status=drive.status), 200


@admin_bp.route("/drives/<int:did>", methods=["DELETE"])
@auth_required("token")
@roles_required("admin")
def delete_drive(did):
    drive = PlacementDrive.query.get_or_404(did)
    db.session.delete(drive)
    db.session.commit()
    return jsonify(msg="Drive deleted."), 200


# ── Reports ──────────────────────────────────────────────────────────────
@admin_bp.route("/reports", methods=["GET"])
@auth_required("token")
@roles_required("admin")
@cache.cached(timeout=60, key_prefix="admin_reports")
def reports():
    total_students = Student.query.count()
    total_companies = Company.query.count()
    total_drives = PlacementDrive.query.count()
    total_applications = Application.query.count()
    selected = Application.query.filter_by(status="selected").count()
    rejected_apps = Application.query.filter_by(status="rejected").count()
    shortlisted = Application.query.filter_by(status="shortlisted").count()
    interview = Application.query.filter_by(status="interview").count()

    # Per-company stats
    companies = Company.query.filter_by(status="approved").all()
    company_stats = []
    for c in companies:
        drives = PlacementDrive.query.filter_by(company_id=c.id).all()
        drive_ids = [d.id for d in drives]
        apps = Application.query.filter(Application.drive_id.in_(drive_ids)).count() if drive_ids else 0
        sel = (
            Application.query.filter(
                Application.drive_id.in_(drive_ids), Application.status == "selected"
            ).count()
            if drive_ids
            else 0
        )
        company_stats.append(dict(name=c.name, drives=len(drives), applications=apps, selected=sel))

    placement_rate = round((selected / total_students) * 100, 1) if total_students else 0

    return jsonify(
        total_students=total_students,
        total_companies=total_companies,
        total_drives=total_drives,
        total_applications=total_applications,
        total_selected=selected,
        total_rejected=rejected_apps,
        total_shortlisted=shortlisted,
        total_interview=interview,
        placement_rate=placement_rate,
        company_stats=company_stats,
    ), 200
