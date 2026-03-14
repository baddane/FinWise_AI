"""
Dave Ramsey Baby Steps logic.

Step detection rules:
  BS1 — Save $1,000 starter emergency fund
  BS2 — Pay off all non-mortgage debt (snowball: smallest to largest)
  BS3 — Save 3-6 months of expenses as full emergency fund
  BS4 — Invest 15% of income toward retirement
  BS5 — Save for children's college (if applicable)
  BS6 — Pay off home mortgage early
  BS7 — Build wealth and give

We auto-detect BS1/BS2/BS3 from DB data.
BS4-7 require user confirmation (stored as completed flags on SavingsGoal).
"""
from sqlalchemy.orm import Session
from app.models.ramsey import Debt, SavingsGoal
from app.services.financial_service import get_income_vs_expense

BS1_TARGET = 1000.0


def get_monthly_expenses(db: Session, user_id: int) -> float:
    """Average monthly expenses over the last 3 months."""
    trends = get_income_vs_expense(db, user_id, months=3)
    if not trends:
        return 0.0
    total = sum(t["expenses"] for t in trends)
    return total / len(trends)


def get_debts(db: Session, user_id: int) -> list[dict]:
    debts = db.query(Debt).filter(Debt.user_id == user_id).order_by(Debt.balance).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "balance": d.balance,
            "original_balance": d.original_balance,
            "minimum_payment": d.minimum_payment,
            "interest_rate": d.interest_rate,
            "debt_type": d.debt_type,
            "is_paid_off": d.is_paid_off,
            "snowball_order": i + 1,  # smallest balance = #1 (Ramsey method)
        }
        for i, d in enumerate(debts)
        if not d.is_paid_off
    ] + [
        {
            "id": d.id,
            "name": d.name,
            "balance": d.balance,
            "original_balance": d.original_balance,
            "minimum_payment": d.minimum_payment,
            "interest_rate": d.interest_rate,
            "debt_type": d.debt_type,
            "is_paid_off": d.is_paid_off,
            "snowball_order": None,
        }
        for d in debts
        if d.is_paid_off
    ]


def get_savings_goals(db: Session, user_id: int) -> list[dict]:
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "step_type": g.step_type,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "is_completed": g.is_completed,
            "progress_pct": round(min(g.current_amount / g.target_amount * 100, 100), 1)
            if g.target_amount > 0 else 0,
        }
        for g in goals
    ]


def detect_current_step(db: Session, user_id: int) -> dict:
    """
    Detect which Baby Step the user is currently on.
    Returns full status for the UI.
    """
    monthly_expenses = get_monthly_expenses(db, user_id)
    all_debts = db.query(Debt).filter(Debt.user_id == user_id).all()
    non_mortgage_debts = [d for d in all_debts if d.debt_type != "mortgage" and not d.is_paid_off]
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()

    goals_by_type = {g.step_type: g for g in goals}
    bs1_goal = goals_by_type.get("bs1")
    bs3_goal = goals_by_type.get("bs3")
    bs4_done = any(g.step_type == "bs4" and g.is_completed for g in goals)
    bs5_done = any(g.step_type == "bs5" and g.is_completed for g in goals)
    bs6_done = any(g.step_type == "bs6" and g.is_completed for g in goals)

    # --- determine completed steps ---
    bs1_complete = bool(bs1_goal and bs1_goal.current_amount >= BS1_TARGET)
    bs2_complete = bs1_complete and len(non_mortgage_debts) == 0
    bs3_target = monthly_expenses * 3 if monthly_expenses > 0 else BS1_TARGET * 3
    bs3_complete = bs2_complete and bool(bs3_goal and bs3_goal.current_amount >= bs3_goal.target_amount)

    # --- current step ---
    if not bs1_complete:
        current = 1
    elif not bs2_complete:
        current = 2
    elif not bs3_complete:
        current = 3
    elif not bs4_done:
        current = 4
    elif not bs5_done:
        current = 5
    elif not bs6_done:
        current = 6
    else:
        current = 7

    # --- BS2 snowball next target ---
    snowball_target = None
    if current == 2 and non_mortgage_debts:
        # smallest balance first
        snowball_target = min(non_mortgage_debts, key=lambda d: d.balance)
        snowball_target = {"id": snowball_target.id, "name": snowball_target.name, "balance": snowball_target.balance}

    # --- BS3 target ---
    bs3_target_amount = round(monthly_expenses * 3, 2) if monthly_expenses > 0 else BS1_TARGET * 3
    bs3_full_target = round(monthly_expenses * 6, 2) if monthly_expenses > 0 else BS1_TARGET * 6

    return {
        "current_step": current,
        "monthly_expenses_avg": round(monthly_expenses, 2),
        "steps": [
            {
                "step": 1,
                "title": "Starter Emergency Fund",
                "description": "Save $1,000 as a starter emergency fund",
                "is_complete": bs1_complete,
                "target": BS1_TARGET,
                "current": bs1_goal.current_amount if bs1_goal else 0.0,
                "progress_pct": round(min((bs1_goal.current_amount if bs1_goal else 0) / BS1_TARGET * 100, 100), 1),
            },
            {
                "step": 2,
                "title": "Debt Snowball",
                "description": "Pay off all non-mortgage debts smallest to largest",
                "is_complete": bs2_complete,
                "total_debt": round(sum(d.balance for d in non_mortgage_debts), 2),
                "debts_remaining": len(non_mortgage_debts),
                "snowball_target": snowball_target,
            },
            {
                "step": 3,
                "title": "Full Emergency Fund",
                "description": "Save 3 to 6 months of expenses",
                "is_complete": bs3_complete,
                "target_3months": bs3_target_amount,
                "target_6months": bs3_full_target,
                "current": bs3_goal.current_amount if bs3_goal else 0.0,
                "progress_pct": round(
                    min((bs3_goal.current_amount if bs3_goal else 0) / bs3_target_amount * 100, 100), 1
                ) if bs3_target_amount > 0 else 0,
            },
            {
                "step": 4,
                "title": "Invest 15% for Retirement",
                "description": "Invest 15% of household income into RRSP, 401k or Roth IRA",
                "is_complete": bs4_done,
            },
            {
                "step": 5,
                "title": "College Fund for Children",
                "description": "Save for children's education (RESP, 529 plan)",
                "is_complete": bs5_done,
            },
            {
                "step": 6,
                "title": "Pay Off Home Early",
                "description": "Make extra mortgage payments to pay it off faster",
                "is_complete": bs6_done,
            },
            {
                "step": 7,
                "title": "Build Wealth and Give",
                "description": "Invest, give generously, and leave a legacy",
                "is_complete": current == 7,
            },
        ],
    }
