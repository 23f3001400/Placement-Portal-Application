from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin

db = SQLAlchemy()

roles_users = db.Table(
    "roles_users",
    db.Column("user_id", db.Integer, db.ForeignKey("user.id")),
    db.Column("role_id", db.Integer, db.ForeignKey("role.id")),
)


class Role(db.Model, RoleMixin):
    __tablename__ = "role"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    confirmed_at = db.Column(db.DateTime)
    roles = db.relationship(
        "Role", secondary=roles_users, backref=db.backref("users", lazy="dynamic")
    )

    # One-to-one links to profile tables
    company = db.relationship("Company", backref="user", uselist=False)
    student = db.relationship("Student", backref="user", uselist=False)

    def role_names(self):
        return [r.name for r in self.roles]


class Company(db.Model):
    __tablename__ = "company"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    website = db.Column(db.String(300), default="")
    industry = db.Column(db.String(100), default="")
    status = db.Column(
        db.String(20), default="pending"
    )  # pending | approved | rejected | blacklisted
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    drives = db.relationship(
        "PlacementDrive", backref="company", lazy=True, cascade="all, delete-orphan"
    )


class Student(db.Model):
    __tablename__ = "student"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), default="")
    tenth_marks = db.Column(db.Float, default=0.0)
    twelfth_marks = db.Column(db.Float, default=0.0)
    grad_marks = db.Column(db.Float, default=0.0)
    degree = db.Column(db.String(100), default="")
    branch = db.Column(db.String(100), default="")
    graduating_year = db.Column(db.Integer, default=0)
    skills = db.Column(db.Text, default="")
    resume_path = db.Column(db.String(500), default="")
    status = db.Column(
        db.String(20), default="active"
    )  # active | blacklisted
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    applications = db.relationship(
        "Application", backref="student", lazy=True, cascade="all, delete-orphan"
    )


class PlacementDrive(db.Model):
    __tablename__ = "placement_drive"
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, default="")
    role_offered = db.Column(db.String(200), default="")
    package_lpa = db.Column(db.Float, default=0.0)
    location = db.Column(db.String(200), default="")
    eligibility_tenth = db.Column(db.Float, default=0.0)
    eligibility_twelfth = db.Column(db.Float, default=0.0)
    eligibility_grad = db.Column(db.Float, default=0.0)
    eligibility_branches = db.Column(db.String(500), default="")  # comma-separated
    eligibility_graduating_years = db.Column(db.String(200), default="")  # comma-separated, e.g. "2026,2027"
    drive_date = db.Column(db.DateTime, nullable=True)
    last_date_to_apply = db.Column(db.DateTime, nullable=True)
    status = db.Column(
        db.String(20), default="pending"
    )  # pending | approved | rejected | completed
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    applications = db.relationship(
        "Application", backref="drive", lazy=True, cascade="all, delete-orphan"
    )


class Application(db.Model):
    __tablename__ = "application"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    drive_id = db.Column(
        db.Integer, db.ForeignKey("placement_drive.id"), nullable=False
    )
    status = db.Column(
        db.String(20), default="applied"
    )  # applied | shortlisted | interview | selected | rejected
    applied_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Unique constraint — a student can apply only once per drive
    __table_args__ = (
        db.UniqueConstraint("student_id", "drive_id", name="uq_student_drive"),
    )

    interviews = db.relationship(
        "Interview", backref="application", lazy=True, cascade="all, delete-orphan"
    )


class Interview(db.Model):
    __tablename__ = "interview"
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(
        db.Integer, db.ForeignKey("application.id"), nullable=False
    )
    scheduled_at = db.Column(db.DateTime, nullable=False)
    mode = db.Column(db.String(50), default="online")  # online | offline
    link = db.Column(db.String(500), default="")
    venue = db.Column(db.String(300), default="")
    notes = db.Column(db.Text, default="")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )