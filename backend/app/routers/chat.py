from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.database import get_db
from sqlalchemy.orm import Session
from app.services.auth_service import get_current_user
from app.services.ai_service import chat_with_ai
from app.models.user import User

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    conversation_history: list[dict]


@router.post("", response_model=ChatResponse)
async def chat(
    chat_data: ChatMessage,
    lang: str = Query(default="en"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response, updated_history = await chat_with_ai(
        db=db,
        user_id=current_user.id,
        message=chat_data.message,
        conversation_history=chat_data.conversation_history,
        lang=lang,
    )
    return {"response": response, "conversation_history": updated_history}
