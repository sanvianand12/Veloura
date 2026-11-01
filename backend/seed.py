"""Database seed utility for Veloura development environment."""
from app.database.session import SessionLocal, init_db
from app.models.event import Event
from app.services.planning_service import PlanningService

def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # Check if events already exist
        count = db.query(Event).count()
        if count >= 3:
            # Ensure their plans exist
            for ev in db.query(Event).all():
                PlanningService.get_or_create_plan(db, ev.id)
            print(f"Database already contains {count} event(s). Plans verified.")
            return

        # Clean existing
        db.query(Event).delete()
        db.commit()

        sample_events = [
            Event(
                title="The Royal Courtyard Wedding & Sangeet",
                event_type="Luxury Wedding",
                date="2026-12-18",
                time="17:00",
                location="Taj Lake Palace, Udaipur",
                guest_count=220,
                budget=2800000.0,
                theme="Royal Terracotta, Marigold Garland Canopy & Amber Lanterns",
                description="A magnificent three-day lakeside celebration with royal Rajasthani banquet feast, acoustic folk strings, and evening fireworks.",
                status="Planning",
            ),
            Event(
                title="Zenith Annual Innovation Gala",
                event_type="Gala",
                date="2026-11-25",
                time="19:00",
                location="The Leela Palace, Bengaluru",
                guest_count=160,
                budget=1200000.0,
                theme="Deep Teal Velvet, Sculptural Crystals & Brass Accents",
                description="Annual flagship celebration gathering visionary founders, philanthropists, and artists for an evening of multi-course gastronomy.",
                status="Confirmed",
            ),
            Event(
                title="Sunset Coastal Vernissage & Tasting",
                event_type="Curated Dinner",
                date="2027-01-15",
                time="18:30",
                location="Ahilya by the Sea, Goa",
                guest_count=45,
                budget=450000.0,
                theme="Raw Linen, Terracotta Pottery, Wild Botanicals & Candlelight",
                description="An intimate oceanfront sunset dinner featuring progressive coastal tasting menus and artisanal beverage pairings.",
                status="Planning",
            ),
        ]

        db.add_all(sample_events)
        db.commit()

        # Initialize plans for seeded events
        for ev in sample_events:
            plan = PlanningService.get_or_create_plan(db, ev.id)
            if ev.title.startswith("The Royal"):
                # Pre-complete concept and budget for the wedding to showcase progress
                plan.completed_stages = ["concept", "budget"]
                db.commit()

        print(f"Successfully seeded {len(sample_events)} signature celebration(s) with INR budgets into SQLite database.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
