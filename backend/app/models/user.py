from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)   # nullable for Google-only accounts
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    # Email verification
    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(100), nullable=True, index=True)
    email_verification_token_expires = Column(DateTime, nullable=True)

    # OAuth
    google_id = Column(String(128), nullable=True, unique=True, index=True)
    auth_provider = Column(String(20), default="email")  # "email" | "google"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    debts = relationship("Debt", back_populates="user")
    savings_goals = relationship("SavingsGoal", back_populates="user")
    financial_profile = relationship("FinancialProfile", back_populates="user", uselist=False)
