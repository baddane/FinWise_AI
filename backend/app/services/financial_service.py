from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget


def get_spending_summary(
    db: Session,
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> dict:
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense,
    )
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)

    transactions = query.all()
    total = sum(t.amount for t in transactions)

    by_category: dict[str, float] = {}
    for t in transactions:
        category_name = t.category.name if t.category else "Uncategorized"
        by_category[category_name] = by_category.get(category_name, 0) + t.amount

    return {
        "total_expenses": total,
        "transaction_count": len(transactions),
        "by_category": by_category,
        "period": {
            "start": start_date.isoformat() if start_date else None,
            "end": end_date.isoformat() if end_date else None,
        },
    }


def get_budget_status(db: Session, user_id: int) -> list[dict]:
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    results = []

    for budget in budgets:
        spent_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.expense,
            Transaction.date >= budget.start_date,
        )
        if budget.category_id:
            spent_query = spent_query.filter(Transaction.category_id == budget.category_id)
        if budget.end_date:
            spent_query = spent_query.filter(Transaction.date <= budget.end_date)

        spent = spent_query.scalar() or 0.0
        remaining = budget.amount - spent
        percentage_used = (spent / budget.amount * 100) if budget.amount > 0 else 0

        results.append({
            "budget_id": budget.id,
            "name": budget.name,
            "amount": budget.amount,
            "spent": spent,
            "remaining": remaining,
            "percentage_used": round(percentage_used, 2),
            "period": budget.period,
            "is_over_budget": spent > budget.amount,
        })

    return results


def get_income_vs_expense(db: Session, user_id: int, months: int = 6) -> list[dict]:
    from datetime import timedelta
    now = datetime.utcnow()
    results = []

    for i in range(months - 1, -1, -1):
        month_start = now.replace(day=1) - timedelta(days=30 * i)
        month_start = month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            month_end = now
        else:
            month_end = (month_start.replace(month=month_start.month + 1)
                         if month_start.month < 12
                         else month_start.replace(year=month_start.year + 1, month=1))

        income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.income,
            Transaction.date >= month_start,
            Transaction.date < month_end,
        ).scalar() or 0.0

        expenses = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.expense,
            Transaction.date >= month_start,
            Transaction.date < month_end,
        ).scalar() or 0.0

        results.append({
            "month": month_start.strftime("%Y-%m"),
            "income": income,
            "expenses": expenses,
            "net": income - expenses,
        })

    return results
