from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventStats
from app.services.event_service import EventService
from app.api.routes.auth import current_user, require_csrf
from app.models.user import User
from app.models.event import Event

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=List[EventResponse])
def get_all_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Retrieve all planned events."""
    query = db.query(Event)
    if isinstance(user, User): query = query.filter(Event.owner_id == user.id)
    return query.order_by(Event.id.desc()).offset(skip).limit(limit).all()

@router.get("/stats", response_model=EventStats)
def get_event_metrics(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Retrieve aggregate statistics for dashboard metrics."""
    query = db.query(Event)
    if isinstance(user, User): query = query.filter(Event.owner_id == user.id)
    events = query.all()
    from app.schemas.event import EventStats
    return EventStats(total_events=len(events), total_budget=sum(e.budget for e in events), total_guests=sum(e.guest_count for e in events), upcoming_events=sum((e.status or '').lower() in ('planning','confirmed') for e in events))

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_new_event(event_in: EventCreate, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Create a new event record."""
    return EventService.create_event(db, event_in, owner_id=user.id if isinstance(user, User) else None)

@router.get("/{event_id}", response_model=EventResponse)
def get_single_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Retrieve event details by ID."""
    query = db.query(Event).filter(Event.id == event_id)
    if isinstance(user, User): query = query.filter(Event.owner_id == user.id)
    event = query.first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} was not found"
        )
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_existing_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update an existing event."""
    query = db.query(Event).filter(Event.id == event_id)
    if isinstance(user, User): query = query.filter(Event.owner_id == user.id)
    event = query.first()
    if event:
        for field, value in event_in.model_dump(exclude_unset=True).items(): setattr(event, field, value)
        db.commit(); db.refresh(event)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} was not found"
        )
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Delete an event by ID."""
    query = db.query(Event).filter(Event.id == event_id)
    if isinstance(user, User): query = query.filter(Event.owner_id == user.id)
    event = query.first()
    success = event is not None
    if event: db.delete(event); db.commit()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} was not found"
        )
    return None

