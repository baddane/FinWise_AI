import threading
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.services.auth_service import (
    authenticate_user,
    create_user,
    create_access_token,
    send_verification_email,
    verify_email_token,
    regenerate_verification_token,
    verify_google_id_token,
    get_or_create_google_user,
)
from app.config import settings

router = APIRouter()


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None

    class Config:
        from_attributes = True


class GoogleLoginRequest(BaseModel):
    id_token: str


class ResendRequest(BaseModel):
    email: EmailStr


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db, user_data.email, user_data.password, user_data.full_name)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    # Send verification email in background (non-blocking)
    threading.Thread(
        target=send_verification_email,
        args=(user.email, user.email_verification_token, user.full_name),
        daemon=True,
    ).start()
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Block login if email not verified (only when SMTP is configured)
    if not user.is_email_verified and settings.smtp_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = verify_email_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(body: ResendRequest, db: Session = Depends(get_db)):
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    # Always return 200 to avoid email enumeration
    if user and not user.is_email_verified and user.auth_provider == "email":
        new_token = regenerate_verification_token(db, user)
        threading.Thread(
            target=send_verification_email,
            args=(user.email, new_token, user.full_name),
            daemon=True,
        ).start()
    return {"message": "If this email is registered and unverified, a new link has been sent."}


@router.post("/google", response_model=Token)
async def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google login is not configured on this server",
        )
    payload = await verify_google_id_token(body.id_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    user = get_or_create_google_user(db, payload)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}
