# Placement Portal Application (PPA)

A full-stack placement management portal with **Flask** backend and **Vue 3** frontend.

## 🚀 Tech Stack

| Layer    | Tech |
|----------|------|
| Backend  | Flask, Flask-Security-Too, SQLAlchemy, SQLite |
| Frontend | Vue 3, Vue Router, Bootstrap 5 |
| API      | REST + Fetch API (no Axios) |

## 👥 Roles

- **Admin** — Manage companies, students, drives, view reports
- **Company** — Create drives, manage applicants, schedule interviews
- **Student** — Browse drives, apply, track applications

## 📦 Setup & Run

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000** in your browser. That's it — both API and frontend are served from the same port.

## 🔑 Test Credentials

| Role    | Email            | Password    |
|---------|------------------|-------------|
| Admin   | admin@ppa.com    | 111111      |

> Admin is auto-created on first backend start. Register new student/company accounts from the registration page.

## 📁 Project Structure

```
PPA/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Configuration
│   ├── models.py           # SQLAlchemy models
│   ├── seed_admin.py       # Admin auto-creation
│   ├── requirements.txt    # Python dependencies
│   └── routes/
│       ├── auth.py         # Auth (register/login/logout)
│       ├── admin.py        # Admin management APIs
│       ├── company.py      # Company drive/applicant APIs
│       └── student.py      # Student profile/apply APIs
│
├── frontend/
│   ├── index.html          # SPA entry
│   ├── main.js             # Vue app bootstrap
│   ├── router.js           # Vue Router config
│   ├── services/api.js     # Fetch API helper
│   ├── components/
│   │   └── Navbar.js       # Navigation component
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
