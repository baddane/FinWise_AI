from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import FinancialProfile
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_profile_advice

router = APIRouter()


class FinancialProfileIn(BaseModel):
    salary: float
    currency: str = "USD"
    employment_type: str | None = None
    country: str | None = None
    city: str | None = None
    num_children: int = 0
    housing_type: str | None = None  # "rent" or "mortgage"
    housing_amount: float | None = None
    food_budget: float | None = None
    transport_budget: float | None = None
    utilities_budget: float | None = None
    other_charges: float | None = None


class FinancialProfileOut(FinancialProfileIn):
    id: int
    user_id: int

    class Config:
        from_attributes = True


@router.get("", response_model=FinancialProfileOut | None)
async def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()


@router.put("", response_model=FinancialProfileOut, status_code=status.HTTP_200_OK)
async def upsert_profile(
    profile_data: FinancialProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if profile:
        for field, value in profile_data.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = FinancialProfile(user_id=current_user.id, **profile_data.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/advice")
async def get_advice(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial profile not found. Please fill in your profile first.",
        )
    advice = await generate_profile_advice(profile)
    return {"advice": advice}
