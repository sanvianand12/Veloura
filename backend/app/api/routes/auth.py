import hashlib, hmac, os, secrets, smtplib, time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Cookie, Header
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserSession, PasswordReset
from app.models.event import Event
from app.schemas.auth import RegisterInput, LoginInput, ResetRequest, ResetPasswordInput, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def parse_cookie_settings(secure_value: str | None, samesite_value: str | None) -> tuple[bool, str]:
    secure = (secure_value or "false").lower() in {"true", "1", "yes"}
    samesite = (samesite_value or "lax").lower()
    if samesite not in {"lax", "strict", "none"}: samesite = "lax"
    if samesite == "none" and not secure:
        raise ValueError("COOKIE_SAMESITE=none requires COOKIE_SECURE=true")
    return secure, samesite

COOKIE_SECURE, COOKIE_SAMESITE = parse_cookie_settings(os.getenv("COOKIE_SECURE"), os.getenv("COOKIE_SAMESITE"))
SESSION_COOKIE = "veloura_session"
CSRF_COOKIE = "veloura_csrf"
attempts: dict[str, list[float]] = {}

def _hash_secret(value: str) -> str: return hashlib.sha256(value.encode()).hexdigest()
def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
def _password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${derived.hex()}"
def _verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, expected = stored.split("$")
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError): return False

def _issue_session(db, response, user, remember=False):
    now = datetime.now(timezone.utc)
    lifetime = timedelta(days=30 if remember else 1)
    raw = secrets.token_urlsafe(48)
    db.add(UserSession(token_hash=_hash_secret(raw), user_id=user.id, expires_at=now + lifetime))
    csrf = secrets.token_urlsafe(32)
    response.set_cookie(SESSION_COOKIE, raw, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, max_age=int(lifetime.total_seconds()), path="/")
    response.set_cookie(CSRF_COOKIE, csrf, httponly=False, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, max_age=int(lifetime.total_seconds()), path="/")

def current_user(veloura_session: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not veloura_session: raise HTTPException(401, "Authentication required")
    session = db.query(UserSession).filter(UserSession.token_hash == _hash_secret(veloura_session)).first()
    now = datetime.now(timezone.utc)
    if not session or _as_utc(session.expires_at) <= now:
        raise HTTPException(401, "Session expired")
    return db.query(User).filter(User.id == session.user_id).first()

def require_csrf(request: Request, csrf_header: str | None = Header(default=None, alias="X-CSRF-Token")):
    cookie = request.cookies.get(CSRF_COOKIE)
    if not cookie or not csrf_header or not hmac.compare_digest(cookie, csrf_header):
        raise HTTPException(403, "CSRF validation failed")

@router.get("/csrf")
def csrf_token(response: Response):
    token = secrets.token_urlsafe(32)
    response.set_cookie(CSRF_COOKIE, token, httponly=False, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, path="/")
    return {"csrf_token": token}

def _rate_limit(request: Request, email: str):
    key = request.client.host if request.client else "unknown"
    now = time.time(); recent = [t for t in attempts.get(key, []) if now - t < 900]
    if len(recent) >= 8: raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")
    recent.append(now); attempts[key] = recent
    if len(attempts) > 10000:
        for old_key in [k for k, values in attempts.items() if not values or now - values[-1] >= 900]: attempts.pop(old_key, None)

@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterInput, response: Response, db: Session = Depends(get_db), _: None = Depends(require_csrf)):
    if data.password != data.confirm_password: raise HTTPException(422, "Passwords do not match")
    email = data.email.strip().lower()
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]: raise HTTPException(422, "Enter a valid email address")
    if db.query(User).filter(User.email == email).first(): raise HTTPException(409, "An account with this email already exists")
    user = User(name=data.name.strip(), email=email, password_hash=_password_hash(data.password))
    db.add(user); db.flush()
    # First account claims legacy rows atomically; later accounts never see unowned records.
    if db.query(User).count() == 1: db.query(Event).filter(Event.owner_id.is_(None)).update({Event.owner_id: user.id}, synchronize_session=False)
    _issue_session(db, response, user); db.commit(); db.refresh(user)
    return user

@router.post("/login", response_model=UserResponse)
def login(data: LoginInput, request: Request, response: Response, db: Session = Depends(get_db), _: None = Depends(require_csrf)):
    email = data.email.strip().lower(); _rate_limit(request, email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not _verify_password(data.password, user.password_hash): raise HTTPException(401, "Email or password is incorrect")
    _issue_session(db, response, user, data.remember_me); db.commit(); return user

@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(current_user)): return user

@router.post("/logout", dependencies=[Depends(require_csrf)])
def logout(response: Response, veloura_session: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if veloura_session: db.query(UserSession).filter(UserSession.token_hash == _hash_secret(veloura_session)).delete()
    db.commit(); response.delete_cookie(SESSION_COOKIE, path="/", secure=COOKIE_SECURE, httponly=True, samesite=COOKIE_SAMESITE); response.delete_cookie(CSRF_COOKIE, path="/", secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)
    return {"message": "Signed out"}

def _send_reset(email: str, token: str):
    host = os.getenv("SMTP_HOST")
    if not host: return False
    msg = EmailMessage(); msg["Subject"] = "Reset your Veloura password"; msg["From"] = os.getenv("SMTP_FROM", "no-reply@localhost"); msg["To"] = email
    base = os.getenv("FRONTEND_URL", "http://localhost:5173")
    msg.set_content(f"Reset your Veloura password: {base}/reset-password?token={token}\nThis link expires in 30 minutes.")
    with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as server:
        server.starttls(); server.login(os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASSWORD", "")); server.send_message(msg)
    return True

@router.post("/forgot-password", dependencies=[Depends(require_csrf)])
def forgot_password(data: ResetRequest, request: Request, db: Session = Depends(get_db)):
    email = data.email.strip().lower(); user = db.query(User).filter(User.email == email).first()
    _rate_limit(request, email)
    if user:
        raw = secrets.token_urlsafe(40); now = datetime.now(timezone.utc)
        db.add(PasswordReset(token_hash=_hash_secret(raw), user_id=user.id, expires_at=now + timedelta(minutes=30))); db.commit()
        try: _send_reset(user.email, raw)
        except Exception: pass
    return {"message": "If an account exists, password reset instructions will be sent."}

@router.post("/reset-password", dependencies=[Depends(require_csrf)])
def reset_password(data: ResetPasswordInput, response: Response, db: Session = Depends(get_db)):
    if data.password != data.confirm_password: raise HTTPException(422, "Passwords do not match")
    reset = db.query(PasswordReset).filter(PasswordReset.token_hash == _hash_secret(data.token), PasswordReset.used_at.is_(None)).first()
    now = datetime.now(timezone.utc)
    if not reset or _as_utc(reset.expires_at) <= now: raise HTTPException(400, "Reset link is invalid or expired")
    user = db.query(User).filter(User.id == reset.user_id).first(); user.password_hash = _password_hash(data.password); reset.used_at = now
    db.query(UserSession).filter(UserSession.user_id == user.id).delete(); db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/", secure=COOKIE_SECURE, httponly=True, samesite=COOKIE_SAMESITE)
    return {"message": "Password updated. Please sign in again."}
