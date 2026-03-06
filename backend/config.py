import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-in-prod")
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "ppa.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Security
    SECURITY_PASSWORD_SALT = os.environ.get(
        "SECURITY_PASSWORD_SALT", "very-salty-salt-12345"
    )
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = 3600  # 1 hour
    SECURITY_REGISTERABLE = False  # We handle registration ourselves
    SECURITY_SEND_REGISTER_EMAIL = False
    SECURITY_SEND_PASSWORD_CHANGE_EMAIL = False
    SECURITY_SEND_PASSWORD_RESET_EMAIL = False
    SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS = True
    WTF_CSRF_ENABLED = False

    # CORS
    CORS_ORIGINS = ["http://localhost:5500", "http://127.0.0.1:5500"]

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    EXPORT_FOLDER = os.path.join(BASE_DIR, "exports")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

    # ── Redis / Celery ──────────────────────────────────────────────────
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CELERY = {
        "broker_url": os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/1"),
        "result_backend": os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/2"),
        "task_ignore_result": False,
        "timezone": "Asia/Kolkata",
    }

    # ── Flask-Caching (Redis) ───────────────────────────────────────────
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.environ.get("CACHE_REDIS_URL", "redis://localhost:6379/3")
    CACHE_DEFAULT_TIMEOUT = 60  # seconds

    # ── Flask-Mail (SMTP) ───────────────────────────────────────────────
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "ppa-noreply@example.com")

    # ── Admin / Webhooks ────────────────────────────────────────────────
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@ppa.com")
    GCHAT_WEBHOOK_URL = os.environ.get("GCHAT_WEBHOOK_URL", "")
