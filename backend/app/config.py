import os
from pathlib import Path

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "veloura.db"

# Database & App settings
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
PROJECT_NAME = "Veloura API"
PROJECT_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS)).split(",") if origin.strip()]

