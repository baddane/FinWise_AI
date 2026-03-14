from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)           # ex: "Visa", "Prêt auto"
    balance = Column(Float, nullable=False)         # solde actuel
    original_balance = Column(Float, nullable=True) # solde de départ
    minimum_payment = Column(Float, nullable=True)  # paiement minimum mensuel
    interest_rate = Column(Float, nullable=True)    # taux d'intérêt %
    debt_type = Column(String, nullable=False, default="other")
    # credit_card | student | car | medical | personal | mortgage | other
    is_paid_off = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="debts")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    step_type = Column(String, nullable=False)  # bs1 | bs3 | custom
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")
