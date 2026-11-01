import pytest
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable
from app.config import normalize_database_url, parse_cors_origins
from app.api.routes.auth import parse_cookie_settings
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.user import User, UserSession, PasswordReset

def test_database_url_supports_render_postgres_and_preserves_sqlite():
    assert normalize_database_url("postgres://user:pass@host/db").startswith("postgresql://")
    assert normalize_database_url("postgresql://user:pass@host/db").startswith("postgresql://")
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
