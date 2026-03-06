"""Student routes — profile, resume, drives, applications, placements."""

import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_security import auth_required, roles_required, current_user
from models import db, Student, PlacementDrive, Application

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


# ── Profile ──────────────────────────────────────────────────────────────
@student_bp.route("/profile", methods=["GET"])
@auth_required("token")
@roles_required("student")
def get_profile():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    return jsonify(
        id=s.id,
        name=s.name,
        email=current_user.email,
        phone=s.phone,
        tenth_marks=s.tenth_marks,
        twelfth_marks=s.twelfth_marks,
        grad_marks=s.grad_marks,
        degree=s.degree,
        branch=s.branch,
        graduating_year=s.graduating_year,
        skills=s.skills,
        resume_path=s.resume_path,
        status=s.status,
    ), 200


@student_bp.route("/profile", methods=["PUT"])
@auth_required("token")
@roles_required("student")
def update_profile():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    data = request.get_json() or {}
    s.name = data.get("name", s.name)
    s.phone = data.get("phone", s.phone)
    s.tenth_marks = float(data.get("tenth_marks", s.tenth_marks))
    s.twelfth_marks = float(data.get("twelfth_marks", s.twelfth_marks))
    s.grad_marks = float(data.get("grad_marks", s.grad_marks))
    s.degree = data.get("degree", s.degree)
    s.branch = data.get("branch", s.branch)
    s.graduating_year = int(data.get("graduating_year", s.graduating_year))
    s.skills = data.get("skills", s.skills)
    db.session.commit()
    return jsonify(msg="Profile updated."), 200


# ── Resume upload ────────────────────────────────────────────────────────
@student_bp.route("/resume", methods=["POST"])
@auth_required("token")
@roles_required("student")
def upload_resume():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    if "resume" not in request.files:
        return jsonify(msg="No file uploaded."), 400

    f = request.files["resume"]
    if f.filename == "":
        return jsonify(msg="No file selected."), 400

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(f.filename)[1]
    filename = f"resume_{s.id}{ext}"
    filepath = os.path.join(upload_dir, filename)
    f.save(filepath)

    s.resume_path = filename
    db.session.commit()
    return jsonify(msg="Resume uploaded.", filename=filename), 200


@student_bp.route("/resume/<filename>", methods=["GET"])
@auth_required("token")
def download_resume(filename):
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(upload_dir, filename, as_attachment=True)


# ── Browse approved drives ──────────────────────────────────────────────
@student_bp.route("/drives", methods=["GET"])
@auth_required("token")
@roles_required("student")
def list_drives():
    s = current_user.student
    q = request.args.get("q", "").strip()
    eligible_only = request.args.get("eligible", "").strip()

    query = PlacementDrive.query.filter_by(status="approved")
    if q:
        query = query.filter(
            PlacementDrive.title.ilike(f"%{q}%")
            | PlacementDrive.role_offered.ilike(f"%{q}%")
            | PlacementDrive.location.ilike(f"%{q}%")
        )

    drives = query.order_by(PlacementDrive.created_at.desc()).all()

    # Already-applied drive IDs
    applied_ids = set()
    if s:
        applied_ids = {
            a.drive_id for a in Application.query.filter_by(student_id=s.id).all()
        }

    result = []
    for d in drives:
        # Eligibility check
        eligible = True
        if s:
            if d.eligibility_tenth and s.tenth_marks < d.eligibility_tenth:
                eligible = False
            if d.eligibility_twelfth and s.twelfth_marks < d.eligibility_twelfth:
                eligible = False
            if d.eligibility_grad and s.grad_marks < d.eligibility_grad:
                eligible = False
            if d.eligibility_branches:
                allowed = [
                    b.strip().lower() for b in d.eligibility_branches.split(",") if b.strip()
                ]
                if allowed and s.branch.lower() not in allowed:
                    eligible = False
            if d.eligibility_graduating_years and s.graduating_year:
                allowed_years = [
                    y.strip() for y in d.eligibility_graduating_years.split(",") if y.strip()
                ]
                if allowed_years and str(s.graduating_year) not in allowed_years:
                    eligible = False

        if eligible_only == "1" and not eligible:
            continue

        result.append(
            dict(
                id=d.id,
                title=d.title,
                description=d.description,
                role_offered=d.role_offered,
                package_lpa=d.package_lpa,
                location=d.location,
                company_name=d.company.name,
                drive_date=d.drive_date.isoformat() if d.drive_date else "",
                last_date_to_apply=d.last_date_to_apply.isoformat()
                if d.last_date_to_apply
                else "",
                eligibility_tenth=d.eligibility_tenth,
                eligibility_twelfth=d.eligibility_twelfth,
                eligibility_grad=d.eligibility_grad,
                eligibility_branches=d.eligibility_branches,
                eligibility_graduating_years=d.eligibility_graduating_years,
                eligible=eligible,
                already_applied=d.id in applied_ids,
            )
        )
    return jsonify(result), 200


# ── Apply to drive ──────────────────────────────────────────────────────
@student_bp.route("/applications", methods=["POST"])
@auth_required("token")
@roles_required("student")
def apply_to_drive():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    if s.status == "blacklisted":
        return jsonify(msg="Your account is blacklisted."), 403

    data = request.get_json() or {}
    drive_id = data.get("drive_id")
    if not drive_id:
        return jsonify(msg="drive_id is required."), 400

    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.status != "approved":
        return jsonify(msg="Drive not found or not approved."), 404

    # Prevent duplicate
    existing = Application.query.filter_by(student_id=s.id, drive_id=drive_id).first()
    if existing:
        return jsonify(msg="You have already applied to this drive."), 409

    # Eligibility
    if drive.eligibility_tenth and s.tenth_marks < drive.eligibility_tenth:
        return jsonify(msg="You do not meet the 10th marks eligibility."), 403
    if drive.eligibility_twelfth and s.twelfth_marks < drive.eligibility_twelfth:
        return jsonify(msg="You do not meet the 12th marks eligibility."), 403
    if drive.eligibility_grad and s.grad_marks < drive.eligibility_grad:
        return jsonify(msg="You do not meet the graduation marks eligibility."), 403
    if drive.eligibility_branches:
        allowed = [b.strip().lower() for b in drive.eligibility_branches.split(",") if b.strip()]
        if allowed and s.branch.lower() not in allowed:
            return jsonify(msg="Your branch is not eligible for this drive."), 403

    application = Application(student_id=s.id, drive_id=drive_id, status="applied")
    db.session.add(application)
    db.session.commit()
    return jsonify(msg="Application submitted.", id=application.id), 201


@student_bp.route("/applications/<int:aid>", methods=["DELETE"])
@auth_required("token")
@roles_required("student")
def delete_application(aid):
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    app = Application.query.get_or_404(aid)
    if app.student_id != s.id:
        return jsonify(msg="Not your application."), 403
    if app.status != "applied":
        return jsonify(msg="Cannot withdraw — application already processed."), 400
    db.session.delete(app)
    db.session.commit()
    return jsonify(msg="Application withdrawn."), 200


# ── My applications ─────────────────────────────────────────────────────
@student_bp.route("/applications", methods=["GET"])
@auth_required("token")
@roles_required("student")
def my_applications():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    apps = (
        Application.query.filter_by(student_id=s.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    result = []
    for a in apps:
        d = a.drive
        interviews = [
            dict(
                id=i.id,
                scheduled_at=i.scheduled_at.isoformat() if i.scheduled_at else "",
                mode=i.mode,
                link=i.link,
                venue=i.venue,
                notes=i.notes,
            )
            for i in a.interviews
        ]
        result.append(
            dict(
                id=a.id,
                drive_id=d.id,
                drive_title=d.title,
                company_name=d.company.name,
                role_offered=d.role_offered,
                package_lpa=d.package_lpa,
                status=a.status,
                applied_at=a.applied_at.isoformat() if a.applied_at else "",
                interviews=interviews,
            )
        )
    return jsonify(result), 200


# ── Placement history (all results) ─────────────────────────────────────
@student_bp.route("/placements", methods=["GET"])
@auth_required("token")
@roles_required("student")
def placement_history():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404
    apps = Application.query.filter_by(student_id=s.id).all()
    result = []
    for a in apps:
        d = a.drive
        result.append(
            dict(
                id=a.id,
                drive_title=d.title,
                company_name=d.company.name,
                role_offered=d.role_offered,
                package_lpa=d.package_lpa,
                location=d.location,
                status=a.status,
                applied_at=a.applied_at.isoformat() if a.applied_at else "",
            )
        )
    return jsonify(result), 200
