import os
from pathlib import Path

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "veloura.db"

# Database & App settings
def normalize_database_url(url: str) -> str:
    # Render and other providers may still supply the legacy postgres:// scheme.
    return "postgresql://" + url[len("postgres://"):] if url.startswith("postgres://") else url

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

