# Placement Portal Application (PPA)

A comprehensive full-stack placement management system built for educational institutions to streamline the campus recruitment process — from company onboarding to final candidate selection.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Production (Render.com)                   │
│                                                              │
│   ┌────────────────────────────────────────────────────┐     │
│   │              Web Service (Gunicorn)                │     │
│   │                                                    │     │
│   │   ┌──────────────┐    ┌──────────────────────┐     │     │
│   │   │  Flask API   │    │  Celery (eager mode) │     │     │
│   │   │  REST + Auth │    │  CSV export runs     │     │     │
│   │   └──────┬───────┘    │  in-process          │     │     │
│   │          │            └──────────────────────┘     │     │
│   │   ┌──────┴───────┐    ┌──────────────────────┐     │     │
│   │   │ Static Files │    │  HTTP Cron Endpoints │     │     │
│   │   │ (Vue 3 SPA)  │    │  /api/cron/*         │     │     │
│   │   └──────────────┘    └──────────┬───────────┘     │     │
│   └──────────────────────────────────┼─────────────────┘     │
│                                      │                       │
│   ┌──────────────────────────────────┴──────────────────┐    │
│   │              PostgreSQL Database                    │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐    │
│   │                  Upstash Redis                      │    │
│   │            Cache Store + Task Backend               │    │
│   └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                           ▲
                           │ POST /api/cron/*
                  ┌────────┴─────────┐
                  │  External Cron   │
                  │  (cron-job.org)  │
                  └──────────────────┘
```

```
User → Browser (Vue 3 SPA)
        │
        ├─ REST API ────→ Flask ──→ PostgreSQL (data)
        │                     └──→ Redis (cache)
        │
        └─ CSV Export ──→ Celery (eager, in-process)

External Cron ──→ POST /api/cron/* ──→ Reminders (Google Chat)
                                   └──→ Reports (SMTP email)
```

---

## 🚀 Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Backend     | Flask, Flask-Security-Too, SQLAlchemy, Gunicorn   |
| Database    | PostgreSQL (production) / SQLite (local dev)      |
| Frontend    | Vue 3, Vue Router, Bootstrap 5, Chart.js          |
| Async Jobs  | Celery (eager mode) + HTTP cron endpoints         |
| Caching     | Flask-Caching + Redis                             |
| Email       | Flask-Mail (SMTP)                                 |
| Webhooks    | Google Chat Incoming Webhooks                     |
| Deployment  | Render.com(Web Service + Postgres + Upstash Redis)|

---

## 👥 User Roles & Features

### Admin
- Approve / reject / blacklist company registrations
- Approve / reject placement drives
- Manage student accounts
- View platform-wide placement reports & analytics
- Receive automated monthly activity reports via email

### Company
- Register and maintain company profile
- Create placement drives with eligibility criteria
- View and manage applicants per drive
- Shortlist, interview, select, or reject candidates
- Schedule interviews (online/offline) with details
- View per-drive and overall recruitment reports

### Student
- Register with academic details and upload resume
- Browse approved placement drives with eligibility filtering
- Apply to drives, track application status
- View scheduled interviews
- Export application history as CSV (async background job)
- View personal placement dashboard

---

## ⚙️ Background Jobs & Scheduled Tasks

| Job                  | Trigger                          | Description                                                        |
|----------------------|----------------------------------|--------------------------------------------------------------------||
| Daily Reminders      | External cron → HTTP endpoint    | Posts upcoming deadline alerts (next 3 days) to Google Chat         |
| Monthly Report       | External cron → HTTP endpoint    | Emails an HTML report with drives, applications, selections stats  |
| CSV Export           | User-triggered (runs in-process) | Generates and serves a CSV of the student's application history    |

Scheduled tasks are triggered via HTTP cron endpoints (`/api/cron/*`) protected by a `CRON_SECRET` header, invoked by an external cron service like [cron-job.org](https://cron-job.org).

---

## 🚀 Performance & Caching

| Endpoint              | TTL  | Invalidated On                                      |
|-----------------------|------|-----------------------------------------------------|
| Admin Dashboard       | 60s  | Apply, withdraw, create drive, status change        |
| Admin Reports         | 60s  | Apply, withdraw, create drive, status change        |
| Student Drives List   | 30s  | Apply, withdraw, create drive                       |

---

## 📁 Project Structure

```
Placement-Portal-Application/
├── render.yaml                # Render Blueprint (infrastructure-as-code)
├── build.sh                   # Production build & DB init script
├── README.md
│
├── backend/
│   ├── app.py                 # Flask entry point + Celery init
│   ├── config.py              # Configuration (DB, Redis, CORS, Mail, etc.)
│   ├── extensions.py          # Shared Flask extensions (cache, mail)
│   ├── celery_app.py          # Celery factory + beat schedule
│   ├── models.py              # SQLAlchemy models
│   ├── seed_admin.py          # Admin auto-creation on first run
│   ├── create_tables.py       # Standalone DB init for production builds
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py            # Register / Login / Logout / Me
│   │   ├── admin.py           # Admin dashboard, companies, students, drives, reports
│   │   ├── company.py         # Company profile, drives, applicants, interviews
│   │   ├── student.py         # Student profile, drives, applications
│   │   ├── tasks_routes.py    # CSV export trigger / status / download
│   │   └── cron.py            # HTTP cron endpoints (reminders, reports)
│   └── tasks/
│       ├── reminders.py       # Daily Google Chat webhook reminders
│       ├── monthly_report.py  # Monthly HTML email report
│       └── export_csv.py      # Async CSV generation
│
└── frontend/
    ├── index.html             # SPA shell + styles
    ├── main.js                # Vue app bootstrap
    ├── router.js              # Vue Router configuration
    ├── services/api.js        # Fetch-based API helper
    ├── components/
    │   └── Navbar.js
    └── views/
        ├── Login.js, Register.js
        ├── AdminDashboard.js, AdminCompanies.js, AdminStudents.js,
        │   AdminDrives.js, AdminReports.js
        ├── CompanyDashboard.js, CompanyDrives.js, CompanyApplicants.js,
        │   CompanyInterviews.js, CompanyReports.js
        └── StudentDashboard.js, StudentDrives.js, StudentApplications.js,
            StudentProfile.js, StudentPlacements.js
```

---

## 🔄 Typical Workflow

1. **Admin** logs in → approves company registrations
2. **Company** creates placement drives → admin approves them
3. **Students** browse approved drives → apply (eligibility auto-checked)
4. **Company** shortlists → schedules interviews → marks final selections
5. **Admin** monitors placement reports and statistics
6. **Daily** — upcoming deadline reminders posted to Google Chat
7. **Monthly** — activity report emailed to admin
8. **Anytime** — students export application history as CSV

---

## 📦 Quick Start (Local Dev)

```bash
# Install
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configure backend/.env (see .env.example or docs)

# Run
python app.py                                          # Flask server
celery -A app:celery_app worker --loglevel=info        # Worker
celery -A app:celery_app beat --loglevel=info          # Scheduler
```

Open **http://localhost:5000** — Admin: `admin@ppa.com` / `111111`

---

## 🔐 Environment Variables

| Variable                  | Purpose                                      |
|---------------------------|----------------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                 |
| `REDIS_URL`               | Redis (cache, broker, backend)               |
| `SECRET_KEY`              | Flask secret key                             |
| `SECURITY_PASSWORD_SALT`  | Flask-Security salt                          |
| `CORS_ORIGINS`            | Allowed frontend origins                     |
| `CRON_SECRET`             | Auth header for HTTP cron endpoints          |
| `CELERY_ALWAYS_EAGER`     | Set `true` to run tasks in-process (no worker)|
| `GCHAT_WEBHOOK_URL`       | Google Chat webhook for reminders            |
| `MAIL_USERNAME`           | SMTP username                                |
| `MAIL_PASSWORD`           | SMTP app password                            |
| `ADMIN_EMAIL`             | Monthly report recipient                     |
