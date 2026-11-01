from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="The event's primary title")
    event_type: str = Field(..., min_length=2, max_length=100, description="Category of the event")
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    time: Optional[str] = Field(None, description="Time formatted as HH:MM or free text")
    location: str = Field(..., min_length=2, max_length=255, description="Physical venue or city")
    guest_count: int = Field(..., ge=1, le=50000, description="Estimated guest count")
    budget: float = Field(..., ge=0, description="Budget in INR (Indian Rupees)")
    theme: Optional[str] = Field(None, description="Aesthetic theme or concept")
    description: Optional[str] = Field(None, description="Detailed brief or notes")
    status: Optional[str] = Field("Planning", description="Event lifecycle status")

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    guest_count: Optional[int] = None
    budget: Optional[float] = None
    theme: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EventStats(BaseModel):
    total_events: int
    total_budget: float
    total_guests: int
    upcoming_events: int
