# Placement Portal Application (PPA)

A full-stack placement management portal with **Flask** backend, **Vue 3** frontend, **Celery** background jobs, and **Redis** caching.

## 🚀 Tech Stack

| Layer       | Tech |
|-------------|------|
| Backend     | Flask, Flask-Security-Too, SQLAlchemy, SQLite |
| Frontend    | Vue 3, Vue Router, Bootstrap 5 |
| API         | REST + Fetch API (no Axios) |
| Jobs        | Celery + Redis (scheduled & async tasks) |
| Caching     | Flask-Caching + Redis |
| Email       | Flask-Mail (SMTP) |
| Webhooks    | Google Chat Incoming Webhooks |

## 👥 Roles

- **Admin** — Manage companies, students, drives, view reports
- **Company** — Create drives, manage applicants, schedule interviews
- **Student** — Browse drives, apply, track applications, export CSV

## 📦 Quick Start

### Prerequisites
- Python 3.10+
- Redis server (`sudo apt install redis-server`)

### 1. Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/macOS
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `backend/.env` with your credentials:

```env
GCHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/..."
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD="your-app-password"
ADMIN_EMAIL=admin@example.com
```

### 3. Run Everything

```bash
cd backend
./start.sh          # Starts Redis, Flask, Celery Worker, Celery Beat
./start.sh stop     # Stops all services
```

This launches all 4 services and logs output to `backend/logs/`.

Open **http://localhost:5000** in your browser.

### Manual Start (Alternative)

```bash
# Terminal 1: Flask
python app.py

# Terminal 2: Celery Worker
celery -A app:celery_app worker --loglevel=info

# Terminal 3: Celery Beat (scheduler)
celery -A app:celery_app beat --loglevel=info
```

## 🔑 Test Credentials

| Role  | Email         | Password |
|-------|---------------|----------|
| Admin | admin@ppa.com | 111111   |

> Admin is auto-created on first start. Register new student/company accounts from the registration page.

## ⚙️ Background Jobs

### a) Daily Reminders (Google Chat Webhook)
- Runs daily at **8:00 AM IST** via Celery Beat
- Finds placement drives with deadlines in the **next 3 days**
- Posts a formatted summary to a Google Chat Space
- Requires `GCHAT_WEBHOOK_URL` in `.env`

### b) Monthly Activity Report (Email)
- Runs on the **1st of every month at 9:00 AM IST**
- Generates an HTML report: drives conducted, applications, selections, company breakdown
- Sent to admin via email (Flask-Mail / SMTP)
- Requires `MAIL_USERNAME`, `MAIL_PASSWORD`, `ADMIN_EMAIL` in `.env`

### c) CSV Export (User-Triggered Async)
- Students click **"Export CSV"** on the dashboard
- Triggers an async Celery task → generates CSV in background
- Auto-downloads when ready (with status polling)
- Includes: Student ID, Company, Drive, Role, Package, Status, Dates

### Manual Task Triggers

```bash
celery -A app:celery_app call tasks.reminders.send_daily_reminders
celery -A app:celery_app call tasks.monthly_report.send_monthly_report
```

## 🚀 Performance & Caching

Redis-backed caching on expensive endpoints:

| Endpoint              | TTL  | Invalidated On                      |
|-----------------------|------|-------------------------------------|
| Admin Dashboard       | 60s  | Apply, withdraw, create drive, status change |
| Admin Reports         | 60s  | Apply, withdraw, create drive, status change |
| Student Drives List   | 30s  | Apply, withdraw, create drive       |

## 📁 Project Structure

```
PPA/
├── backend/
│   ├── app.py                 # Flask entry point + Celery init
│   ├── config.py              # All configuration
│   ├── extensions.py          # Shared cache & mail instances
│   ├── celery_app.py          # Celery factory + beat schedule
│   ├── models.py              # SQLAlchemy models
│   ├── seed_admin.py          # Admin auto-creation
│   ├── start.sh               # One-command startup script
│   ├── .env                   # Environment variables (git-ignored)
│   ├── requirements.txt       # Python dependencies
│   ├── routes/
│   │   ├── auth.py            # Auth (register/login/logout)
│   │   ├── admin.py           # Admin APIs (cached)
│   │   ├── company.py         # Company drive/applicant APIs
│   │   ├── student.py         # Student profile/apply APIs (cached)
│   │   └── tasks_routes.py    # CSV export trigger/status/download
│   └── tasks/
│       ├── reminders.py       # Daily G-Chat webhook reminders
│       ├── monthly_report.py  # Monthly HTML email report
│       └── export_csv.py      # Async CSV export job
│
├── frontend/
│   ├── index.html             # SPA entry
│   ├── main.js                # Vue app bootstrap
│   ├── router.js              # Vue Router config
│   ├── services/api.js        # Fetch API helper
│   ├── components/
│   │   └── Navbar.js          # Navigation component
│   └── views/
│       ├── Login.js / Register.js
│       ├── AdminDashboard.js / AdminCompanies.js / AdminStudents.js / AdminDrives.js / AdminReports.js
│       ├── CompanyDashboard.js / CompanyDrives.js / CompanyApplicants.js / CompanyInterviews.js
│       └── StudentDashboard.js / StudentDrives.js / StudentApplications.js / StudentProfile.js / StudentPlacements.js
│
└── README.md
```

## 🔄 Typical Workflow

1. **Admin** logs in → approves company registrations
2. **Company** creates placement drives → admin approves them
3. **Students** browse approved drives → apply (with eligibility checks)
4. **Company** shortlists → schedules interviews → marks final selections
5. **Admin** views placement reports and statistics
6. **Daily** at 8 AM → upcoming deadline reminders sent to Google Chat
7. **Monthly** on the 1st → activity report emailed to admin
8. **Anytime** → students export application history as CSV

## 🔐 Environment Variables

| Variable              | Required | Default              | Description                     |
|-----------------------|----------|----------------------|---------------------------------|
| `GCHAT_WEBHOOK_URL`   | For reminders | _(empty)_       | Google Chat webhook URL         |
| `MAIL_USERNAME`       | For reports   | _(empty)_       | SMTP username (Gmail)           |
| `MAIL_PASSWORD`       | For reports   | _(empty)_       | SMTP app password               |
| `MAIL_DEFAULT_SENDER` | For reports   | ppa-noreply@... | Email sender address            |
| `ADMIN_EMAIL`         | For reports   | admin@ppa.com   | Monthly report recipient        |
| `REDIS_URL`           | No       | redis://localhost:6379/0 | Redis connection           |
| `SECRET_KEY`          | In prod  | _(default)_          | Flask secret key                |
