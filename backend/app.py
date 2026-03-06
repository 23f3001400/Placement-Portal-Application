"""Placement Portal Application — Flask entry point.
Serves both the API and the Vue 3 frontend on a single port.
"""

import os
import sys

# Ensure the backend directory is on the Python path (needed for Celery CLI)
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_security import Security, SQLAlchemyUserDatastore

from config import Config
from models import db, User, Role
from extensions import cache, mail

from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.company import company_bp
from routes.student import student_bp
from routes.tasks_routes import tasks_bp
from seed_admin import seed_admin
from celery_app import celery_init_app

# Resolve the frontend directory (one level up from backend/)
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))


def create_app():
    app = Flask(__name__, static_folder=None)  # disable default /static
    app.config.from_object(Config)

    # Ensure upload & export directories exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["EXPORT_FOLDER"], exist_ok=True)

    # Extensions
    db.init_app(app)
    cache.init_app(app)
    mail.init_app(app)

    # Flask-Security
    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    security = Security(app, user_datastore)

    # Share user_datastore with auth blueprint
    auth_bp.user_datastore = user_datastore

    # Register API blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(tasks_bp)

    # ── Serve frontend files ────────────────────────────────────────────
    @app.route("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:path>")
    def serve_frontend(path):
        # Try to serve the requested file from frontend/
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(file_path):
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            return send_from_directory(directory, filename)
        # Fall back to index.html for SPA client-side routing
        return send_from_directory(FRONTEND_DIR, "index.html")

    # Create tables & seed admin
    with app.app_context():
        db.create_all()
        seed_admin(app, user_datastore, db)

    return app


# Create the Flask app
app = create_app()

# Initialize Celery (must be after create_app so config is loaded)
celery_app = celery_init_app(app)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
