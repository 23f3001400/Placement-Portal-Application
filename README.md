# Placement Portal Application (PPA)

A full-stack placement management portal with **Flask** backend, **Vue 3** frontend, **Celery** background jobs, **Redis** caching, and **PostgreSQL** database — deployable on **Render.com**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Render.com                                  │
│                                                                     │
│   ┌──────────────────────┐       ┌─────────────────────────────┐    │
│   │    Web Service       │       │    Background Worker        │    │
│   │  ┌────────────────┐  │       │  ┌───────────────────────┐  │    │
│   │  │ Gunicorn (WSGI)│  │       │  │ Celery Worker + Beat  │  │    │
│   │  │    ┌────────┐  │  │       │  │  ┌─────────────────┐  │  │    │
│   │  │    │ Flask  │  │  │       │  │  │ Scheduled Tasks │  │  │    │
│   │  │    │  API   │  │  │       │  │  │  • Reminders    │  │  │    │
│   │  │    └───┬────┘  │  │       │  │  │  • Reports      │  │  │    │
│   │  └────────┼───────┘  │       │  │  │  • CSV Export   │  │  │    │
│   │           │          │       │  │  └─────────────────┘  │  │    │
│   │  ┌────────┴───────┐  │       │  └───────────┬───────────┘  │    │
│   │  │  Static Files  │  │       │              │              │    │
│   │  │  (Vue 3 SPA)   │  │       │              │              │    │
│   │  └────────────────┘  │       │              │              │    │
│   └──────────┬───────────┘       └──────────────┼──────────────┘    │
│              │                                  │                   │
│         ┌────┴──────────────────────────────────┴────┐              │
│         │          PostgreSQL (Render Free)          │              │
│         └────────────────────────────────────────────┘              │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │           Upstash Redis (External, Free)                │       │
│   │    Broker • Result Backend • Cache • General Store      │       │
│   └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User → Browser (Vue 3 SPA)
        │
        ├─ REST API ──→ Flask ──→ PostgreSQL (data)
        │                   └──→ Redis (cache)
        │
        └─ Async Task ─→ Celery Worker ──→ Redis (broker)
                              ├──→ Google Chat (webhooks)
                              └──→ SMTP (email reports)
```

---

## 🚀 Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Backend     | Flask, Flask-Security-Too, SQLAlchemy, Gunicorn   |
| Database    | PostgreSQL (production) / SQLite (local dev)      |
| Frontend    | Vue 3, Vue Router, Bootstrap 5, Chart.js          |
| API         | REST + Fetch API                                  |
| Jobs        | Celery + Redis (scheduled & async tasks)          |
| Caching     | Flask-Caching + Redis                             |
| Redis       | Upstash (cloud) / Local Redis (dev)               |
| Email       | Flask-Mail (SMTP via Gmail)                       |
| Webhooks    | Google Chat Incoming Webhooks                     |
| Deployment  | Render.com (Web Service + Worker + Postgres)      |

---

## 👥 Roles

| Role        | Capabilities                                                       |
|-------------|---------------------------------------------------------------------|
| **Admin**   | Manage companies, students, drives; view reports & analytics        |
| **Company** | Create placement drives, manage applicants, schedule interviews     |
| **Student** | Browse drives, apply, track applications, export CSV                |

---

## 📦 Local Development Setup

### Prerequisites
- Python 3.10+
- Redis server (local) **OR** an Upstash Redis URL

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/macOS
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env`:

```env
# Redis — use local Redis or Upstash
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
CACHE_REDIS_URL=redis://localhost:6379/3

# Google Chat (optional)
GCHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/..."

# Email / SMTP (optional)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD="your-app-password"
MAIL_DEFAULT_SENDER=your-email@gmail.com
ADMIN_EMAIL=admin@example.com

# Flask
SECRET_KEY=your-secret-key
SECURITY_PASSWORD_SALT=your-salt
```

### 3. Run the Application

```bash
# Terminal 1: Flask dev server
cd backend
python app.py

# Terminal 2: Celery Worker
celery -A app:celery_app worker --loglevel=info

# Terminal 3: Celery Beat (scheduler)
celery -A app:celery_app beat --loglevel=info
```

Open **http://localhost:5000** in your browser.

---

## ☁️ Render.com Deployment

### Prerequisites
- GitHub account with this repo pushed
- Free [Upstash](https://upstash.com) account (for Redis)
- Free [Render](https://render.com) account

### Step 1: Create Upstash Redis

1. Sign up at [upstash.com](https://upstash.com)
2. Click **Create Database** → Name: `ppa-redis`, Region: **US East 1**
3. Copy the **Redis URL** (starts with `rediss://default:...`)

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` and creates:
   - **ppa-web** — Flask + Gunicorn web service
   - **ppa-worker** — Celery worker + beat
   - **ppa-db** — PostgreSQL database (free)

### Step 3: Set Environment Variables

In Render dashboard, set these for **both** `ppa-web` and `ppa-worker`:

| Variable               | Value                                  |
|------------------------|----------------------------------------|
| `REDIS_URL`            | Your Upstash `rediss://...` URL        |
| `CELERY_BROKER_URL`    | Same Upstash URL                       |
| `CELERY_RESULT_BACKEND`| Same Upstash URL                       |
| `CACHE_REDIS_URL`      | Same Upstash URL                       |
| `MAIL_SERVER`          | `smtp.gmail.com`                       |
| `MAIL_PORT`            | `587`                                  |
| `MAIL_USERNAME`        | Your email address                     |
| `MAIL_PASSWORD`        | Your Gmail app password                |
| `MAIL_DEFAULT_SENDER`  | Your email address                     |
| `ADMIN_EMAIL`          | Admin email for reports                |
| `GCHAT_WEBHOOK_URL`    | Your Google Chat webhook URL           |
| `CORS_ORIGINS`         | `https://ppa-web.onrender.com`         |

> `SECRET_KEY` and `SECURITY_PASSWORD_SALT` are auto-generated by Render.  
> `DATABASE_URL` is auto-injected from the Postgres database.

### Step 4: Deploy

Click **Manual Deploy** → **Deploy latest commit**. The build script will:
1. Install Python dependencies
2. Create all database tables
3. Seed the admin user
4. Start the web service and background worker

Your app will be live at `https://ppa-web.onrender.com`

> **Note:** Free tier services spin down after 15 min of inactivity. First request after spin-down takes ~30 seconds.

---

## 🔑 Test Credentials

| Role  | Email           | Password |
|-------|-----------------|----------|
| Admin | admin@ppa.com   | 111111   |

> Admin is auto-created on first start. Register new student/company accounts from the registration page.

---

## ⚙️ Background Jobs

### a) Daily Reminders (Google Chat Webhook)
- **Schedule:** Daily at 8:00 AM IST via Celery Beat
- Finds placement drives with deadlines in the **next 3 days**
- Posts a formatted summary to a Google Chat Space
- Requires `GCHAT_WEBHOOK_URL`

### b) Monthly Activity Report (Email)
- **Schedule:** 1st of every month at 9:00 AM IST
- Generates an HTML report: drives, applications, selections, company breakdown
- Sent to admin via email (Flask-Mail / SMTP)
- Requires `MAIL_USERNAME`, `MAIL_PASSWORD`, `ADMIN_EMAIL`

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

---

## 🚀 Performance & Caching

Redis-backed caching on expensive endpoints:

| Endpoint              | TTL  | Invalidated On                                     |
|-----------------------|------|-----------------------------------------------------|
| Admin Dashboard       | 60s  | Apply, withdraw, create drive, status change        |
| Admin Reports         | 60s  | Apply, withdraw, create drive, status change        |
| Student Drives List   | 30s  | Apply, withdraw, create drive                       |

---

## 📁 Project Structure

```
Placement-Portal-Application/
├── render.yaml                # Render Blueprint (infra-as-code)
├── build.sh                   # Render build script
├── README.md
│
├── backend/
│   ├── app.py                 # Flask entry point + Celery init
│   ├── config.py              # All configuration (DB, Redis, CORS, etc.)
│   ├── extensions.py          # Shared cache & mail instances
│   ├── celery_app.py          # Celery factory + beat schedule
│   ├── models.py              # SQLAlchemy models (User, Company, Student, etc.)
│   ├── seed_admin.py          # Admin auto-creation on first run
│   ├── create_tables.py       # Standalone DB init (used by build.sh)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (git-ignored)
│   ├── routes/
│   │   ├── auth.py            # Auth (register/login/logout)
│   │   ├── admin.py           # Admin APIs (cached)
│   │   ├── company.py         # Company drive/applicant APIs
│   │   ├── student.py         # Student profile/apply APIs (cached)
│   │   └── tasks_routes.py    # CSV export trigger/status/download
│   └── tasks/
│       ├── reminders.py       # Daily Google Chat webhook reminders
│       ├── monthly_report.py  # Monthly HTML email report
│       └── export_csv.py      # Async CSV export job
│
└── frontend/
    ├── index.html             # SPA entry point
    ├── main.js                # Vue app bootstrap
    ├── router.js              # Vue Router config
    ├── services/api.js        # Fetch API helper
    ├── components/
    │   └── Navbar.js          # Navigation component
    └── views/
        ├── Login.js / Register.js
        ├── AdminDashboard.js / AdminCompanies.js / AdminStudents.js
        ├── AdminDrives.js / AdminReports.js
        ├── CompanyDashboard.js / CompanyDrives.js / CompanyApplicants.js
        ├── CompanyInterviews.js / CompanyReports.js
        └── StudentDashboard.js / StudentDrives.js / StudentApplications.js
            StudentProfile.js / StudentPlacements.js
```

---

## 🔄 Typical Workflow

1. **Admin** logs in → approves company registrations
2. **Company** creates placement drives → admin approves them
3. **Students** browse approved drives → apply (with eligibility checks)
4. **Company** shortlists → schedules interviews → marks final selections
5. **Admin** views placement reports and statistics
6. **Daily** at 8 AM → upcoming deadline reminders sent to Google Chat
7. **Monthly** on the 1st → activity report emailed to admin
8. **Anytime** → students export application history as CSV

---

## 🔐 Environment Variables Reference

| Variable                  | Required     | Default                     | Description                          |
|---------------------------|--------------|-----------------------------|--------------------------------------|
| `DATABASE_URL`            | In prod      | SQLite (local)              | PostgreSQL connection string         |
| `REDIS_URL`               | Yes          | `redis://localhost:6379/0`  | Redis connection URL                 |
| `CELERY_BROKER_URL`       | No           | Falls back to `REDIS_URL`   | Celery message broker                |
| `CELERY_RESULT_BACKEND`   | No           | Falls back to `REDIS_URL`   | Celery result storage                |
| `CACHE_REDIS_URL`         | No           | Falls back to `REDIS_URL`   | Flask-Caching Redis URL              |
| `SECRET_KEY`              | In prod      | _(default)_                 | Flask secret key                     |
| `SECURITY_PASSWORD_SALT`  | In prod      | _(default)_                 | Flask-Security password salt         |
| `CORS_ORIGINS`            | In prod      | `localhost:5000,5500`       | Comma-separated allowed origins      |
| `GCHAT_WEBHOOK_URL`       | For reminders| _(empty)_                   | Google Chat webhook URL              |
| `MAIL_SERVER`             | For reports  | `smtp.gmail.com`            | SMTP server                          |
| `MAIL_PORT`               | For reports  | `587`                       | SMTP port                            |
| `MAIL_USERNAME`           | For reports  | _(empty)_                   | SMTP username                        |
| `MAIL_PASSWORD`           | For reports  | _(empty)_                   | SMTP app password                    |
| `MAIL_DEFAULT_SENDER`     | For reports  | `ppa-noreply@example.com`   | Email sender address                 |
| `ADMIN_EMAIL`             | For reports  | `admin@ppa.com`             | Monthly report recipient             |
