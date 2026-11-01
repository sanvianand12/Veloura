from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class NextStepRecommendation(BaseModel):
    stage: str
    action_title: str
    explanation: str
    button_label: str
    target_stage: str
    next_upcoming: str

class StageStatus(BaseModel):
    stage_id: str
    title: str
    completed: bool
    status: str  # "completed", "in_progress", "not_started"
    summary: str

class ConceptInput(BaseModel):
    theme: str = Field(..., min_length=2)
    tagline: Optional[str] = None
    palette: List[Dict[str, str]] = Field(default_factory=list)
    decor_ideas: List[str] = Field(default_factory=list)
    menu_suggestions: List[str] = Field(default_factory=list)
    entertainment_concepts: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    mark_completed: Optional[bool] = True

class BudgetCategory(BaseModel):
    id: str
    name: str
    allocated: float = 0.0
    spent: float = 0.0
    notes: Optional[str] = None

class BudgetExpense(BaseModel):
    id: str
    category_id: str
    title: str
    amount: float
    date: Optional[str] = None
    vendor: Optional[str] = None

class BudgetInput(BaseModel):
    total_budget: float = Field(..., ge=0)
    currency: str = "INR"
    categories: List[BudgetCategory] = Field(default_factory=list)
    expenses: List[BudgetExpense] = Field(default_factory=list)
    mark_completed: Optional[bool] = True

class VendorShortlistInput(BaseModel):
    vendor_id: str
    shortlisted: bool

class TaskItem(BaseModel):
    id: str
    title: str
    category: str = "General"
    due_date: Optional[str] = None
    completed: bool = False
    priority: str = "Medium"  # High, Medium, Low

class TimelineScheduleItem(BaseModel):
    id: str
    time: str
    title: str
    description: Optional[str] = None
    lead: Optional[str] = None

class TimelineInput(BaseModel):
    tasks: List[TaskItem] = Field(default_factory=list)
    day_of_schedule: List[TimelineScheduleItem] = Field(default_factory=list)
    mark_completed: Optional[bool] = True

class SpecialRequirementsInput(BaseModel):
    dietary_requirements: List[str] = Field(default_factory=list)
    accessibility_requirements: List[str] = Field(default_factory=list)
    personal_notes: Optional[str] = None
    verified_checklist: Dict[str, bool] = Field(default_factory=dict)
    mark_completed: Optional[bool] = True

class WhatIfScenario(BaseModel):
    id: str
    title: str
    description: str
    cost_impact: float = 0.0
    headcount_impact: int = 0
    action_plan: str

class WhatIfInput(BaseModel):
    scenarios: List[WhatIfScenario] = Field(default_factory=list)
    non_negotiables: List[str] = Field(default_factory=list)
    contingency_fund: float = 0.0
    notes: Optional[str] = None
    mark_completed: Optional[bool] = True

class InvitationsInput(BaseModel):
    invitation_message: str
    whatsapp_caption: Optional[str] = None
    instagram_announcement: Optional[str] = None
    rsvp_deadline: Optional[str] = None
    dress_code: Optional[str] = None
    mark_completed: Optional[bool] = True

class EventPlanResponse(BaseModel):
    event_id: int
    progress_percentage: int
    completed_stages: List[str]
    stages_checklist: List[StageStatus]
    next_step: NextStepRecommendation
    concept: Dict[str, Any]
    budget: Dict[str, Any]
    vendors: Dict[str, Any]
    timeline: Dict[str, Any]
    requirements: Dict[str, Any]
    what_if: Dict[str, Any]
    invitations: Dict[str, Any]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

