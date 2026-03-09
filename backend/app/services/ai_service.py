import json
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.config import settings
from app.services.financial_service import get_spending_summary, get_budget_status, get_income_vs_expense


def _get_model(system_instruction: str, max_tokens: int = 1024) -> genai.GenerativeModel:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
    )


SYSTEM_PROMPT = """You are FinWise, an expert AI financial advisor. You help users:
- Analyze their spending patterns and provide actionable insights
- Create and manage budgets effectively
- Track and optimize their savings
- Make informed investment decisions
- Achieve their financial goals

You have access to the user's financial data and provide personalized, specific advice.
Always be encouraging, practical, and data-driven. Format responses clearly with bullet points
or numbered lists when appropriate. Keep responses concise but comprehensive."""


def _to_gemini_history(messages: list[dict]) -> list[dict]:
    """Convert {role: user/assistant, content: str} to Gemini format."""
    result = []
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        result.append({"role": role, "parts": [msg["content"]]})
    return result


async def chat_with_ai(
    db: Session,
    user_id: int,
    message: str,
    conversation_history: list[dict],
) -> tuple[str, list[dict]]:
    financial_context = _get_financial_context(db, user_id)
    system_with_context = f"{SYSTEM_PROMPT}\n\nUser's Current Financial Context:\n{financial_context}"

    model = _get_model(system_with_context, max_tokens=1024)
    chat = model.start_chat(history=_to_gemini_history(conversation_history))
    response = chat.send_message(message)

    assistant_message = response.text
    updated_history = conversation_history.copy()
    updated_history.append({"role": "user", "content": message})
    updated_history.append({"role": "assistant", "content": assistant_message})

    return assistant_message, updated_history


async def generate_financial_analysis(db: Session, user_id: int) -> str:
    financial_context = _get_financial_context(db, user_id)

    model = _get_model(SYSTEM_PROMPT, max_tokens=2048)
    prompt = f"""Based on my financial data below, provide a comprehensive analysis with:
1. Key spending insights
2. Budget performance review
3. Top 3 actionable recommendations to improve my finances

Financial Data:
{financial_context}"""

    response = model.generate_content(prompt)
    return response.text


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
