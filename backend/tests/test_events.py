import pytest
from fastapi import HTTPException
from app.api.routes.events import (
    create_new_event,
    get_all_events,
    get_single_event,
    update_existing_event,
    delete_existing_event,
    get_event_metrics,
)
from app.schemas.event import EventCreate, EventUpdate

def test_create_and_get_event(db):
    """Test creating an event via schema and fetching by ID."""
    event_in = EventCreate(
        title="Autumn Botanical Gala",
        event_type="Gala",
        date="2026-11-20",
        time="19:00",
        location="The Glass Greenhouse, Chicago",
        guest_count=150,
        budget=35000.0,
        theme="Candlelight & Dried Botanicals",
        description="An intimate evening celebrating sustainable botanical design.",
        status="Planning"
    )

    created = create_new_event(event_in=event_in, db=db)
    assert created.id is not None
    assert created.title == "Autumn Botanical Gala"
    assert created.guest_count == 150
    assert created.budget == 35000.0

    # Retrieve single event
    fetched = get_single_event(event_id=created.id, db=db)
    assert fetched.id == created.id
    assert fetched.title == created.title

def test_list_events_and_stats(db):
    """Test event listing and aggregated statistics calculation."""
    # List is initially empty
    empty_events = get_all_events(skip=0, limit=100, db=db)
    assert len(empty_events) == 0

    # Create two events
    create_new_event(
        event_in=EventCreate(
            title="Architectural Design Summit",
            event_type="Conference",
            date="2026-12-05",
            location="Civic Center Hall",
            guest_count=200,
            budget=40000.0,
            status="Planning"
        ),
        db=db
    )

    create_new_event(
        event_in=EventCreate(
            title="Private Rooftop Wine Tasting",
            event_type="Soirée",
            date="2026-12-10",
            location="Skyline Lounge",
            guest_count=40,
            budget=12000.0,
            status="Confirmed"
        ),
        db=db
    )

    events = get_all_events(skip=0, limit=100, db=db)
    assert len(events) == 2

    # Check stats
    stats = get_event_metrics(db=db)
    assert stats.total_events == 2
    assert stats.total_budget == 52000.0
    assert stats.total_guests == 240
    assert stats.upcoming_events == 2

def test_event_not_found(db):
    """Test HTTPException 404 when querying an invalid event ID."""
    with pytest.raises(HTTPException) as excinfo:
        get_single_event(event_id=99999, db=db)
    assert excinfo.value.status_code == 404

def test_update_and_delete_event(db):
    """Test updating fields and then removing an event."""
    created = create_new_event(
        event_in=EventCreate(
            title="Pop-up Dinner",
            event_type="Dining",
            date="2026-11-30",
            location="Old Town Loft",
            guest_count=30,
            budget=5000.0,
            status="Planning"
        ),
        db=db
    )

    # Update title and status
    updated = update_existing_event(
        event_id=created.id,
        event_in=EventUpdate(title="Grand Pop-up Feast", status="Confirmed"),
        db=db
    )
    assert updated.title == "Grand Pop-up Feast"
    assert updated.status == "Confirmed"

    # Delete event
    res = delete_existing_event(event_id=created.id, db=db)
    assert res is None

    # Verify 404 after deletion
    with pytest.raises(HTTPException) as excinfo:
        get_single_event(event_id=created.id, db=db)
    assert excinfo.value.status_code == 404
