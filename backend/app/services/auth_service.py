import smtplib
import secrets
import logging
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

VERIFICATION_TOKEN_EXPIRE_HOURS = 24


# ── Password helpers ──────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ── Email/password user creation ──────────────────────────────────────────────

def create_user(
    db: Session, email: str, password: str, full_name: Optional[str] = None
) -> Optional[User]:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return None
    token = secrets.token_urlsafe(32)
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        is_email_verified=False,
        email_verification_token=token,
        email_verification_token_expires=datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS),
        auth_provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ── Email verification ────────────────────────────────────────────────────────

def send_verification_email(to_email: str, token: str, full_name: Optional[str] = None) -> None:
    """Send email verification link via SMTP. Fails silently if SMTP not configured."""
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured — skipping email verification send.")
        return

    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    name = full_name or "there"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8f9fa; padding:40px 0;">
      <div style="max-width:520px; margin:0 auto; background:white; border-radius:16px; padding:40px; box-shadow:0 1px 6px rgba(0,0,0,.08);">
        <div style="margin-bottom:28px;">
          <span style="font-size:22px; font-weight:700; color:#111;">FinWise AI</span>
        </div>
        <h2 style="color:#111; margin:0 0 8px;">Confirm your email</h2>
        <p style="color:#555; line-height:1.6;">Hi {name}, thanks for signing up! Click the button below to verify your email address.</p>
        <a href="{verify_url}"
           style="display:inline-block; margin:24px 0; padding:14px 32px; background:#2563eb; color:white; font-weight:600; border-radius:10px; text-decoration:none;">
          Verify my email
        </a>
        <p style="color:#999; font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border:none; border-top:1px solid #f0f0f0; margin:24px 0;">
        <p style="color:#bbb; font-size:12px;">Or copy this link: {verify_url}</p>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your FinWise AI account"
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, to_email, msg.as_string())
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", to_email, exc)


def verify_email_token(db: Session, token: str) -> Optional[User]:
    """Verify token, mark user as verified, return user or None."""
    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        return None
    if user.email_verification_token_expires and user.email_verification_token_expires < datetime.utcnow():
        return None
    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    db.commit()
    db.refresh(user)
    return user


def regenerate_verification_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    db.commit()
    return token


# ── Google OAuth ──────────────────────────────────────────────────────────────

async def verify_google_id_token(id_token: str) -> Optional[dict]:
    """
    Verify a Google ID token via Google's tokeninfo endpoint.
    Returns payload or None if invalid.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=10.0,
            )
        if resp.status_code != 200:
            return None
        payload = resp.json()
        # Validate audience matches our client ID
        if settings.google_client_id and payload.get("aud") != settings.google_client_id:
            logger.warning("Google token aud mismatch: %s", payload.get("aud"))
            return None
        return payload
    except Exception as exc:
        logger.error("Google token verification failed: %s", exc)
        return None


def get_or_create_google_user(db: Session, payload: dict) -> User:
    """Find user by google_id or email, or create a new one."""
    google_id = payload["sub"]
    email = payload.get("email", "")
    full_name = payload.get("name")

    # 1. Find by google_id
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        return user

    # 2. Link to existing email account
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.google_id = google_id
        user.auth_provider = "google"
        user.is_email_verified = True
        db.commit()
        db.refresh(user)
        return user

    # 3. Create new user (Google already verified the email)
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=None,
        google_id=google_id,
        auth_provider="google",
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
