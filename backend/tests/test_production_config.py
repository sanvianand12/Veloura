import pytest
from pathlib import Path
from unittest.mock import patch
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import make_url
from sqlalchemy.schema import CreateTable
from app.config import normalize_database_url, parse_cors_origins, find_project_env_file
from app.api.routes.auth import parse_cookie_settings
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.user import User, UserSession, PasswordReset

def test_database_url_supports_render_postgres_and_preserves_sqlite():
    assert make_url(normalize_database_url("postgres://user:pass@host/db")).drivername == "postgresql+psycopg2"
    assert make_url(normalize_database_url("postgresql://user:pass@host/db")).drivername == "postgresql+psycopg2"
    assert make_url(normalize_database_url("postgresql+psycopg://user:pass@host/db")).drivername == "postgresql+psycopg2"
    assert normalize_database_url("sqlite:///local.db") == "sqlite:///local.db"

def test_postgresql_schema_compiles_for_all_persisted_models():
    for model in (User, UserSession, PasswordReset, Event, EventPlan):
        ddl = str(CreateTable(model.__table__).compile(dialect=postgresql.dialect()))
        assert "CREATE TABLE" in ddl
    assert "TIMESTAMP WITH TIME ZONE" in str(CreateTable(UserSession.__table__).compile(dialect=postgresql.dialect()))
    assert "REFERENCES events" in str(CreateTable(EventPlan.__table__).compile(dialect=postgresql.dialect()))

def test_production_cross_site_cookies_require_secure_transport():
    assert parse_cookie_settings("true", "none") == (True, "none")
    with pytest.raises(ValueError, match="COOKIE_SECURE=true"):
        parse_cookie_settings("false", "none")

def test_credentialed_cors_uses_explicit_origins_only():
    assert parse_cors_origins("https://veloura.example/, https://preview.example") == [
        "https://veloura.example", "https://preview.example",
    ]
    with pytest.raises(ValueError, match="explicit origins"):
        parse_cors_origins("*")

def test_local_env_file_selection_matches_neon_cli_output():
    project_dir = Path("C:/veloura-test")
    with patch.object(Path, "is_file", autospec=True, side_effect=lambda path: path.name == ".env.local"):
        assert find_project_env_file(project_dir) == project_dir / ".env.local"
    with patch.object(Path, "is_file", autospec=True, side_effect=lambda path: path.name == ".env"):
        assert find_project_env_file(project_dir) == project_dir / ".env"
