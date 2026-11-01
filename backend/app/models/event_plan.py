from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class EventPlan(Base):
    """Stores the event planning journey across all 7 stages."""
    __tablename__ = "event_plans"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # JSON strings storing stage-specific parameters
    concept_json = Column(Text, nullable=False, default="{}")
    budget_json = Column(Text, nullable=False, default="{}")
    vendors_json = Column(Text, nullable=False, default="{}")
    timeline_json = Column(Text, nullable=False, default="{}")
    requirements_json = Column(Text, nullable=False, default="{}")
    what_if_json = Column(Text, nullable=False, default="{}")
    invitations_json = Column(Text, nullable=False, default="{}")

    # List of completed stage identifiers: ["concept", "budget", "vendors", "timeline", "requirements", "what_if", "invitations"]
    completed_stages_json = Column(Text, nullable=False, default="[]")

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationship to parent Event.
    # passive_deletes=True: SQLAlchemy defers to DB-level ON DELETE CASCADE on event_id FK.
    # The backref on Event is configured with cascade="all, delete-orphan" so ORM-level
    # deletions of Event also clean up EventPlan correctly.
    event = relationship(
        "Event",
        backref=__import__('sqlalchemy.orm', fromlist=['backref']).backref("plan", cascade="all, delete-orphan", uselist=False),
        passive_deletes=True,
    )

    def get_stage_data(self, stage_name: str) -> dict:
        attr_map = {
            "concept": self.concept_json,
            "budget": self.budget_json,
            "vendors": self.vendors_json,
            "timeline": self.timeline_json,
            "requirements": self.requirements_json,
            "what_if": self.what_if_json,
            "invitations": self.invitations_json,
        }
        val = attr_map.get(stage_name, "{}")
        try:
            return json.loads(val) if val else {}
        except Exception:
            return {}

    def set_stage_data(self, stage_name: str, data: dict):
        json_val = json.dumps(data)
        if stage_name == "concept":
            self.concept_json = json_val
        elif stage_name == "budget":
            self.budget_json = json_val
        elif stage_name == "vendors":
            self.vendors_json = json_val
        elif stage_name == "timeline":
            self.timeline_json = json_val
        elif stage_name == "requirements":
            self.requirements_json = json_val
        elif stage_name == "what_if":
            self.what_if_json = json_val
        elif stage_name == "invitations":
            self.invitations_json = json_val

    @property
    def completed_stages(self) -> list:
        try:
            return json.loads(self.completed_stages_json) if self.completed_stages_json else []
        except Exception:
            return []

    @completed_stages.setter
    def completed_stages(self, stages: list):
        self.completed_stages_json = json.dumps(list(set(stages)))

