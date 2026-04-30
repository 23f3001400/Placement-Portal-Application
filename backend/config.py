import os
from dotenv import load_dotenv

load_dotenv()  # Read .env file into os.environ

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-in-prod")

    # Database — use DATABASE_URL (Postgres on Render) if set, else SQLite for local dev
    _db_url = os.environ.get("DATABASE_URL", "")
    # Render gives postgres:// but SQLAlchemy needs postgresql://
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url or ("sqlite:///" + os.path.join(BASE_DIR, "ppa.db"))
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Security
    SECURITY_PASSWORD_SALT = os.environ.get(
        "SECURITY_PASSWORD_SALT", "very-salty-salt-12345"
    )
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = 3600
    SECURITY_REGISTERABLE = False  # We handle registration ourselves
    SECURITY_SEND_REGISTER_EMAIL = False
    SECURITY_SEND_PASSWORD_CHANGE_EMAIL = False
    SECURITY_SEND_PASSWORD_RESET_EMAIL = False
    SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS = True
    WTF_CSRF_ENABLED = False

    # CORS — allow Render URL + local dev
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5000,http://127.0.0.1:5000,http://localhost:5500,http://127.0.0.1:5500"
        ).split(",")
    ]

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    EXPORT_FOLDER = os.path.join(BASE_DIR, "exports")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

    # Redis / Celery
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    _celery_broker = os.environ.get("CELERY_BROKER_URL", os.environ.get("REDIS_URL", "redis://localhost:6379/1"))
    _celery_backend = os.environ.get("CELERY_RESULT_BACKEND", os.environ.get("REDIS_URL", "redis://localhost:6379/2"))

    CELERY = {
        "broker_url": _celery_broker,
        "result_backend": _celery_backend,
        "task_ignore_result": False,
        "timezone": "Asia/Kolkata",
        "broker_connection_retry_on_startup": True,
    }

    # Run tasks synchronously when no Celery worker is available (e.g. Render free tier)
    if os.environ.get("CELERY_ALWAYS_EAGER", "").lower() in ("1", "true", "yes"):
        CELERY["task_always_eager"] = True
        CELERY["task_eager_propagates"] = True

    # If using TLS (rediss://), Celery needs explicit SSL config
    if _celery_broker.startswith("rediss://"):
        import ssl
        CELERY["broker_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_NONE}
        CELERY["redis_backend_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_NONE}

    # Flask-Caching (Redis)
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.environ.get("CACHE_REDIS_URL", os.environ.get("REDIS_URL", "redis://localhost:6379/3"))
    CACHE_DEFAULT_TIMEOUT = 60  # seconds

    # Flask-Mail (SMTP)
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "ppa-noreply@example.com")

    # Admin / Webhooks 
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@ppa.com")
    GCHAT_WEBHOOK_URL = os.environ.get("GCHAT_WEBHOOK_URL", "")
