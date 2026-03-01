import json
from typing import Optional
from sqlalchemy.orm import Session
import anthropic

from app.config import settings
from app.services.financial_service import get_spending_summary, get_budget_status, get_income_vs_expense

def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


SYSTEM_PROMPT = """You are FinWise, an expert AI financial advisor. You help users:
- Analyze their spending patterns and provide actionable insights
- Create and manage budgets effectively
- Track and optimize their savings
- Make informed investment decisions
- Achieve their financial goals

You have access to the user's financial data and provide personalized, specific advice.
Always be encouraging, practical, and data-driven. Format responses clearly with bullet points
or numbered lists when appropriate. Keep responses concise but comprehensive."""


async def chat_with_ai(
    db: Session,
    user_id: int,
    message: str,
    conversation_history: list[dict],
) -> tuple[str, list[dict]]:
    financial_context = _get_financial_context(db, user_id)

    messages = conversation_history.copy()
    messages.append({"role": "user", "content": message})

    system_with_context = f"{SYSTEM_PROMPT}\n\nUser's Current Financial Context:\n{financial_context}"

    response = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_with_context,
        messages=messages,
    )

    assistant_message = response.content[0].text
    messages.append({"role": "assistant", "content": assistant_message})

    return assistant_message, messages


async def generate_financial_analysis(db: Session, user_id: int) -> str:
    financial_context = _get_financial_context(db, user_id)

    response = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"""Based on my financial data below, provide a comprehensive analysis with:
1. Key spending insights
2. Budget performance review
3. Top 3 actionable recommendations to improve my finances

Financial Data:
{financial_context}""",
            }
        ],
    )

    return response.content[0].text


def _get_financial_context(db: Session, user_id: int) -> str:
    spending = get_spending_summary(db, user_id)
    budgets = get_budget_status(db, user_id)
    monthly = get_income_vs_expense(db, user_id, months=3)

    context = {
        "spending_summary": spending,
        "budget_status": budgets,
        "monthly_trends": monthly,
    }
    return json.dumps(context, indent=2, default=str)
