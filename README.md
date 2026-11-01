# Veloura

> **Intelligent Celebration & Event Architecture Platform**  
> Where bespoke gatherings meet machine precision and tactile elegance.

---

## Overview

Veloura is an AI-powered event planning platform crafted with a warm, editorial, and tactile luxury aesthetic. Rather than generic corporate SaaS dashboards or cold blue AI gradients, Veloura blends warm ivory, terracotta, coral, deep teal, and marigold tones with typography inspired by high-end design ateliers.

### Core Modules & Capabilities

1. **AI Event Studio**: Translates abstract sensory briefs and aesthetic concepts into architectural palettes, moodboards, and floral concepts.
2. **Dynamic Budget Planner**: Real-time expenditure tracking with contingency cushions and category benchmark splits.
3. **VendorMatch Curation**: Aesthetic pairing engine connecting host visions with verified local artisans, chefs, and ensembles.
4. **Event Timeline & Run of Show**: Minute-by-minute production schedules with dynamic buffer calculations and cue sheets.
5. **Inclusive Event Checker**: Dignified hospitality audits spanning dietary protocols, mobility accessibility, and neurodivergent comfort.
6. **What-if Scenario Simulator**: Stress-testing contingencies (weather shifts, 20% headcount surges, transit delays).

---

## Project Structure

```text
Veloura/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── events.py        # Event CRUD, metrics & filtering
│   │   │   │   └── health.py        # /health system & database check
│   │   │   └── __init__.py          # Router aggregation
│   │   ├── database/
│   │   │   ├── base.py              # SQLAlchemy declarative base
│   │   │   └── session.py           # SQLite connection lifecycle & session maker
│   │   ├── models/
│   │   │   └── event.py             # Event database model
│   │   ├── schemas/
│   │   │   └── event.py             # Pydantic validation schemas
│   │   ├── services/
│   │   │   └── event_service.py     # Database service logic & aggregations
│   │   ├── config.py                # Configuration & CORS settings
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── tests/
│   │   ├── conftest.py              # Pytest in-memory SQLite fixtures
│   │   ├── test_events.py           # Event CRUD and stats test suite
│   │   └── test_health.py           # Health endpoint verification
│   ├── seed.py                      # Development database seeder
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, HealthBadge, DashboardLayout
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Veloura signature landing page
│   │   │   ├── DashboardOverview.tsx# Master event roster & Recharts analytics
│   │   │   ├── CreateEventPage.tsx  # Interactive event intake form
│   │   │   └── modules/             # AI Studio, Budget, VendorMatch, etc.
│   │   ├── services/
│   │   │   └── api.ts               # API client with health fallback
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript domain interfaces
│   │   ├── App.tsx                  # React Router routes definition
│   │   ├── index.css                # Tailwind CSS layers & custom styling
│   │   └── main.tsx                 # React DOM mount point
│   ├── tailwind.config.js           # Custom Warm Editorial palette
│   ├── vite.config.ts               # Vite bundler & API proxy configuration
│   └── package.json                 # Frontend dependencies
├── docs/
│   ├── architecture.md              # Architectural overview & tech stack
│   └── api.md                       # Comprehensive API contract documentation
├── pytest.ini                       # Pytest configuration
└── README.md
```

---

## Quickstart Guide

### Prerequisites
- **Python**: 3.11 or newer (Python 3.13 recommended)
- **Node.js**: v18 or newer (v20+ recommended)
- **npm** or **pnpm**

---

### 1. Backend Setup (FastAPI + SQLite)

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. *(Optional)* Seed initial signature celebrations into SQLite:
   ```bash
   python seed.py
   ```

5. Run backend test suite:
   ```bash
   pytest -v
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API will be accessible at: `http://localhost:8000`
   - Interactive Swagger API docs: `http://localhost:8000/docs`
   - System Health endpoint: `http://localhost:8000/health`

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - The application will launch at: `http://localhost:5173`
   - Requests to `/api/*` and `/health` are automatically proxied to the backend on `http://127.0.0.1:8000`.

4. Build production bundle:
   ```bash
   npm run build
   ```

### Authentication and account setup

Start the backend and frontend using the commands above, then open `http://localhost:5173` and choose **Get Started**. The first registered account chooses its own name, email, and password (minimum 12 characters). The first account also claims existing unowned events; event and planning rows are retained. Sign in later at `/sign-in` with that email and password. The dashboard header includes sign out.

Password reset emails require SMTP configuration in the backend process environment. Set `SMTP_HOST`, `SMTP_PORT` (usually `587`), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `FRONTEND_URL` (the deployed frontend origin). Without SMTP configured, reset requests remain generic and no reset email can be delivered. For production, serve frontend/API same-origin or set frontend `VITE_API_BASE_URL` to the API origin, then configure `COOKIE_SECURE=true` behind HTTPS; use `COOKIE_SAMESITE=lax` when frontend and API are same-site, and `COOKIE_SAMESITE=none` plus Secure HTTPS cookies only when they must be cross-site. Restrict `CORS_ORIGINS` to the exact frontend origins. The built-in login limiter is in-memory and per client IP; a multi-worker deployment should add a shared rate-limit store or enforce an equivalent limit at the reverse proxy. Local development defaults to non-secure cookies for localhost.

The startup schema migration uses `CREATE TABLE IF NOT EXISTS` and an idempotent `ALTER TABLE events ADD COLUMN owner_id`; it does not drop or recreate the SQLite database or rewrite event-plan JSON. Back up the database before production upgrades as routine operational practice.

---

## Design System Reference

- **Ivory (`#FDFBF7`, `#F9F5EE`)**: Subtle warmth of tactile handmade paper.
- **Terracotta (`#C85A32`, `#B04723`)**: Earthy red-orange human craft and warmth.
- **Deep Teal (`#143B36`, `#0F2925`)**: Regal, authoritative contrast and structure.
- **Coral (`#E76F51`)**: Warm rose highlights for creative actions.
- **Marigold (`#E59500`)**: Festive golden accents for milestones and budgets.
