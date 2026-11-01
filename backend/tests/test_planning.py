import pytest
from app.api.routes.events import create_new_event
from app.schemas.event import EventCreate
from app.services.planning_service import PlanningService
from app.schemas.event_plan import ConceptInput, BudgetInput, BudgetCategory, TimelineInput, TaskItem

def test_get_or_create_plan_defaults(db):
    """Test plan initializes with sensible structure and 0 completed stages."""
    event = create_new_event(
        event_in=EventCreate(
            title="Royal Jaipur Nuptials",
            event_type="Luxury Wedding",
            date="2026-12-20",
            location="Jaipur, Rajasthan",
            guest_count=200,
            budget=1500000.0,
            theme="Royal Rajasthani Heritage & Marigold"
        ),
        db=db
    )

    plan = PlanningService.get_or_create_plan(db, event.id)
    assert plan.event_id == event.id
    assert len(plan.completed_stages) == 0

    # Build plan response
    resp = PlanningService.build_plan_response(plan, event)
    assert resp.event_id == event.id
    assert resp.next_step.stage == "concept"
    assert "concept" in resp.next_step.button_label.lower() or "design" in resp.next_step.button_label.lower()

def test_progress_calculation_and_stage_completion(db):
    """Test dynamic progress calculation as real stages are saved and completed."""
    event = create_new_event(
        event_in=EventCreate(
            title="Tech Innovation Gala",
            event_type="Gala",
            date="2026-11-15",
            location="Bengaluru, Karnataka",
            guest_count=150,
            budget=800000.0
        ),
        db=db
    )

    plan = PlanningService.get_or_create_plan(db, event.id)
    resp_initial = PlanningService.build_plan_response(plan, event)
    initial_pct = resp_initial.progress_percentage

    # 1. Complete Stage 1 (Concept)
    resp_concept = PlanningService.update_stage(
        db=db,
        event_id=event.id,
        stage_name="concept",
        data={
            "theme": "Bioluminescent Glass & Deep Teal",
            "tagline": "An inspiring future-forward celebration.",
            "decor_ideas": ["Prismatic crystal centerpieces", "Laser architectural mapping"],
            "palette": [{"name": "Deep Teal", "hex": "#143B36"}, {"name": "Marigold", "hex": "#E59500"}]
        },
        mark_completed=True
    )
    assert resp_concept.progress_percentage > initial_pct
    assert "concept" in resp_concept.completed_stages
    assert resp_concept.next_step.stage == "budget"

    # 2. Complete Stage 2 (Budget)
    resp_budget = PlanningService.update_stage(
        db=db,
        event_id=event.id,
        stage_name="budget",
        data={
            "total_budget": 800000.0,
            "currency": "INR",
            "categories": [
                {"id": "venue", "name": "Venue", "allocated": 300000.0, "spent": 100000.0},
                {"id": "catering", "name": "Catering", "allocated": 350000.0, "spent": 0.0}
            ],
            "expenses": []
        },
        mark_completed=True
    )
    assert resp_budget.progress_percentage > resp_concept.progress_percentage
    assert "budget" in resp_budget.completed_stages
    assert resp_budget.next_step.stage == "vendors"

def test_next_step_recommendation_progression(db):
    """Test next step points accurately to the earliest uncompleted stage."""
    event = create_new_event(
        event_in=EventCreate(
            title="Intimate Artisan Dinner",
            event_type="Curated Dinner",
            date="2026-11-30",
            location="Goa, India",
            guest_count=40,
            budget=200000.0
        ),
        db=db
    )

    plan = PlanningService.get_or_create_plan(db, event.id)

    # Initial step is concept
    resp1 = PlanningService.build_plan_response(plan, event)
    assert resp1.next_step.stage == "concept"

    # Mark concept done -> next step is budget
    plan.completed_stages = ["concept"]
    db.commit()
    resp2 = PlanningService.build_plan_response(plan, event)
    assert resp2.next_step.stage == "budget"

    # Mark budget done -> next step is vendors
    plan.completed_stages = ["concept", "budget"]
    db.commit()
    resp3 = PlanningService.build_plan_response(plan, event)
    assert resp3.next_step.stage == "vendors"

    # Mark vendors done -> next step is timeline
    plan.completed_stages = ["concept", "budget", "vendors"]
    db.commit()
    resp4 = PlanningService.build_plan_response(plan, event)
    assert resp4.next_step.stage == "timeline"

    # Mark all done -> ready!
    plan.completed_stages = ["concept", "budget", "vendors", "timeline", "requirements", "what_if", "invitations"]
    db.commit()
    resp_final = PlanningService.build_plan_response(plan, event)
    assert resp_final.progress_percentage == 100
    assert resp_final.next_step.stage == "ready"

def test_independent_multi_event_progress(db):
    """Test multiple events maintain completely isolated progress & planning states."""
    event_a = create_new_event(
        event_in=EventCreate(
            title="Event Alpha",
            event_type="Gala",
            date="2026-12-01",
            location="Delhi",
            guest_count=100,
            budget=500000.0
        ),
        db=db
    )

    event_b = create_new_event(
        event_in=EventCreate(
            title="Event Beta",
            event_type="Wedding",
            date="2026-12-10",
            location="Mumbai",
            guest_count=250,
            budget=2500000.0
        ),
        db=db
    )

    # Update Event A only
    PlanningService.update_stage(
        db=db,
        event_id=event_a.id,
        stage_name="concept",
        data={"theme": "Alpha Theme", "decor_ideas": ["A", "B"]},
        mark_completed=True
    )
    PlanningService.update_stage(
        db=db,
        event_id=event_a.id,
        stage_name="budget",
        data={"total_budget": 500000.0, "currency": "INR", "categories": [{"id": "v", "name": "V", "allocated": 100.0}]},
        mark_completed=True
    )

    # Verify Event A has 2 completed stages
    plan_a = PlanningService.get_or_create_plan(db, event_a.id)
    resp_a = PlanningService.build_plan_response(plan_a, event_a)
    assert "concept" in resp_a.completed_stages
    assert "budget" in resp_a.completed_stages
    assert resp_a.next_step.stage == "vendors"

    # Verify Event B remains untouched at initial stage
    plan_b = PlanningService.get_or_create_plan(db, event_b.id)
    resp_b = PlanningService.build_plan_response(plan_b, event_b)
    assert len(plan_b.completed_stages) == 0
    assert resp_b.next_step.stage == "concept"

def test_skipping_stages_without_blocking(db):
    """Test user can skip ahead to Stage 5 without Stage 2 or 3 and it functions cleanly."""
    event = create_new_event(
        event_in=EventCreate(
            title="Flexible Celebration",
            event_type="Milestone Celebration",
            date="2027-01-10",
            location="Udaipur",
            guest_count=80,
            budget=400000.0
        ),
        db=db
    )

    # User immediately updates Stage 5 (Special Requirements)
    resp = PlanningService.update_stage(
        db=db,
        event_id=event.id,
        stage_name="requirements",
        data={
            "dietary_requirements": ["100% Jain vegetarian", "Gluten-free counter"],
            "accessibility_requirements": ["Ramp required for stage"],
            "personal_notes": "Celebrant turns 75"
        },
        mark_completed=True
    )
    assert "requirements" in resp.completed_stages
    # Earliest uncompleted step is still concept
    assert resp.next_step.stage == "concept"



def test_all_stages_complete_next_step_is_master_plan(db):
    """When all 7 stages are complete, next_step.target_stage must be 'master_plan', not 'timeline'."""
    event = create_new_event(
        event_in=EventCreate(
            title="Master Plan Target Test",
            event_type="Gala",
            date="2026-12-31",
            location="Mumbai",
            guest_count=120,
            budget=600000.0,
        ),
        db=db
    )
    plan = PlanningService.get_or_create_plan(db, event.id)
    # Mark all 7 stages complete
    plan.completed_stages = ["concept", "budget", "vendors", "timeline", "requirements", "what_if", "invitations"]
    db.commit()

    resp = PlanningService.build_plan_response(plan, event)
    assert resp.progress_percentage == 100
    assert resp.next_step.stage == "ready"
    assert resp.next_step.target_stage == "master_plan", (
        f"Expected target_stage='master_plan' but got '{resp.next_step.target_stage}'"
    )
    assert resp.next_step.button_label == "Review Master Plan"


def test_concept_generate_returns_dict_with_required_keys(db):
    """Deterministic concept generator returns a dict with all required fields."""
    event = create_new_event(
        event_in=EventCreate(
            title="Birthday Bash",
            event_type="Birthday Celebration",
            date="2027-03-15",
            location="Pune",
            guest_count=80,
            budget=250000.0,
        ),
        db=db
    )
    result = PlanningService.generate_concept_suggestions(event)
    for key in ["theme", "tagline", "palette", "decor_ideas", "menu_suggestions", "entertainment_concepts"]:
        assert key in result, f"Missing key '{key}' in generate_concept_suggestions output"
    assert isinstance(result["palette"], list)
    assert len(result["palette"]) > 0
    assert all("hex" in c and "name" in c for c in result["palette"])


def test_budget_pre_seed_uses_event_budget_as_inr(db):
    """Pre-seeded budget categories should sum to 100% of the event budget."""
    budget_amount = 800000.0
    event = create_new_event(
        event_in=EventCreate(
            title="INR Budget Test",
            event_type="Wedding",
            date="2027-01-20",
            location="Delhi",
            guest_count=150,
            budget=budget_amount,
        ),
        db=db
    )
    plan = PlanningService.get_or_create_plan(db, event.id)
    budget_data = plan.get_stage_data("budget")

    assert budget_data.get("currency") == "INR"
    assert budget_data.get("total_budget") == budget_amount

    categories = budget_data.get("categories", [])
    assert len(categories) > 0
    total_allocated = sum(c["allocated"] for c in categories)
    # Allow for small floating-point rounding
    assert abs(total_allocated - budget_amount) < 1.0, (
        f"Total allocated {total_allocated} != event budget {budget_amount}"
    )
