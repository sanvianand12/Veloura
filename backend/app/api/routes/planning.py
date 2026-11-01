from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.event_service import EventService
from app.services.planning_service import PlanningService
from app.schemas.event_plan import (
    EventPlanResponse,
    ConceptInput,
    BudgetInput,
    VendorShortlistInput,
    TimelineInput,
    SpecialRequirementsInput,
    WhatIfInput,
    InvitationsInput,
)
from app.api.routes.auth import current_user, require_csrf
from app.models.user import User
from app.models.event import Event

router = APIRouter(prefix="/api/events/{event_id}/plan", tags=["Event Planning Journey"])

def _get_event_or_404(event_id: int, db: Session, user: User):
    event = db.query(Event).filter(Event.id == event_id, Event.owner_id == user.id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} was not found"
        )
    return event

@router.get("", response_model=EventPlanResponse)
def get_event_plan(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Retrieve the full planning workspace, progress, and next recommended step."""
    event = _get_event_or_404(event_id, db, user)
    plan = PlanningService.get_or_create_plan(db, event_id)
    return PlanningService.build_plan_response(plan, event)

@router.post("/concept/generate")
def generate_concept(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Generates personalized themes, palettes, decor and menu concepts for the event."""
    event = _get_event_or_404(event_id, db, user)
    return PlanningService.generate_concept_suggestions(event)

@router.put("/concept", response_model=EventPlanResponse)
def update_concept(event_id: int, input_data: ConceptInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update event concept and mark as completed/saved."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="concept",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

@router.put("/budget", response_model=EventPlanResponse)
def update_budget(event_id: int, input_data: BudgetInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update budget allocations and expenses in INR."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="budget",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

@router.get("/vendors", response_model=List[Dict[str, Any]])
def get_vendors(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Get recommended curated vendors with match scores and shortlist flags."""
    event = _get_event_or_404(event_id, db, user)
    plan = PlanningService.get_or_create_plan(db, event_id)
    return PlanningService.get_curated_vendors(event, plan)

@router.post("/vendors/shortlist", response_model=EventPlanResponse)
def toggle_vendor_shortlist(event_id: int, input_data: VendorShortlistInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Shortlist or remove a vendor from the event's plan."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.toggle_vendor_shortlist(
        db=db,
        event_id=event_id,
        vendor_id=input_data.vendor_id,
        shortlisted=input_data.shortlisted
    )

@router.put("/timeline", response_model=EventPlanResponse)
def update_timeline(event_id: int, input_data: TimelineInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update milestones, task checklists, and day-of schedule."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="timeline",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

@router.patch("/tasks/{task_id}", response_model=EventPlanResponse)
def toggle_task(event_id: int, task_id: str, completed: bool, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Quick toggle completion status for a specific task."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.toggle_task(db=db, event_id=event_id, task_id=task_id, completed=completed)

@router.put("/requirements", response_model=EventPlanResponse)
def update_requirements(event_id: int, input_data: SpecialRequirementsInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update dietary, accessibility, and safety requirements."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="requirements",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

@router.put("/what-if", response_model=EventPlanResponse)
def update_what_if(event_id: int, input_data: WhatIfInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update contingency scenarios and non-negotiables."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="what_if",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

@router.put("/invitations", response_model=EventPlanResponse)
def update_invitations(event_id: int, input_data: InvitationsInput, db: Session = Depends(get_db), user: User = Depends(current_user), _: None = Depends(require_csrf)):
    """Update invitations, WhatsApp messages, and social captions."""
    _get_event_or_404(event_id, db, user)
    return PlanningService.update_stage(
        db=db,
        event_id=event_id,
        stage_name="invitations",
        data=input_data.model_dump(),
        mark_completed=input_data.mark_completed if input_data.mark_completed is not None else True
    )

