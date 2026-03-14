import json
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.config import settings
from app.services.financial_service import get_spending_summary, get_budget_status, get_income_vs_expense
from app.services.ramsey_service import detect_current_step


def _get_model(system_instruction: str, max_tokens: int = 1024) -> genai.GenerativeModel:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
    )


SYSTEM_PROMPT = """You are FinWise, an AI financial advisor who follows Dave Ramsey's Baby Steps methodology.

Dave Ramsey's 7 Baby Steps:
  BS1 — Save $1,000 starter emergency fund (fast, no matter what)
  BS2 — Pay off all non-mortgage debt using the Debt Snowball (smallest balance first)
  BS3 — Save 3-6 months of expenses as a full emergency fund
  BS4 — Invest 15% of household income for retirement (RRSP, 401k, Roth IRA)
  BS5 — Save for children's college fund (RESP, 529)
  BS6 — Pay off home mortgage early
  BS7 — Build wealth and give generously

Core Ramsey principles you always enforce:
- Do Baby Steps IN ORDER. Never invest (BS4) before being debt-free (BS2 done).
- Cash is king. No new debt, ever. Cut up credit cards.
- Budget every dollar. Zero-based budget: income - all expenses = $0.
- Debt Snowball: attack smallest debt first for psychological wins.
- Emergency fund before anything else.
- Intensity and sacrifice now = freedom later. "Live like no one else, so later you can live like no one else."

You know the user's current Baby Step from their financial data.
Always give advice specific to their current step. Be encouraging but direct — like Ramsey himself.
Format responses with bullet points when appropriate. Keep it concise and actionable."""


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


async def generate_profile_advice(profile) -> str:
    """Generate personalized financial management advice based on user's financial profile."""
    total_charges = sum(filter(None, [
        profile.housing_amount,
        profile.food_budget,
        profile.transport_budget,
        profile.utilities_budget,
        profile.other_charges,
    ]))
    disposable = profile.salary - total_charges
    savings_rate = (disposable / profile.salary * 100) if profile.salary > 0 else 0

    profile_summary = f"""
User Financial Profile:
- Monthly Net Salary: {profile.salary} {profile.currency}
- Employment Type: {profile.employment_type or "Not specified"}
- Location: {profile.city or "?"}, {profile.country or "?"}
- Number of Children: {profile.num_children}
- Housing: {profile.housing_type or "not specified"} — {profile.housing_amount} {profile.currency}/month
- Food Budget: {profile.food_budget or 0} {profile.currency}/month
- Transport Budget: {profile.transport_budget or 0} {profile.currency}/month
- Utilities (electricity, internet, etc.): {profile.utilities_budget or 0} {profile.currency}/month
- Other Charges: {profile.other_charges or 0} {profile.currency}/month
- Total Monthly Charges: {total_charges:.2f} {profile.currency}
- Estimated Disposable Income: {disposable:.2f} {profile.currency}
- Current Savings Rate: {savings_rate:.1f}%
"""

    system = """You are FinWise, an expert personal finance advisor with deep knowledge of budgeting, savings strategies, and financial planning adapted to different countries, currencies, and family situations.

Your role is to analyze a user's complete financial situation and provide:
1. A clear monthly budget breakdown with percentages
2. An honest assessment of their financial health
3. Concrete, actionable recommendations tailored to their specific situation (country, family size, income level)
4. Priority actions to improve their finances immediately
5. Mid and long-term financial goals to aim for

Always adapt your advice to the user's local context (country-specific tax benefits, savings accounts, investment vehicles).
Be direct, practical and encouraging. Use bullet points and clear sections. Respond in the same language the user's country implies OR default to English."""

    model = _get_model(system, max_tokens=2048)
    prompt = f"""{profile_summary}

Based on this financial profile, please provide:

## 1. Budget Analysis
Break down how the income is currently allocated (%) and compare to the recommended 50/30/20 rule or equivalent.

## 2. Financial Health Assessment
Give an honest score (1-10) with explanation.

## 3. Top 5 Personalized Recommendations
Specific, actionable advice adapted to their country, family size, and income level.

## 4. Priority Action Plan
What to do THIS MONTH to improve their finances.

## 5. Savings & Investment Targets
Realistic monthly savings goals and where to put them (adapted to their country)."""

    response = model.generate_content(prompt)
    return response.text


def _get_financial_context(db: Session, user_id: int) -> str:
    spending = get_spending_summary(db, user_id)
    budgets = get_budget_status(db, user_id)
    monthly = get_income_vs_expense(db, user_id, months=3)
    baby_steps = detect_current_step(db, user_id)

    context = {
        "baby_steps_status": {
            "current_step": baby_steps["current_step"],
            "monthly_expenses_avg": baby_steps["monthly_expenses_avg"],
            "current_step_details": baby_steps["steps"][baby_steps["current_step"] - 1],
        },
        "spending_summary": spending,
        "budget_status": budgets,
        "monthly_trends": monthly,
    }
    return json.dumps(context, indent=2, default=str)
