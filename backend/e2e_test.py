"""
Veloura End-to-End API Verification Test
Runs against the live backend on http://127.0.0.1:8000
"""
import requests
import sys

BASE = 'http://127.0.0.1:8000'
PASS = []
FAIL = []

def ok(name):
    PASS.append(name)
    print(f'  PASS  {name}')

def fail(name, reason):
    FAIL.append((name, reason))
    print(f'  FAIL  {name}: {reason}')

def check(cond, name, reason='assertion failed'):
    if cond:
        ok(name)
    else:
        fail(name, reason)

# ─── 1. Health ────────────────────────────────────────────────────────────────
print('\n=== 1. Health & Connectivity ===')
r = requests.get(f'{BASE}/health')
check(r.status_code == 200 and r.json()['status'] == 'healthy', 'Health endpoint returns healthy')
check(r.json()['database'] == 'healthy', 'Database connectivity healthy')

# ─── 2. Event Creation ────────────────────────────────────────────────────────
print('\n=== 2. Event Creation ===')
payload = {
    'title': 'E2E Verification Wedding',
    'event_type': 'Luxury Wedding',
    'date': '2027-06-15',
    'time': '18:00',
    'location': 'Jaipur',
    'guest_count': 200,
    'budget': 2500000.0,
    'theme': 'Royal Terracotta',
    'description': 'E2E verification test event',
    'status': 'Planning',
}
r = requests.post(f'{BASE}/api/events', json=payload)
check(r.status_code == 201, 'Create event returns 201')
ev1 = r.json()
eid1 = ev1.get('id')
check(eid1 is not None, 'Event has ID')
check(ev1.get('budget') == 2500000.0, 'Budget stored as INR 2500000')
check(ev1.get('event_type') == 'Luxury Wedding', 'Event type stored correctly')

# Second event for isolation testing
payload2 = dict(payload, title='E2E Birthday Event', event_type='Birthday Celebration', budget=300000.0, guest_count=50)
r2 = requests.post(f'{BASE}/api/events', json=payload2)
check(r2.status_code == 201, 'Create second event for isolation testing')
eid2 = r2.json().get('id')

# ─── 3. Plan Initialization ───────────────────────────────────────────────────
print('\n=== 3. Plan Initialization & Pre-seeding ===')
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
check(r.status_code == 200, 'GET /plan returns 200')
plan = r.json()
check(plan['event_id'] == eid1, 'Plan linked to correct event')
check(plan['progress_percentage'] == 0, 'Fresh plan starts at 0%')
check(len(plan['completed_stages']) == 0, 'No completed stages on fresh plan')
check(plan['next_step']['stage'] == 'concept', 'First next_step is concept')
check(plan['next_step']['target_stage'] == 'concept', 'target_stage is concept initially')

# Pre-seeded budget checks
budget_data = plan.get('budget', {})
check(budget_data.get('currency') == 'INR', 'Pre-seeded budget currency is INR')
check(budget_data.get('total_budget') == 2500000.0, 'Pre-seeded total_budget = event budget')
cats = budget_data.get('categories', [])
check(len(cats) == 6, f'Pre-seeded has 6 budget categories (got {len(cats)})')
total_alloc = sum(c.get('allocated', 0) for c in cats)
check(abs(total_alloc - 2500000.0) < 1.0, f'Pre-seeded allocations sum to budget: {total_alloc}')

# Pre-seeded invitations draft
inv_draft = plan.get('invitations', {})
check(bool(inv_draft.get('invitation_message')), 'Pre-seeded invitation message exists')
check(bool(inv_draft.get('whatsapp_caption')), 'Pre-seeded WhatsApp caption exists')

# ─── 4. Concept Generate & Save ───────────────────────────────────────────────
print('\n=== 4. Concept - Generate, Save, Persist ===')
r = requests.post(f'{BASE}/api/events/{eid1}/plan/concept/generate')
check(r.status_code == 200, 'POST /concept/generate returns 200')
gen = r.json()
for key in ['theme', 'tagline', 'palette', 'decor_ideas', 'menu_suggestions', 'entertainment_concepts']:
    check(key in gen, f'Generated concept has key "{key}"')
check(isinstance(gen.get('palette'), list) and len(gen['palette']) > 0, 'Palette is non-empty list')
check(all('hex' in c and 'name' in c for c in gen.get('palette', [])), 'Palette entries have hex and name')
check('is_custom' in gen, 'Generated concept has is_custom field (demo/live identification)')

concept_save = {
    'theme': 'Royal Terracotta & Amber Lanterns',
    'tagline': 'An unforgettable celebration',
    'palette': [
        {'name': 'Terracotta', 'hex': '#C85A32'},
        {'name': 'Ivory', 'hex': '#FDFBF7'},
        {'name': 'Marigold', 'hex': '#E59500'},
    ],
    'decor_ideas': ['Floral arch at entrance', 'Marigold torans', 'Diyas on tables'],
    'menu_suggestions': ['Welcome chai', 'Dal baati churma', 'Ghevar dessert'],
    'entertainment_concepts': ['Rajasthani folk music'],
    'notes': 'E2E verified concept',
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/concept', json=concept_save)
check(r.status_code == 200, 'PUT /concept returns 200')
resp = r.json()
check('concept' in resp['completed_stages'], 'Concept in completed_stages after PUT')
check(resp['progress_percentage'] > 0, 'Progress > 0 after concept save')
check(resp['next_step']['stage'] == 'budget', 'next_step advances to budget')

# Persistence check via fresh GET
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
check('concept' in p['completed_stages'], 'Concept completion persists on re-fetch')
check(p['concept'].get('theme') == 'Royal Terracotta & Amber Lanterns', 'Concept theme persists')
check(len(p['concept'].get('palette', [])) == 3, 'Palette with 3 colours persists')
check(p['concept']['palette'][0]['hex'] == '#C85A32', 'Palette hex value persists')

# ─── 5. Budget Save & Persist ─────────────────────────────────────────────────
print('\n=== 5. Budget - Save, Expense Tracking, Persist ===')
budget_payload = {
    'total_budget': 2500000.0,
    'currency': 'INR',
    'categories': [
        {'id': 'venue',         'name': 'Venue & Decor',    'allocated': 750000.0,  'spent': 200000.0, 'notes': 'Rambagh Palace'},
        {'id': 'catering',      'name': 'Catering',         'allocated': 875000.0,  'spent': 0.0},
        {'id': 'photography',   'name': 'Photography',      'allocated': 250000.0,  'spent': 50000.0},
        {'id': 'decor',         'name': 'Decor & Florals',  'allocated': 375000.0,  'spent': 30000.0},
        {'id': 'entertainment', 'name': 'Entertainment',    'allocated': 125000.0,  'spent': 0.0},
        {'id': 'contingency',   'name': 'Contingency',      'allocated': 125000.0,  'spent': 0.0},
    ],
    'expenses': [
        {'id': 'exp1', 'category_id': 'venue',       'title': 'Venue deposit',     'amount': 200000.0, 'date': '2026-11-01', 'vendor': 'Rambagh Palace'},
        {'id': 'exp2', 'category_id': 'photography', 'title': 'Photographer advance', 'amount': 50000.0, 'date': '2026-11-02', 'vendor': 'Studio 99'},
        {'id': 'exp3', 'category_id': 'decor',       'title': 'Floral advance',    'amount': 30000.0,  'date': '2026-11-03', 'vendor': 'Flora Arts'},
    ],
    'mark_completed': True,
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/budget', json=budget_payload)
check(r.status_code == 200, 'PUT /budget returns 200')
resp = r.json()
check('budget' in resp['completed_stages'], 'Budget in completed_stages')
check(resp['next_step']['stage'] == 'vendors', 'next_step advances to vendors')

r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
b = p.get('budget', {})
check('budget' in p['completed_stages'], 'Budget completion persists')
check(b.get('total_budget') == 2500000.0, 'Total budget persists')
check(b.get('currency') == 'INR', 'Currency INR persists')
check(len(b.get('categories', [])) == 6, f'All 6 categories persist (got {len(b.get("categories", []))})')
check(len(b.get('expenses', [])) == 3, f'All 3 expenses persist (got {len(b.get("expenses", []))})')
check(b['categories'][0].get('spent') == 200000.0, 'Category spent amount persists')
check(b['expenses'][0].get('vendor') == 'Rambagh Palace', 'Expense vendor name persists')

# ─── 6. Vendor Shortlist & Persist ───────────────────────────────────────────
print('\n=== 6. Vendors - List, Shortlist, Persist ===')
r = requests.get(f'{BASE}/api/events/{eid1}/plan/vendors')
check(r.status_code == 200, 'GET /vendors returns 200')
vendors = r.json()
check(isinstance(vendors, list) and len(vendors) > 0, f'Vendors list non-empty (got {len(vendors)})')
required_fields = ['id', 'name', 'category', 'location', 'price_tier', 'rating', 'match_score', 'why_recommended', 'tags', 'is_demo']
for field in required_fields:
    check(all(field in v for v in vendors), f'All vendors have field "{field}"')
check(all(v.get('is_demo') is True for v in vendors), 'All vendors have is_demo=True (correctly labelled)')
check(all(v.get('match_score', 0) > 0 for v in vendors), 'All vendors have positive match_score')

vid1 = vendors[0]['id']
vid2 = vendors[1]['id']

# Shortlist first vendor
r = requests.post(f'{BASE}/api/events/{eid1}/plan/vendors/shortlist', json={'vendor_id': vid1, 'shortlisted': True})
check(r.status_code == 200, 'POST /vendors/shortlist returns 200')
resp = r.json()
shortlisted = resp['vendors'].get('shortlisted_ids', [])
check(vid1 in shortlisted, f'vid1 in shortlisted_ids after shortlist')

# Shortlist second vendor
r = requests.post(f'{BASE}/api/events/{eid1}/plan/vendors/shortlist', json={'vendor_id': vid2, 'shortlisted': True})
check(r.status_code == 200, 'Second vendor shortlist succeeds')

# Remove first vendor
r = requests.post(f'{BASE}/api/events/{eid1}/plan/vendors/shortlist', json={'vendor_id': vid1, 'shortlisted': False})
check(r.status_code == 200, 'Vendor unshortlist returns 200')
resp = r.json()
shortlisted = resp['vendors'].get('shortlisted_ids', [])
check(vid1 not in shortlisted, 'vid1 removed from shortlist')
check(vid2 in shortlisted, 'vid2 still shortlisted after removing vid1')

# Persistence
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
check(vid2 in p['vendors'].get('shortlisted_ids', []), 'Vendor shortlist persists on re-fetch')
check(vid1 not in p['vendors'].get('shortlisted_ids', []), 'Removed vendor not in shortlist on re-fetch')

# ─── 7. Timeline Tasks & Toggle ───────────────────────────────────────────────
print('\n=== 7. Timeline - Tasks, Toggle, Day-of Schedule, Persist ===')
timeline_payload = {
    'tasks': [
        {'id': 'task1', 'title': 'Book venue contract',  'category': 'Venue',        'due_date': '2027-01-01', 'completed': False, 'priority': 'High'},
        {'id': 'task2', 'title': 'Send invitations',     'category': 'Invitations',  'due_date': '2027-03-01', 'completed': False, 'priority': 'Medium'},
        {'id': 'task3', 'title': 'Catering tasting done','category': 'Catering',     'due_date': '2027-02-01', 'completed': True,  'priority': 'High'},
    ],
    'day_of_schedule': [
        {'id': 'sched1', 'time': '16:00', 'title': 'Vendor load-in', 'description': 'Florist + AV setup', 'lead': 'Event Manager'},
        {'id': 'sched2', 'time': '18:30', 'title': 'Guest arrival',  'description': 'Welcome drinks',     'lead': 'Hospitality'},
    ],
    'mark_completed': True,
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/timeline', json=timeline_payload)
check(r.status_code == 200, 'PUT /timeline returns 200')
resp = r.json()
check('timeline' in resp['completed_stages'], 'Timeline in completed_stages')

# Toggle individual task
r = requests.patch(f'{BASE}/api/events/{eid1}/plan/tasks/task1?completed=true')
check(r.status_code == 200, 'PATCH /tasks/{id} returns 200')
tasks_after = r.json().get('timeline', {}).get('tasks', [])
t1 = next((t for t in tasks_after if t['id'] == 'task1'), None)
check(t1 is not None and t1['completed'] is True, 'task1 toggled to completed=True')

# Toggle back
r = requests.patch(f'{BASE}/api/events/{eid1}/plan/tasks/task1?completed=false')
check(r.status_code == 200, 'PATCH task toggle back returns 200')
t1_back = next((t for t in r.json().get('timeline', {}).get('tasks', []) if t['id'] == 'task1'), None)
check(t1_back is not None and t1_back['completed'] is False, 'task1 toggled back to completed=False')

# Persistence
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
tasks = p['timeline'].get('tasks', [])
check(len(tasks) == 3, f'All 3 tasks persist (got {len(tasks)})')
t3 = next((t for t in tasks if t['id'] == 'task3'), None)
check(t3 is not None and t3['completed'] is True, 'Pre-saved completed task persists as completed')
schedule = p['timeline'].get('day_of_schedule', [])
check(len(schedule) == 2, f'Day-of schedule (2 items) persists (got {len(schedule)})')

# ─── 8. Requirements ──────────────────────────────────────────────────────────
print('\n=== 8. Special Requirements - Save & Persist ===')
req_payload = {
    'dietary_requirements': ['Vegetarian options', 'Jain vegetarian', 'Nut-allergy protocol'],
    'accessibility_requirements': ['Step-free venue entrance', 'Wheelchair accessible washroom'],
    'personal_notes': 'Elder guests need priority seating near the stage.',
    'verified_checklist': {
        'step_free_access': True,
        'dietary_labels_on_buffet': False,
        'first_aid_kit_on_site': True,
        'emergency_contact_sheet': False,
    },
    'mark_completed': True,
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/requirements', json=req_payload)
check(r.status_code == 200, 'PUT /requirements returns 200')
check('requirements' in r.json()['completed_stages'], 'Requirements in completed_stages')

r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
req = p.get('requirements', {})
check(len(req.get('dietary_requirements', [])) == 3, 'Dietary requirements (3) persist')
check(len(req.get('accessibility_requirements', [])) == 2, 'Accessibility requirements (2) persist')
check(req.get('personal_notes') == 'Elder guests need priority seating near the stage.', 'Personal notes persist')
check(req.get('verified_checklist', {}).get('step_free_access') is True, 'Checklist true value persists')
check(req.get('verified_checklist', {}).get('dietary_labels_on_buffet') is False, 'Checklist false value persists')

# ─── 9. What-if Scenarios ─────────────────────────────────────────────────────
print('\n=== 9. What-if Scenarios - Save & Persist ===')
whatif_payload = {
    'scenarios': [
        {'id': 'scen1', 'title': 'Rain contingency', 'description': 'Move to marquee', 'cost_impact': 200000.0, 'headcount_impact': 0, 'action_plan': 'Marquee pre-booked'},
        {'id': 'scen2', 'title': 'Guest surge +40',  'description': '40 extra guests',  'cost_impact': 120000.0, 'headcount_impact': 40, 'action_plan': 'Caterer buffer clause'},
    ],
    'non_negotiables': ['Live folk music', 'Marigold floral arch', 'Open bar until midnight'],
    'contingency_fund': 200000.0,
    'notes': 'E2E test scenarios',
    'mark_completed': True,
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/what-if', json=whatif_payload)
check(r.status_code == 200, 'PUT /what-if returns 200')
check('what_if' in r.json()['completed_stages'], 'what_if in completed_stages')

r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
wi = p.get('what_if', {})
check(len(wi.get('scenarios', [])) == 2, f'Scenarios (2) persist (got {len(wi.get("scenarios", []))})')
check(len(wi.get('non_negotiables', [])) == 3, f'Non-negotiables (3) persist (got {len(wi.get("non_negotiables", []))})')
check(wi.get('contingency_fund') == 200000.0, 'Contingency fund persists')
check(wi['scenarios'][0]['cost_impact'] == 200000.0, 'Scenario cost_impact value persists')
check(wi['scenarios'][1]['headcount_impact'] == 40, 'Scenario headcount_impact persists')

# ─── 10. Invitations ──────────────────────────────────────────────────────────
print('\n=== 10. Invitations - Save & Persist (Master Plan data source) ===')
inv_payload = {
    'invitation_message': 'With great joy we invite you to E2E Verification Wedding on 2027-06-15 at Jaipur.',
    'whatsapp_caption': '*You are invited!* Join us for *E2E Verification Wedding* on 2027-06-15 at Jaipur. RSVP by 2027-05-01.',
    'instagram_announcement': 'Counting down to the big day! #E2EWedding2027',
    'rsvp_deadline': '2027-05-01',
    'dress_code': 'Indian Traditional',
    'mark_completed': True,
}
r = requests.put(f'{BASE}/api/events/{eid1}/plan/invitations', json=inv_payload)
check(r.status_code == 200, 'PUT /invitations returns 200')
check('invitations' in r.json()['completed_stages'], 'invitations in completed_stages')

r = requests.get(f'{BASE}/api/events/{eid1}/plan')
p = r.json()
inv = p.get('invitations', {})
check(inv.get('invitation_message') == inv_payload['invitation_message'], 'Invitation message persists exactly')
check(inv.get('whatsapp_caption') == inv_payload['whatsapp_caption'], 'WhatsApp caption persists')
check(inv.get('instagram_announcement') == inv_payload['instagram_announcement'], 'Instagram announcement persists')
check(inv.get('dress_code') == 'Indian Traditional', 'Dress code persists')
check(inv.get('rsvp_deadline') == '2027-05-01', 'RSVP deadline persists')

# ─── 11. Full Consolidation Check (Master Plan data source) ──────────────────
print('\n=== 11. Master Plan Data Consolidation ===')
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
final = r.json()

# All 7 stages complete (vendors complete via shortlisting)
for stage in ['concept', 'budget', 'timeline', 'requirements', 'what_if', 'invitations']:
    check(stage in final['completed_stages'], f'Stage "{stage}" in completed_stages for Master Plan')

check(final['progress_percentage'] == 100, f'100% when all 7 stages done (got {final["progress_percentage"]}%)')
check(final['next_step']['target_stage'] == 'master_plan', f'target_stage=master_plan when 100% (got {final["next_step"]["target_stage"]})')
check(final['next_step']['button_label'] == 'Review Master Plan', 'Button label is "Review Master Plan"')

# Verify all data is available in one GET for Master Plan page to consume
check(final['concept']['theme'] == 'Royal Terracotta & Amber Lanterns', 'Concept available in full plan')
check(len(final['budget']['categories']) == 6, 'Budget categories available in full plan')
check(len(final['budget']['expenses']) == 3, 'Expenses available in full plan')
check(vid2 in final['vendors'].get('shortlisted_ids', []), 'Shortlisted vendor available in full plan')
check(len(final['timeline']['tasks']) == 3, 'Tasks available in full plan')
check(len(final['requirements']['dietary_requirements']) == 3, 'Requirements available in full plan')
check(len(final['what_if']['scenarios']) == 2, 'Scenarios available in full plan')
check(final['invitations']['invitation_message'] != '', 'Invitations available in full plan')
check(len(final['concept']['palette']) == 3, 'Palette colours available for invitation card rendering')

# ─── 12. Event Isolation ─────────────────────────────────────────────────────
print('\n=== 12. Event Isolation (Independent Planning Data) ===')
r = requests.get(f'{BASE}/api/events/{eid2}/plan')
p2 = r.json()
check(p2['event_id'] == eid2, 'Event 2 plan has its own event_id')
check(len(p2['completed_stages']) == 0, f'Event 2 has 0 completed stages (got {len(p2["completed_stages"])})')
check(p2['progress_percentage'] == 0, f'Event 2 progress = 0% (got {p2["progress_percentage"]}%)')
check(p2['concept'].get('theme') != 'Royal Terracotta & Amber Lanterns', 'Event 2 concept is independent from event 1')
check(p2['budget'].get('total_budget') == 300000.0, f'Event 2 budget is 300000 (got {p2["budget"].get("total_budget")})')
check(p2['budget'].get('currency') == 'INR', 'Event 2 budget currency is INR')
check(vid2 not in p2['vendors'].get('shortlisted_ids', []), 'Event 2 vendor shortlist is independent')
check(p2['next_step']['stage'] == 'concept', 'Event 2 next_step is still concept')

# ─── 13. Stats & INR aggregation ─────────────────────────────────────────────
print('\n=== 13. Stats & INR Budget Aggregation ===')
r = requests.get(f'{BASE}/api/events/stats')
check(r.status_code == 200, 'GET /stats returns 200')
stats = r.json()
check(stats['total_events'] >= 2, f'Stats shows >= 2 events (got {stats["total_events"]})')
check(stats['total_budget'] >= 2800000.0, f'Stats total_budget >= 2800000 INR (got {stats["total_budget"]})')
check(stats['total_guests'] >= 250, f'Stats total_guests >= 250 (got {stats["total_guests"]})')

# ─── 14. API Route Coverage Check ────────────────────────────────────────────
print('\n=== 14. API Route Coverage ===')
routes = [
    ('GET',    f'{BASE}/api/events',                              200),
    ('GET',    f'{BASE}/api/events/stats',                        200),
    ('GET',    f'{BASE}/api/events/{eid1}',                       200),
    ('GET',    f'{BASE}/api/events/{eid1}/plan',                  200),
    ('GET',    f'{BASE}/api/events/{eid1}/plan/vendors',          200),
    ('GET',    f'{BASE}/api/events/99999',                        404),
    ('GET',    f'{BASE}/api/events/99999/plan',                   404),
]
for method, url, expected in routes:
    resp = requests.request(method, url)
    check(resp.status_code == expected, f'{method} {url.replace(BASE,"")} → {expected}')

# ─── 15. Cleanup ─────────────────────────────────────────────────────────────
print('\n=== 15. Cascade Delete ===')
r = requests.delete(f'{BASE}/api/events/{eid1}')
check(r.status_code == 204, 'DELETE event 1 → 204')

# Plan should 404 after event deleted (cascade)
r = requests.get(f'{BASE}/api/events/{eid1}/plan')
check(r.status_code == 404, 'Plan 404 after event deleted (FK cascade works)')
r = requests.get(f'{BASE}/api/events/{eid1}')
check(r.status_code == 404, 'Event 404 after deletion')

r = requests.delete(f'{BASE}/api/events/{eid2}')
check(r.status_code == 204, 'DELETE event 2 → 204')

# ─── Summary ─────────────────────────────────────────────────────────────────
print()
print('=' * 62)
print(f'RESULT:  {len(PASS)} passed  |  {len(FAIL)} failed  |  {len(PASS)+len(FAIL)} total')
if FAIL:
    print()
    print('FAILURES:')
    for name, reason in FAIL:
        print(f'  ✗  {name}')
        print(f'     → {reason}')
print('=' * 62)
sys.exit(1 if FAIL else 0)
