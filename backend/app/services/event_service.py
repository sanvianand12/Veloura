from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventStats

class EventService:
    @staticmethod
    def get_events(db: Session, skip: int = 0, limit: int = 100) -> List[Event]:
        """Fetch all events sorted by most recent first."""
        return db.query(Event).order_by(Event.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[Event]:
        """Fetch an event by its primary key ID."""
        return db.query(Event).filter(Event.id == event_id).first()

    @staticmethod
    def create_event(db: Session, event_in: EventCreate, owner_id: Optional[int] = None) -> Event:
        """Create and persist a new event."""
        event = Event(
            title=event_in.title,
            event_type=event_in.event_type,
            date=event_in.date,
            time=event_in.time,
            location=event_in.location,
            guest_count=event_in.guest_count,
            budget=event_in.budget,
            theme=event_in.theme,
            description=event_in.description,
            status=event_in.status or "Planning",
            owner_id=owner_id,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def update_event(db: Session, event_id: int, event_in: EventUpdate) -> Optional[Event]:
        """Update existing event details."""
        event = EventService.get_event(db, event_id)
        if not event:
            return None
        
        update_data = event_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(event, field, value)
        
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def delete_event(db: Session, event_id: int) -> bool:
        """Delete an event by its ID."""
        event = EventService.get_event(db, event_id)
        if not event:
            return False
        db.delete(event)
        db.commit()
        return True

    @staticmethod
    def get_stats(db: Session, owner_id: Optional[int] = None) -> EventStats:
        """Aggregate dashboard metrics in the database, optionally by owner."""
        query = db.query(
            func.count(Event.id),
            func.coalesce(func.sum(Event.budget), 0.0),
            func.coalesce(func.sum(Event.guest_count), 0),
            func.coalesce(func.sum(case(
                (func.lower(Event.status).in_(("planning", "confirmed")), 1),
                else_=0,
            )), 0),
        )
        if owner_id is not None:
            query = query.filter(Event.owner_id == owner_id)
        total_events, total_budget, total_guests, upcoming = query.one()
        return EventStats(
            total_events=int(total_events),
            total_budget=float(total_budget),
            total_guests=int(total_guests),
            upcoming_events=int(upcoming),
        )

