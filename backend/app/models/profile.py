from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Income
    salary = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    employment_type = Column(String(50), nullable=True)  # employed, freelance, business_owner, retired, student

    # Location
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)

    # Family
    num_children = Column(Integer, default=0)

    # Housing
    housing_type = Column(String(20), nullable=True)  # rent or mortgage
    housing_amount = Column(Float, nullable=True)

    # Monthly charges
    food_budget = Column(Float, nullable=True)
    transport_budget = Column(Float, nullable=True)
    utilities_budget = Column(Float, nullable=True)
    other_charges = Column(Float, nullable=True)
    # Custom charges: [{"name": "Netflix", "amount": 15.99}, ...]
    custom_charges = Column(JSON, nullable=True, default=list)

    # Savings
    savings_monthly = Column(Float, nullable=True)   # Monthly savings contribution
    savings_goal = Column(Float, nullable=True)       # Total savings target

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="financial_profile")
