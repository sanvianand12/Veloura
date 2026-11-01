import os
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.schemas.event_plan import (
    NextStepRecommendation,
    StageStatus,
    EventPlanResponse,
    ConceptInput,
    BudgetInput,
    TimelineInput,
    SpecialRequirementsInput,
    WhatIfInput,
    InvitationsInput,
)

PLANNING_STAGES = [
    ("concept", "Event Concept", "Aesthetic direction, theme, colors, decor & menu"),
    ("budget", "Budget Planning", "Category allocations, expense tracking & buffer in INR"),
    ("vendors", "Vendor Discovery", "Vetted artisan matching & shortlisted partners"),
    ("timeline", "Timeline & Tasks", "Milestone checklists, preparation deadlines & run-of-show"),
    ("requirements", "Special Requirements", "Dietary restrictions, accessibility & sensory comfort"),
    ("what_if", "What-if Planning", "Contingency simulations & non-negotiable safeguards"),
    ("invitations", "Invitations & Finalisation", "Formal invitations, WhatsApp broadcasts & readiness"),
]

class PlanningService:
    @staticmethod
    def get_or_create_plan(db: Session, event_id: int) -> EventPlan:
        """Fetch an existing plan or initialize a fresh one tailored to the event."""
        plan = db.query(EventPlan).filter(EventPlan.event_id == event_id).first()
        if plan:
            return plan

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event with id {event_id} does not exist.")

        # Create intelligent initial state for the event
        plan = EventPlan(event_id=event_id)

        # Pre-seed default concept draft if event has a theme
        initial_concept = {
            "theme": event.theme or f"Signature {event.event_type} Celebration",
            "tagline": f"An intentionally curated {event.event_type.lower()} in {event.location}.",
            "palette": PlanningService._get_default_palette(event.event_type),
            "decor_ideas": [
                "Warm candlelight and low sculptural floral arrangements",
                "Textured ivory table runners with raw terracotta ceramic accents",
                "Warm ambient uplighting highlighting spatial architecture",
            ],
            "menu_suggestions": [
                "Locally sourced seasonal welcome amuse-bouche",
                "Multi-course artisanal seated dinner or grazing station",
                "Signature destination cocktail infused with garden botanicals",
            ],
            "entertainment_concepts": [
                "Acoustic cello or jazz duo during welcome cocktail reception",
                "Curated ambient vinyl playlist for dinner transition",
            ],
            "notes": event.description or "",
            "is_custom": False,
        }
        plan.set_stage_data("concept", initial_concept)

        # Pre-seed budget structure based on event's budget in INR
        total_b = float(event.budget) if event.budget else 250000.0
        initial_budget = {
            "total_budget": total_b,
            "currency": "INR",
            "categories": [
                {"id": "venue", "name": "Venue & Architecture", "allocated": round(total_b * 0.30, 2), "spent": 0.0, "notes": "Main hall and lawn grounds"},
                {"id": "catering", "name": "Catering, Food & Beverage", "allocated": round(total_b * 0.35, 2), "spent": 0.0, "notes": "Banquet menu and bar service"},
                {"id": "decor", "name": "Scenography & Floral Decor", "allocated": round(total_b * 0.15, 2), "spent": 0.0, "notes": "Centerpieces, entrance arch & lighting"},
                {"id": "photography", "name": "Photography & Cinematography", "allocated": round(total_b * 0.10, 2), "spent": 0.0, "notes": "Full day coverage"},
                {"id": "entertainment", "name": "Sound, Music & AV", "allocated": round(total_b * 0.05, 2), "spent": 0.0, "notes": "Acoustics, mics, ambient sound"},
                {"id": "contingency", "name": "Emergency Cushion Reserve", "allocated": round(total_b * 0.05, 2), "spent": 0.0, "notes": "Weather & sudden overtime buffer"},
            ],
            "expenses": [],
        }
        plan.set_stage_data("budget", initial_budget)

        # Pre-seed initial tasks & timeline
        initial_timeline = {
            "tasks": [
                {"id": str(uuid.uuid4())[:8], "title": "Finalise celebration theme and color concept", "category": "Concept", "due_date": event.date, "completed": False, "priority": "High"},
                {"id": str(uuid.uuid4())[:8], "title": "Lock in venue contract & payment schedule", "category": "Venue", "due_date": event.date, "completed": False, "priority": "High"},
                {"id": str(uuid.uuid4())[:8], "title": "Review catering tasting menu and dietary restrictions", "category": "Catering", "due_date": event.date, "completed": False, "priority": "Medium"},
                {"id": str(uuid.uuid4())[:8], "title": "Send out invitations & track RSVP responses", "category": "Invitations", "due_date": event.date, "completed": False, "priority": "High"},
                {"id": str(uuid.uuid4())[:8], "title": "Conduct day-of run-of-show audio rehearsal", "category": "Production", "due_date": event.date, "completed": False, "priority": "Medium"},
            ],
            "day_of_schedule": [
                {"id": "sched_1", "time": "16:00", "title": "Vendor Load-in & Floral Staging", "description": "Sound check, lighting balance & table placement", "lead": "Production Lead"},
                {"id": "sched_2", "time": "18:00", "title": "Guest Arrival & Welcome Refreshments", "description": "Acoustic background music and signature drinks", "lead": "Hospitality Team"},
                {"id": "sched_3", "time": "19:30", "title": "Main Event Ceremony / Toasts", "description": "Welcome remarks and keynote celebration moments", "lead": "Master of Ceremonies"},
                {"id": "sched_4", "time": "20:30", "title": "Dinner Service & Culinary Experience", "description": "Multi-course feast and beverage pairings", "lead": "Catering Captain"},
            ]
        }
        plan.set_stage_data("timeline", initial_timeline)

        # Pre-seed initial requirements
        plan.set_stage_data("requirements", {
            "dietary_requirements": ["Vegetarian options available", "Nut-allergy protocol"],
            "accessibility_requirements": ["Step-free venue entrance", "Accessible priority seating"],
            "personal_notes": "Ensure quiet area for elder family members.",
            "verified_checklist": {
                "step_free_access": True,
                "dietary_labels_on_buffet": False,
                "first_aid_kit_on_site": True,
                "emergency_contact_sheet": False,
            }
        })

        # Pre-seed initial what-if scenarios
        plan.set_stage_data("what_if", {
            "scenarios": [
                {"id": "scen_1", "title": "Precipitation & Rain Contingency", "description": "Move outdoor terrace cocktails under covered marquee", "cost_impact": 15000.0, "headcount_impact": 0, "action_plan": "Marquee hold confirmed 48hrs prior"},
                {"id": "scen_2", "title": "15% Headcount Surge (+20 Guests)", "description": "Additional banquet table, tableware & portion buffer", "cost_impact": 22000.0, "headcount_impact": 20, "action_plan": "Caterer buffer clause permits +15% with 24hr notice"},
            ],
            "non_negotiables": [
                "Warm candlelight lighting (no harsh overhead fluorescents)",
                "Punctual dinner service commencement",
            ],
            "contingency_fund": round(total_b * 0.05, 2),
            "notes": "Backup audio speaker available on site."
        })

        # Pre-seed initial invitation drafts
        plan.set_stage_data("invitations", {
            "invitation_message": f"Warmly invite you to celebrate {event.title} on {event.date} at {event.location}. Your gracious presence will make this gathering truly unforgettable.",
            "whatsapp_caption": f"✨ We can't wait to celebrate with you! Join us for *{event.title}* on {event.date} at {event.location}. Kindly RSVP by your earliest convenience.",
            "instagram_announcement": f"Counting down the days to {event.title}. {event.date} • {event.location}. #VelouraCelebration",
            "rsvp_deadline": event.date,
            "dress_code": "Elegant Evening / Formal",
        })

        # Empty completed stages initially
        plan.completed_stages = []
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def _get_default_palette(event_type: str) -> List[Dict[str, str]]:
        palettes = {
            "Luxury Wedding": [
                {"name": "Warm Terracotta", "hex": "#C85A32"},
                {"name": "Ivory Cream", "hex": "#FDFBF7"},
                {"name": "Blush Coral", "hex": "#E76F51"},
                {"name": "Marigold Gold", "hex": "#E59500"},
            ],
            "Gala": [
                {"name": "Deep Teal", "hex": "#143B36"},
                {"name": "Golden Marigold", "hex": "#E59500"},
                {"name": "Warm Ivory", "hex": "#F4EFE6"},
                {"name": "Rich Terracotta", "hex": "#B04723"},
            ],
            "Curated Dinner": [
                {"name": "Earthy Terracotta", "hex": "#C85A32"},
                {"name": "Olive Teal", "hex": "#26796E"},
                {"name": "Sand Ivory", "hex": "#FBF7F0"},
                {"name": "Amber Marigold", "hex": "#F0B126"},
            ],
        }
        return palettes.get(event_type, [
            {"name": "Terracotta", "hex": "#C85A32"},
            {"name": "Coral", "hex": "#E76F51"},
            {"name": "Deep Teal", "hex": "#143B36"},
            {"name": "Marigold", "hex": "#E59500"},
            {"name": "Ivory", "hex": "#FDFBF7"},
        ])

    @staticmethod
    def calculate_progress_and_checklist(plan: EventPlan, event: Event) -> tuple[int, List[StageStatus]]:
        """
        Dynamically calculates completion and stage summaries based on actual saved data.
        Does not mark a stage complete merely because it was opened.
        """
        completed = list(plan.completed_stages)
        checklist: List[StageStatus] = []

        concept = plan.get_stage_data("concept")
        budget = plan.get_stage_data("budget")
        vendors = plan.get_stage_data("vendors")
        timeline = plan.get_stage_data("timeline")
        requirements = plan.get_stage_data("requirements")
        what_if = plan.get_stage_data("what_if")
        invitations = plan.get_stage_data("invitations")

        # 1. Concept: complete if in completed list
        is_concept_done = "concept" in completed
        concept_summary = f"Theme: {concept.get('theme', 'Not set')}" if is_concept_done else "Explore colors, menu & decor sketches"
        checklist.append(StageStatus(
            stage_id="concept",
            title="Event Concept",
            completed=is_concept_done,
            status="completed" if is_concept_done else ("in_progress" if concept.get("theme") else "not_started"),
            summary=concept_summary
        ))

        # 2. Budget: complete if in completed list
        categories = budget.get("categories", [])
        total_allocated = sum(c.get("allocated", 0.0) for c in categories)
        is_budget_done = "budget" in completed
        curr = budget.get("currency", "INR")
        symbol = "₹" if curr == "INR" else "$"
        budget_summary = f"{symbol}{total_allocated:,.0f} allocated across {len(categories)} categories" if is_budget_done else f"Establish budget in {curr}"
        checklist.append(StageStatus(
            stage_id="budget",
            title="Budget Planning",
            completed=is_budget_done,
            status="completed" if is_budget_done else ("in_progress" if total_allocated > 0 else "not_started"),
            summary=budget_summary
        ))

        # 3. Vendors: complete if in completed list or has shortlisted vendors
        shortlisted = vendors.get("shortlisted_ids", [])
        is_vendors_done = "vendors" in completed or len(shortlisted) > 0
        vendors_summary = f"{len(shortlisted)} artisan partner(s) shortlisted" if is_vendors_done else "Review curated artisan recommendations"
        checklist.append(StageStatus(
            stage_id="vendors",
            title="Vendor Discovery",
            completed=is_vendors_done,
            status="completed" if is_vendors_done else ("in_progress" if shortlisted else "not_started"),
            summary=vendors_summary
        ))

        # 4. Timeline: complete if in completed list or tasks completed
        tasks = timeline.get("tasks", [])
        completed_tasks_count = len([t for t in tasks if t.get("completed")])
        is_timeline_done = "timeline" in completed or (len(tasks) > 0 and completed_tasks_count > 0)
        timeline_summary = f"{completed_tasks_count} of {len(tasks)} tasks finished" if tasks else "Setup milestone checklists and run-of-show"
        checklist.append(StageStatus(
            stage_id="timeline",
            title="Timeline and Tasks",
            completed=is_timeline_done,
            status="completed" if is_timeline_done else ("in_progress" if tasks else "not_started"),
            summary=timeline_summary
        ))

        # 5. Special Requirements: complete if in completed list
        req_dietary = requirements.get("dietary_requirements", [])
        req_access = requirements.get("accessibility_requirements", [])
        is_req_done = "requirements" in completed
        req_summary = f"{len(req_dietary)} dietary & {len(req_access)} accessibility notes" if is_req_done else "Audit accessibility, dietary and safety needs"
        checklist.append(StageStatus(
            stage_id="requirements",
            title="Special Requirements",
            completed=is_req_done,
            status="completed" if is_req_done else ("in_progress" if (req_dietary or req_access) else "not_started"),
            summary=req_summary
        ))

        # 6. What-if Planning: complete if in completed list
        scenarios = what_if.get("scenarios", [])
        is_what_if_done = "what_if" in completed
        what_if_summary = f"{len(scenarios)} contingency scenario(s) prepared" if is_what_if_done else "Simulate rain plans, guest shifts & price changes"
        checklist.append(StageStatus(
            stage_id="what_if",
            title="Review and What-if Planning",
            completed=is_what_if_done,
            status="completed" if is_what_if_done else ("in_progress" if scenarios else "not_started"),
            summary=what_if_summary
        ))

        # 7. Invitations: complete if in completed list
        inv_msg = invitations.get("invitation_message", "")
        is_inv_done = "invitations" in completed
        inv_summary = "Invitations and announcements drafted" if is_inv_done else "Generate invitation wording & WhatsApp broadcasts"
        checklist.append(StageStatus(
            stage_id="invitations",
            title="Invitations and Finalisation",
            completed=is_inv_done,
            status="completed" if is_inv_done else ("in_progress" if inv_msg else "not_started"),
            summary=inv_summary
        ))

        # Compute percentage (out of 7 stages)
        completed_count = sum(1 for item in checklist if item.completed)
        progress_pct = int(round((completed_count / 7.0) * 100))

        return progress_pct, checklist

    @staticmethod
    def determine_next_step(checklist: List[StageStatus], event: Event) -> NextStepRecommendation:
        """
        Determines the single most relevant next action based on real completion state.
        Never recommends an already completed step unless all are done.
        """
        status_by_id = {item.stage_id: item.completed for item in checklist}

        if not status_by_id.get("concept", False):
            return NextStepRecommendation(
                stage="concept",
                action_title="Design your celebration concept",
                explanation="Establishing the color palette, aesthetic theme, and menu sketches anchors every decision to follow.",
                button_label="Create Event Concept",
                target_stage="concept",
                next_upcoming="Budget Planning in INR"
            )

        if not status_by_id.get("budget", False):
            return NextStepRecommendation(
                stage="budget",
                action_title="Establish your budget allocations",
                explanation="Assign spending ceilings across catering, venue, and scenography in INR to protect your financial margins.",
                button_label="Configure Budget in INR",
                target_stage="budget",
                next_upcoming="Vendor Discovery"
            )

        if not status_by_id.get("vendors", False):
            return NextStepRecommendation(
                stage="vendors",
                action_title="Find and shortlist matching vendors",
                explanation="Discover vetted florists, venues, and caterers whose capacity and aesthetic match your specific budget.",
                button_label="Discover Vendors",
                target_stage="vendors",
                next_upcoming="Timeline & Task Checklists"
            )

        if not status_by_id.get("timeline", False):
            return NextStepRecommendation(
                stage="timeline",
                action_title="Organise your preparation schedule & tasks",
                explanation="Structure production milestones and day-of minute-by-minute cues so nothing falls through the cracks.",
                button_label="Organise Timeline",
                target_stage="timeline",
                next_upcoming="Special Requirements Audit"
            )

        if not status_by_id.get("requirements", False):
            return NextStepRecommendation(
                stage="requirements",
                action_title="Audit dietary, accessibility & comfort needs",
                explanation="Ensure every guest experiences dignified hospitality with step-free egress, allergen safety, and quiet alcoves.",
                button_label="Review Special Requirements",
                target_stage="requirements",
                next_upcoming="What-if Contingency Planning"
            )

        if not status_by_id.get("what_if", False):
            return NextStepRecommendation(
                stage="what_if",
                action_title="Stress-test what-if scenarios & contingencies",
                explanation="Simulate weather rain shifts, sudden guest count changes (+20%), and preserve your non-negotiable details.",
                button_label="Simulate Scenarios",
                target_stage="what_if",
                next_upcoming="Invitations & Finalisation"
            )

        if not status_by_id.get("invitations", False):
            return NextStepRecommendation(
                stage="invitations",
                action_title="Finalise invitation copy & announcements",
                explanation="Generate polished invitations, WhatsApp broadcasts, and finalize your celebration countdown checklist.",
                button_label="Generate Invitations",
                target_stage="invitations",
                next_upcoming="Celebration Ready!"
            )

        # All 7 stages complete!
        return NextStepRecommendation(
            stage="ready",
            action_title="Your celebration is fully orchestrated!",
            explanation="All 7 planning stages are completed. You can revisit any stage to fine-tune details or export summaries.",
            button_label="Review Master Plan",
            target_stage="master_plan",
            next_upcoming="Event Day Ready"
        )

    @staticmethod
    def build_plan_response(plan: EventPlan, event: Event) -> EventPlanResponse:
        """Packages the complete planning state with calculated progress and recommendation."""
        progress_pct, checklist = PlanningService.calculate_progress_and_checklist(plan, event)
        next_step = PlanningService.determine_next_step(checklist, event)

        return EventPlanResponse(
            event_id=event.id,
            progress_percentage=progress_pct,
            completed_stages=plan.completed_stages,
            stages_checklist=checklist,
            next_step=next_step,
            concept=plan.get_stage_data("concept"),
            budget=plan.get_stage_data("budget"),
            vendors=plan.get_stage_data("vendors"),
            timeline=plan.get_stage_data("timeline"),
            requirements=plan.get_stage_data("requirements"),
            what_if=plan.get_stage_data("what_if"),
            invitations=plan.get_stage_data("invitations"),
            updated_at=plan.updated_at
        )

    @staticmethod
    def update_stage(db: Session, event_id: int, stage_name: str, data: dict, mark_completed: bool = True) -> EventPlanResponse:
        """Persists stage data, updates completion list, and recomputes the plan state."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event {event_id} not found.")

        plan = PlanningService.get_or_create_plan(db, event_id)
        plan.set_stage_data(stage_name, data)

        completed_set = set(plan.completed_stages)
        if mark_completed:
            completed_set.add(stage_name)
        else:
            completed_set.discard(stage_name)

        plan.completed_stages = list(completed_set)
        plan.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(plan)

        return PlanningService.build_plan_response(plan, event)

    @staticmethod
    def generate_concept_suggestions(event: Event) -> dict:
        """
        Generates tailored concepts based on event type, location, and guest count.
        Uses Gemini if configured, otherwise falls back gracefully to deterministic creative engine.
        """
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                import httpx
                prompt = (
                    f"You are Veloura's luxury celebration architect. Propose an event concept for: "
                    f"Type: {event.event_type}, Title: {event.title}, Location: {event.location}, "
                    f"Guests: {event.guest_count}. Theme vibe: {event.theme or 'warm elegant'}. "
                    f"Return JSON strictly with fields: theme, tagline, palette (list of name, hex), "
                    f"decor_ideas (list of 4 strings), menu_suggestions (list of 4 strings), "
                    f"entertainment_concepts (list of 3 strings)."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                    if resp.status_code == 200:
                        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        clean_json = raw.strip().removeprefix("```json").removesuffix("```").strip()
                        parsed = json.loads(clean_json)
                        parsed["is_custom"] = True
                        return parsed
            except Exception:
                pass  # Fall back to curated engine below

        # Curated aesthetic generator tailored to event type and destination
        event_type = (event.event_type or "").lower()
        if "wedding" in event_type:
            return {
                "theme": "Candlelit Terracotta & Wild Florals",
                "tagline": f"An intimate matrimonial celebration under amber glow in {event.location}.",
                "palette": [
                    {"name": "Warm Terracotta", "hex": "#C85A32"},
                    {"name": "Tuscan Ivory", "hex": "#FDFBF7"},
                    {"name": "Peach Coral", "hex": "#E76F51"},
                    {"name": "Marigold Leaf", "hex": "#E59500"},
                    {"name": "Deep Cypress", "hex": "#143B36"},
                ],
                "decor_ideas": [
                    "Suspended botanical floral clouds of dried olive branches, pampas and soft roses",
                    "Low hand-thrown terracotta taper candle holders running down imperial banquet tables",
                    "Personalised calligraphed linen place cards with raw deckle edges",
                    "Fairy-light canopy interwoven with amber festoon chandeliers over the dancefloor",
                ],
                "menu_suggestions": [
                    "Burrata with heirloom roasted figs, wild honey and basil oil",
                    "Slow-braised saffron and wild mushroom risotto finished with aged parmesan",
                    "Fire-roasted herb crusted tenderloin or grilled polenta with rosemary emulsion",
                    "Cardamom & pistachio olive oil cake served with orange blossom gelato",
                ],
                "entertainment_concepts": [
                    "Acoustic Spanish guitar and cello accompaniment for the ceremonial procession",
                    "Six-piece brass and swing collective for the cocktail & dinner transition",
                    "Late-night curated indie vinyl salon with artisanal digestif bar",
                ],
                "notes": f"Tailored for {event.guest_count} guests in {event.location}.",
                "is_custom": True,
            }
        elif "gala" in event_type or "conference" in event_type:
            return {
                "theme": "Regal Deep Teal & Gilded Amber",
                "tagline": f"An inspiring evening of dialogue, gastronomy, and philanthropy in {event.location}.",
                "palette": [
                    {"name": "Deep Regal Teal", "hex": "#143B36"},
                    {"name": "Burnished Marigold", "hex": "#E59500"},
                    {"name": "Ivory Linen", "hex": "#F4EFE6"},
                    {"name": "Clay Terracotta", "hex": "#B04723"},
                ],
                "decor_ideas": [
                    "Monolithic architectural floral displays featuring white calla lilies and bronze branches",
                    "Matte dark teal velvet drapery framing the presentation stage and keynote podium",
                    "Warm pinspot lighting focused precisely onto guest tables and award pedestals",
                    "Interactive projection mapping showcasing artistic honoree narratives",
                ],
                "menu_suggestions": [
                    "Pan-seared scallop with saffron cauliflower purée and microgreens",
                    "Duo of wood-smoked beef fillet and butter-poached lobster tail",
                    "Truffled woodland mushroom Wellington with port reduction (Vegetarian)",
                    "Dark Valrhona chocolate sphere melted with hot espresso caramel",
                ],
                "entertainment_concepts": [
                    "Live classical string quartet playing contemporary reimagined suites",
                    "Keynote conversational fireside chat with wireless lapel acoustics",
                    "Ambient jazz fusion trio playing the closing digestif reception",
                ],
                "notes": f"Designed for high-impact presence with {event.guest_count} attendees.",
                "is_custom": True,
            }
        else:
            return {
                "theme": "Sensory Autumn Soirée & Tasting",
                "tagline": f"An immersive sensory salon celebrating craftsmanship in {event.location}.",
                "palette": [
                    {"name": "Rich Terracotta", "hex": "#C85A32"},
                    {"name": "Luminous Coral", "hex": "#E76F51"},
                    {"name": "Deep Teal", "hex": "#26796E"},
                    {"name": "Golden Marigold", "hex": "#F0B126"},
                    {"name": "Handmade Ivory", "hex": "#FDFBF7"},
                ],
                "decor_ideas": [
                    "Minimalist natural timber tables with textured stone vessels and dried botanicals",
                    "Clustered beeswax pillar candles at varying heights casting organic silhouettes",
                    "Bespoke printed menus featuring tasting notes and provenance map of the ingredients",
                    "Open-concept live plating counter where guests observe culinary finishing touches",
                ],
                "menu_suggestions": [
                    "Tasting flight of artisanal local cheeses paired with wild honeycomb",
                    "Charcoal-grilled heritage skewers with smoked chili oil and fresh flatbreads",
                    "Braised seasonal root vegetable tagine with saffron pomegranate couscous",
                    "Spiced poached pear tart with mascarpone and thyme infused syrup",
                ],
                "entertainment_concepts": [
                    "Solo acoustic fingerstyle guitarist weaving melodic ambient textures",
                    "Sommelier-led guided natural wine and zero-proof botanical tasting notes",
                    "Curated low-tempo lounge rhythms for conversational intimacy",
                ],
                "notes": f"Curated for an intimate gathering of {event.guest_count} guests.",
                "is_custom": True,
            }

    @staticmethod
    def get_curated_vendors(event: Event, plan: EventPlan) -> List[Dict[str, Any]]:
        """
        Returns vetted demo vendors tailored to the event's location, type, and budget.
        Each vendor includes a match score and explanation of why they are recommended.
        """
        shortlisted_ids = set(plan.get_stage_data("vendors").get("shortlisted_ids", []))
        loc = event.location or "Destination"

        all_vendors = [
            {
                "id": "vnd_1",
                "name": f"The Heritage Courtyard & Glasshouse",
                "category": "Venue & Spaces",
                "location": loc,
                "price_tier": "₹₹₹",
                "capacity": f"Up to {max(event.guest_count + 50, 150)} guests",
                "rating": 4.9,
                "review_count": 68,
                "match_score": 98,
                "why_recommended": f"Matches your target headcount of {event.guest_count} with exceptional natural light and seamless indoor-outdoor rain contingencies.",
                "tags": ["Architectural", "Step-free Egress", "Bridal Suite", "Curfew: 01:00 AM"],
                "is_demo": True,
            },
            {
                "id": "vnd_2",
                "name": "Artisan Harvest Culinary Atelier",
                "category": "Catering & Bar",
                "location": loc,
                "price_tier": "₹₹₹",
                "capacity": "50 to 500 guests",
                "rating": 4.9,
                "review_count": 112,
                "match_score": 96,
                "why_recommended": "Renowned for seasonal farm-to-table menus with certified multi-dietary safety protocols (Celiac & Vegan friendly).",
                "tags": ["Farm to Table", "Full Bar Service", "Custom Menus", "Dietary Certified"],
                "is_demo": True,
            },
            {
                "id": "vnd_3",
                "name": "Botanica & Terracotta Scenography",
                "category": "Floral & Scenography",
                "location": loc,
                "price_tier": "₹₹",
                "capacity": "All Scales",
                "rating": 4.8,
                "review_count": 47,
                "match_score": 95,
                "why_recommended": f"Specialises in warm earthy palettes, raw linen runners, and low candlelight centerpieces aligned with your {event.theme or 'celebration theme'}.",
                "tags": ["Eco Florals", "Candle Specialists", "Ceramic Rentals"],
                "is_demo": True,
            },
            {
                "id": "vnd_4",
                "name": "Lumière Acoustic Ensemble & Strings",
                "category": "Music & Entertainment",
                "location": loc,
                "price_tier": "₹₹",
                "capacity": "Intimate to Grand",
                "rating": 5.0,
                "review_count": 89,
                "match_score": 94,
                "why_recommended": "Virtuoso string quartet providing contemporary cinematic acoustics during arrival, toasts, and dinner transitions.",
                "tags": ["String Quartet", "Custom Repertoire", "Wireless Audio Included"],
                "is_demo": True,
            },
            {
                "id": "vnd_5",
                "name": "Kinfolk & Grain Cinematography",
                "category": "Photo & Video",
                "location": loc,
                "price_tier": "₹₹₹",
                "capacity": "Full Day Coverage",
                "rating": 4.9,
                "review_count": 73,
                "match_score": 92,
                "why_recommended": "Documentary-style editorial photography capturing candid emotional resonance without intrusive posing.",
                "tags": ["35mm Film + Digital", "Drone Licensed", "Same-Week Previews"],
                "is_demo": True,
            },
        ]

        for v in all_vendors:
            v["is_shortlisted"] = v["id"] in shortlisted_ids

        return all_vendors

    @staticmethod
    def toggle_vendor_shortlist(db: Session, event_id: int, vendor_id: str, shortlisted: bool) -> EventPlanResponse:
        """Toggles vendor shortlist status and updates plan."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event {event_id} not found.")

        plan = PlanningService.get_or_create_plan(db, event_id)
        v_data = plan.get_stage_data("vendors")
        curr_ids = set(v_data.get("shortlisted_ids", []))

        if shortlisted:
            curr_ids.add(vendor_id)
        else:
            curr_ids.discard(vendor_id)

        v_data["shortlisted_ids"] = list(curr_ids)
        plan.set_stage_data("vendors", v_data)

        # Update completed stages list: complete if at least 1 vendor shortlisted
        completed_set = set(plan.completed_stages)
        if len(curr_ids) > 0:
            completed_set.add("vendors")
        else:
            completed_set.discard("vendors")

        plan.completed_stages = list(completed_set)
        plan.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(plan)

        return PlanningService.build_plan_response(plan, event)

    @staticmethod
    def toggle_task(db: Session, event_id: int, task_id: str, completed: bool) -> EventPlanResponse:
        """Toggles task status within timeline and recalculates progress."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event {event_id} not found.")

        plan = PlanningService.get_or_create_plan(db, event_id)
        t_data = plan.get_stage_data("timeline")
        tasks = t_data.get("tasks", [])

        for task in tasks:
            if task.get("id") == task_id:
                task["completed"] = completed
                break

        t_data["tasks"] = tasks
        plan.set_stage_data("timeline", t_data)

        completed_tasks = [t for t in tasks if t.get("completed")]
        completed_set = set(plan.completed_stages)
        if len(completed_tasks) > 0:
            completed_set.add("timeline")
        else:
            completed_set.discard("timeline")

        plan.completed_stages = list(completed_set)
        plan.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(plan)

        return PlanningService.build_plan_response(plan, event)
