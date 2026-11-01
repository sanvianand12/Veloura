import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "veloura.db"
PROJECT_DIR = BASE_DIR.parent

def find_project_env_file(project_dir: Path) -> Path | None:
    """Neon CLI writes .env when one exists, otherwise .env.local."""
    for name in (".env", ".env.local"):
        candidate = project_dir / name
        if candidate.is_file():
            return candidate
    return None

_project_env_file = find_project_env_file(PROJECT_DIR)
if _project_env_file:
    # Render/Vercel runtime environment always wins over local dotenv values.
    load_dotenv(_project_env_file, override=False)

# Database & App settings
def normalize_database_url(url: str) -> str:
    # Pin SQLAlchemy to the installed psycopg2-binary driver. Render/Neon may
    # provide either PostgreSQL scheme, and older Neon URLs may name psycopg.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql+psycopg://"):
        url = "postgresql+psycopg2://" + url[len("postgresql+psycopg://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url

DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"))
PROJECT_NAME = "Veloura API"
PROJECT_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "t", "yes")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
def parse_cors_origins(value: str) -> list[str]:
    origins = [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
    if "*" in origins:
        raise ValueError("CORS_ORIGINS must list explicit origins when credentialed cookies are enabled")
    return origins

CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS)))

