from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.financial_service import get_spending_summary, get_budget_status, get_income_vs_expense
from app.services.ai_service import generate_financial_analysis
from app.models.user import User

router = APIRouter()


@router.get("/spending")
async def spending_analysis(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_spending_summary(db, current_user.id, start_date, end_date)
    return summary


@router.get("/budgets")
async def budget_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    status = get_budget_status(db, current_user.id)
    return status


@router.get("/monthly-trends")
async def monthly_trends(
    months: int = Query(default=6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trends = get_income_vs_expense(db, current_user.id, months=months)
    return trends


@router.post("/ai-insights")
async def ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = await generate_financial_analysis(db, current_user.id)
    return {"insights": analysis}
