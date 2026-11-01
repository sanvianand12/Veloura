from starlette.responses import Response
from starlette.requests import Request
from app.api.routes.auth import register, login, current_user, logout, reset_password, RegisterInput, LoginInput, ResetPasswordInput, _hash_secret
from app.api.routes.events import get_all_events, get_single_event, get_event_metrics, create_new_event, update_existing_event, delete_existing_event
from app.api.routes.planning import get_event_plan
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.user import User
from app.models.user import PasswordReset
from datetime import datetime, timedelta, timezone
from app.main import app
from app.schemas.event import EventCreate, EventUpdate

def test_registration_session_ownership_and_preserved_plan(db):
    event = Event(title='Legacy wedding', event_type='Wedding', date='2027-01-01', location='Jaipur', guest_count=100, budget=500000, status='Planning')
    db.add(event); db.flush()
    plan = EventPlan(event_id=event.id, concept_json='{"theme":"Saved legacy theme"}', invitations_json='{"invitation_message":"Saved invite"}')
    db.add(plan); db.commit(); event_id = event.id

    response = Response()
    a = register(RegisterInput(name='User A', email='a@example.com', password='A-secure-password-123', confirm_password='A-secure-password-123'), response, db)
    user_a = db.query(User).filter_by(email='a@example.com').one()
    assert a.id == user_a.id and user_a.password_hash != 'A-secure-password-123'
    assert db.query(Event).filter_by(id=event_id).one().owner_id == user_a.id
    saved = db.query(EventPlan).filter_by(event_id=event_id).one()
    assert saved.concept_json == '{"theme":"Saved legacy theme"}'
    assert saved.invitations_json == '{"invitation_message":"Saved invite"}'
    assert [e.id for e in get_all_events(db=db, user=user_a)] == [event_id]
    assert get_single_event(event_id=event_id, db=db, user=user_a).id == event_id

    register(RegisterInput(name='User B', email='b@example.com', password='B-secure-password-123', confirm_password='B-secure-password-123'), Response(), db)
    user_b = db.query(User).filter_by(email='b@example.com').one()
    create_new_event(EventCreate(title='User B reception', event_type='Reception', date='2027-02-02', location='Goa', guest_count=60, budget=250000), db=db, user=user_b)
    assert [event.title for event in get_all_events(db=db, user=user_b)] == ['User B reception']
    stats_a = get_event_metrics(db=db, user=user_a)
    stats_b = get_event_metrics(db=db, user=user_b)
    assert (stats_a.total_events, stats_a.total_budget, stats_a.total_guests, stats_a.upcoming_events) == (1, 500000, 100, 1)
    assert (stats_b.total_events, stats_b.total_budget, stats_b.total_guests, stats_b.upcoming_events) == (1, 250000, 60, 1)
    for operation in [
        lambda: get_single_event(event_id, db, user_b),
        lambda: update_existing_event(event_id, EventUpdate(title='Hacked'), db, user_b),
        lambda: delete_existing_event(event_id, db, user_b),
        lambda: get_event_plan(event_id, db, user_b),
    ]:
        try: operation()
        except Exception as error: assert getattr(error, 'status_code', None) == 404
        else: raise AssertionError('Cross-user event access should be rejected')
    db.refresh(event); assert event.title == 'Legacy wedding'
    assert db.query(EventPlan).filter_by(event_id=event_id).count() == 1

def test_login_bad_password_and_session_persistence(db):
    user = register(RegisterInput(name='Member', email='member@example.com', password='A-secure-password-123', confirm_password='A-secure-password-123'), Response(), db)
    wrong = Response()
    from starlette.requests import Request
    request = Request({'type':'http','method':'POST','path':'/api/auth/login','headers':[],'client':('127.0.0.1',12345),'server':('test',80),'scheme':'http','query_string':b''})
    try: login(LoginInput(email='member@example.com', password='bad-password'), request, wrong, db)
    except Exception as error: assert getattr(error, 'status_code', None) == 401
    else: raise AssertionError('Incorrect password must fail')
    response = Response()
    login(LoginInput(email='member@example.com', password='A-secure-password-123', remember_me=True), request, response, db)
    raw_cookie = next(v.decode().split(';',1)[0].split('=',1)[1] for k,v in response.raw_headers if k == b'set-cookie' and v.startswith(b'veloura_session='))
    # The opaque cookie resolves to the same server-side session on a later request.
    assert current_user(raw_cookie, db).email == 'member@example.com'
    assert db.query(User).filter_by(id=user.id).one().password_hash != 'A-secure-password-123'
    logout(Response(), raw_cookie, db)
    try: current_user(raw_cookie, db)
    except Exception as error: assert getattr(error, 'status_code', None) == 401
    else: raise AssertionError('Logout must invalidate the server-side session')

def test_password_reset_invalidates_sessions(db):
    user = register(RegisterInput(name='Reset', email='reset@example.com', password='A-secure-password-123', confirm_password='A-secure-password-123'), Response(), db)
    raw = 'one-time-reset-token'; now = datetime.now(timezone.utc)
    db.add(PasswordReset(token_hash=_hash_secret(raw), user_id=user.id, expires_at=now + timedelta(minutes=20))); db.commit()
    result = reset_password(ResetPasswordInput(token=raw, password='Another-secure-password-456', confirm_password='Another-secure-password-456'), Response(), db)
    assert result['message'].startswith('Password updated')
    login(LoginInput(email='reset@example.com', password='Another-secure-password-456'), Request({'type':'http','method':'POST','path':'/api/auth/login','headers':[],'client':('127.0.0.1',23456),'server':('test',80),'scheme':'http','query_string':b''}), Response(), db)

def test_event_api_declares_cookie_auth_and_csrf_requirements():
    schema = app.openapi()['paths']
    event_get = schema['/api/events']['get']
    assert any(param.get('in') == 'cookie' and param.get('name') == 'veloura_session' for param in event_get.get('parameters', []))
    event_post = schema['/api/events']['post']
    assert any(param.get('in') == 'cookie' and param.get('name') == 'veloura_session' for param in event_post.get('parameters', []))
    assert any(param.get('in') == 'header' and param.get('name') == 'X-CSRF-Token' for param in event_post.get('parameters', []))

def test_missing_session_is_rejected():
    from app.api.routes.auth import current_user
    try: current_user(None, None)
    except Exception as error: assert getattr(error, 'status_code', None) == 401
    else: raise AssertionError('Unauthenticated requests must fail')

def test_login_is_rate_limited_by_client_ip(db):
    request = Request({'type':'http','method':'POST','path':'/api/auth/login','headers':[],'client':('198.51.100.77',12345),'server':('test',80),'scheme':'http','query_string':b''})
    statuses = []
    for _ in range(9):
        try: login(LoginInput(email='unknown@example.com', password='wrong'), request, Response(), db)
        except Exception as error: statuses.append(getattr(error, 'status_code', None))
    assert statuses[:8] == [401] * 8
    assert statuses[8] == 429
