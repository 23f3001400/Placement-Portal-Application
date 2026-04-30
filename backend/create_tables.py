"""Standalone script to create DB tables and seed admin.
Used by the Render build step (build.sh).
"""
from app import app
from models import db
from flask_security import SQLAlchemyUserDatastore
from models import User, Role
from seed_admin import seed_admin

with app.app_context():
    db.create_all()
    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    seed_admin(app, user_datastore, db)
    print("✅ Database tables created and admin seeded.")
