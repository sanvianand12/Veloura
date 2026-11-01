# Veloura Architecture & Technical Foundation

Veloura is an AI-powered intelligent event planning platform crafted with a warm, editorial, and tactile luxury aesthetic.

## 1. Directory Structure

```text
Veloura/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── events.py      # Event CRUD and statistics endpoints
│   │   │   │   └── health.py      # /health verification endpoint
│   │   │   └── __init__.py        # Router aggregation
│   │   ├── database/
│   │   │   ├── base.py            # SQLAlchemy declarative base
│   │   │   └── session.py         # Engine and SQLite session lifecycle
│   │   ├── models/
│   │   │   └── event.py           # Event database entity
│   │   ├── schemas/
│   │   │   └── event.py           # Pydantic validation models
│   │   ├── services/
│   │   │   └── event_service.py   # Business logic & repository operations
│   │   ├── config.py              # Application settings & CORS
│   │   └── main.py                # FastAPI initialization & lifespans
│   ├── tests/
│   │   ├── conftest.py            # Isolated in-memory SQLite fixtures
│   │   ├── test_events.py         # CRUD and validation test suite
│   │   └── test_health.py         # Healthcheck test suite
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/            # Layout, Navigation, Header, Badges
│   │   ├── pages/                 # Landing, Dashboard, Event Studio, etc.
│   │   ├── services/              # API client and health verification
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── App.tsx                # Routes & core layout
│   │   └── main.tsx               # React DOM entry point
│   ├── tailwind.config.js         # Custom Warm Editorial color palette
│   └── package.json               # Frontend dependencies
└── docs/
    ├── architecture.md            # System layout & architectural principles
    └── api.md                     # Endpoint specifications & data contracts
```

## 2. Design System: Warm Editorial Luxury

Veloura intentionally departs from generic corporate SaaS palettes (cold blues, purple AI glows):
- **Ivory & Cream (`#FDFBF7`, `#F9F5EE`)**: Subtle, natural background warmth reminiscent of textured handmade paper.
- **Deep Teal (`#1B3B36`, `#0F2824`)**: Grounded, authoritative, high-contrast typography and accents.
- **Terracotta & Coral (`#C85A32`, `#E76F51`)**: Warm earthy red-orange accents denoting human touch and vibrancy.
- **Marigold (`#E9A825`, `#D49012`)**: Celebratory golden highlights for milestone status, budgets, and priority badges.

## 3. Technology Stack

- **Backend**: Python 3.13+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite, Pytest.
- **Frontend**: React 18 / 19, TypeScript, Vite, Tailwind CSS, React Router v6, Recharts, Lucide Icons.
- **Persistence**: SQLite with standard ACID compliance for local-first velocity and seamless deployment.

