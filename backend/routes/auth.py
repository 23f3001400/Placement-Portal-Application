from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_security import (
    hash_password,
    verify_password,
    login_user,
    logout_user,
    current_user,
    auth_required,
)
from models import db, User, Company, Student

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "")  # "student" or "company"

    if role not in ("student", "company"):
        return jsonify(msg="Role must be 'student' or 'company'."), 400
    if not email or not password:
        return jsonify(msg="Email and password are required."), 400
    if len(password) < 6:
        return jsonify(msg="Password must be at least 6 characters."), 400

    from flask_security import SQLAlchemyUserDatastore

    user_datastore: SQLAlchemyUserDatastore = (
        auth_bp.user_datastore  # attached in app.py
    )

    if user_datastore.find_user(email=email):
        return jsonify(msg="Email already registered."), 409

    user = user_datastore.create_user(
        email=email,
        password=hash_password(password),
        roles=[role],
        confirmed_at=datetime.now(timezone.utc),
    )
    db.session.flush()

    if role == "company":
        company = Company(
            user_id=user.id,
            name=data.get("company_name", email.split("@")[0]),
            description=data.get("description", ""),
            website=data.get("website", ""),
            industry=data.get("industry", ""),
            status="pending",
        )
        db.session.add(company)
    else:
        student = Student(
            user_id=user.id,
            name=data.get("name", email.split("@")[0]),
            phone=data.get("phone", ""),
            tenth_marks=float(data.get("tenth_marks", 0)),
            twelfth_marks=float(data.get("twelfth_marks", 0)),
            grad_marks=float(data.get("grad_marks", 0)),
            degree=data.get("degree", ""),
            branch=data.get("branch", ""),
            graduating_year=int(data.get("graduating_year", 0)),
            skills=data.get("skills", ""),
        )
        db.session.add(student)

    db.session.commit()
    return jsonify(msg="Registration successful. Please login."), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    from flask_security import SQLAlchemyUserDatastore

    user_datastore: SQLAlchemyUserDatastore = auth_bp.user_datastore

    user = user_datastore.find_user(email=email)
    if not user or not verify_password(password, user.password):
        return jsonify(msg="Invalid email or password."), 401

    if not user.active:
        return jsonify(msg="Your account has been deactivated."), 403

    login_user(user)
    token = user.get_auth_token()

    role = user.role_names()[0] if user.role_names() else ""
    resp = {"msg": "Login successful.", "token": token, "role": role, "email": user.email}

    # Attach status for company users
    if role == "company" and user.company:
        resp["company_status"] = user.company.status
    if role == "student" and user.student:
        resp["student_status"] = user.student.status

    return jsonify(resp), 200


@auth_bp.route("/logout", methods=["POST"])
@auth_required("token")
def logout():
    logout_user()
    return jsonify(msg="Logged out."), 200


@auth_bp.route("/me", methods=["GET"])
@auth_required("token")
def me():
    user = current_user
    role = user.role_names()[0] if user.role_names() else ""
    resp = {"id": user.id, "email": user.email, "role": role}

    if role == "company" and user.company:
        resp["company"] = {
            "id": user.company.id,
            "name": user.company.name,
            "status": user.company.status,
        }
    elif role == "student" and user.student:
        resp["student"] = {
            "id": user.student.id,
            "name": user.student.name,
            "status": user.student.status,
        }
    return jsonify(resp), 200
