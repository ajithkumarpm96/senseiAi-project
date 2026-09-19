"""
Admin Routes — Kill switch and cost tracking.

These routes let you:
1. See how many tokens have been used (and estimated cost)
2. Toggle the kill switch to immediately stop all LLM calls
3. View rate limit status

⚠️ In production, these should be restricted to admin users only.
For v1, we trust that only you have the login credentials.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, TokenUsage
from app.models.schemas import KillSwitchToggle

router = APIRouter()


@router.get("/status")
def get_admin_status(current_user: User = Depends(get_current_user)):
    """Get the current system status — kill switch, limits, etc."""
    return {
        "kill_switch_active": settings.KILL_SWITCH_ACTIVE,
        "daily_token_limit": settings.DAILY_TOKEN_LIMIT,
        "monthly_token_limit": settings.MONTHLY_TOKEN_LIMIT,
        "rate_limit_per_hour": settings.RATE_LIMIT_PER_HOUR,
    }


@router.post("/kill-switch")
def toggle_kill_switch(
    toggle: KillSwitchToggle,
    current_user: User = Depends(get_current_user)
):
    """Toggle the kill switch ON/OFF"""
    settings.KILL_SWITCH_ACTIVE = toggle.active
    return {
        "kill_switch_active": settings.KILL_SWITCH_ACTIVE,
        "message": "🚨 Kill switch ACTIVATED — all LLM calls blocked" if toggle.active 
                   else "✅ Kill switch deactivated — LLM calls allowed"
    }


@router.get("/usage")
def get_token_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get token usage stats for the current user"""
    usage_records = db.query(TokenUsage).filter(
        TokenUsage.user_id == current_user.id
    ).order_by(TokenUsage.date.desc()).limit(30).all()
    
    total_input = sum(r.input_tokens for r in usage_records)
    total_output = sum(r.output_tokens for r in usage_records)
    total_cost = sum(r.estimated_cost_usd for r in usage_records)
    
    return {
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_estimated_cost_usd": round(total_cost, 4),
        "daily_breakdown": [
            {
                "date": r.date,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "estimated_cost_usd": r.estimated_cost_usd
            }
            for r in usage_records
        ]
    }
