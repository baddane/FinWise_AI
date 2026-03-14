from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.ramsey_service import detect_current_step, get_debts, get_savings_goals
from app.models.ramsey import Debt, SavingsGoal
from app.models.user import User

router = APIRouter()


# ── Baby Steps status ─────────────────────────────────────────────────────────

@router.get("/status")
def baby_steps_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return detect_current_step(db, current_user.id)


# ── Debts ─────────────────────────────────────────────────────────────────────

class DebtCreate(BaseModel):
    name: str
    balance: float
    original_balance: Optional[float] = None
    minimum_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    debt_type: str = "other"


class DebtUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None
    minimum_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    is_paid_off: Optional[bool] = None


@router.get("/debts")
def list_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_debts(db, current_user.id)


@router.post("/debts", status_code=201)
def create_debt(
    body: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = Debt(
        user_id=current_user.id,
        name=body.name,
        balance=body.balance,
        original_balance=body.original_balance or body.balance,
        minimum_payment=body.minimum_payment,
        interest_rate=body.interest_rate,
        debt_type=body.debt_type,
    )
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.patch("/debts/{debt_id}")
def update_debt(
    debt_id: int,
    body: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(debt, field, value)
    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/debts/{debt_id}", status_code=204)
def delete_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    db.delete(debt)
    db.commit()


# ── Savings Goals ─────────────────────────────────────────────────────────────

class SavingsGoalCreate(BaseModel):
    name: str
    step_type: str  # bs1 | bs3 | bs4 | bs5 | bs6 | custom
    target_amount: float
    current_amount: float = 0.0


class SavingsGoalUpdate(BaseModel):
    current_amount: Optional[float] = None
    target_amount: Optional[float] = None
    is_completed: Optional[bool] = None


@router.get("/goals")
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_savings_goals(db, current_user.id)


@router.post("/goals", status_code=201)
def create_goal(
    body: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = SavingsGoal(
        user_id=current_user.id,
        name=body.name,
        step_type=body.step_type,
        target_amount=body.target_amount,
        current_amount=body.current_amount,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/goals/{goal_id}")
def update_goal(
    goal_id: int,
    body: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
