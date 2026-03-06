"""Auto-create the admin user and roles on first run."""

from flask_security import hash_password


def seed_admin(app, user_datastore, db):
    """Create roles and the default admin user if they don't exist."""
    with app.app_context():
        # Create roles
        user_datastore.find_or_create_role(name="admin", description="Administrator")
        user_datastore.find_or_create_role(name="company", description="Company / Recruiter")
        user_datastore.find_or_create_role(name="student", description="Student")
        db.session.commit()

        # Create admin user if not present
        if not user_datastore.find_user(email="admin@ppa.com"):
            user_datastore.create_user(
                email="admin@ppa.com",
                password=hash_password("111111"),
                roles=["admin"],
            )
            db.session.commit()
            print("✅  Admin user created  →  admin@ppa.com / 111111")
        else:
            print("ℹ️  Admin user already exists.")
