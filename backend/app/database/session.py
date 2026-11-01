from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL
from app.database.base import Base

# SQLite requires check_same_thread=False for multi-threaded FastAPI handlers
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes the database schema by creating all registered tables."""
    # Ensure all models are imported prior to create_all
    import app.models.event  # noqa: F401
    import app.models.event_plan  # noqa: F401
    import app.models.user  # noqa: F401
    Base.metadata.create_all(bind=engine)
    # Additive migration shared by SQLite and PostgreSQL. It never rebuilds
    # tables or changes event_plan rows.
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "events" in tables and "owner_id" not in {c["name"] for c in inspector.get_columns("events")}:
        add_owner_column = (
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)"
            if engine.dialect.name == "postgresql"
            else "ALTER TABLE events ADD COLUMN owner_id INTEGER REFERENCES users(id)"
        )
        with engine.begin() as connection:
            connection.execute(text(add_owner_column))
    if "events" in tables:
        with engine.begin() as connection:
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_events_owner_id ON events (owner_id)"))

def get_db():
    """Dependency generator that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

