from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class Event(Base):
    """Event table representation for Veloura."""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    event_type = Column(String(100), nullable=False)  # Gala, Wedding, Conference, Soirée, Product Launch, etc.
    date = Column(String(50), nullable=False)          # YYYY-MM-DD format
    time = Column(String(50), nullable=True)          # HH:MM or free text
    location = Column(String(255), nullable=False)
    guest_count = Column(Integer, nullable=False, default=50)
    budget = Column(Float, nullable=False, default=10000.0)
    theme = Column(String(150), nullable=True)         # Visual aesthetic / style concept
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Planning")  # Planning, Confirmed, Completed, Cancelled
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
