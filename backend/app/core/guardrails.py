from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.db_models import TokenUsage


class BudgetError(Exception):
    """Raised when a budget limit or guardrail is exceeded"""
    pass


async def check_budget(user_id: int, db: Session) -> bool:
    """
    Check if the user has budget remaining for an LLM call.
    Called BEFORE every LLM request.
    
    Returns True if OK, raises BudgetError if not.
    """
    # 1. Kill switch check
    if settings.KILL_SWITCH_ACTIVE:
        raise BudgetError("LLM calls are disabled by admin (kill switch is ON)")

    # 2. Daily token limit check
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    usage = db.query(TokenUsage).filter(
        TokenUsage.user_id == user_id,
        TokenUsage.date == today_str
    ).first()

    if usage:
        total_today = usage.input_tokens + usage.output_tokens
        if total_today >= settings.DAILY_TOKEN_LIMIT:
            raise BudgetError(
                f"Daily limit of {settings.DAILY_TOKEN_LIMIT:,} tokens reached for today ({total_today:,} used). Reset at midnight UTC."
            )

    return True


def record_token_usage(user_id: int, input_tokens: int, output_tokens: int, db: Session):
    """
    Records token usage for a user on the current date and calculates estimated USD cost.
    Standard Gemini Flash Pricing:
      Input:  $0.075 per 1M tokens ($0.000000075 / token)
      Output: $0.30  per 1M tokens ($0.000000300 / token)
    """
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    usage = db.query(TokenUsage).filter(
        TokenUsage.user_id == user_id,
        TokenUsage.date == today_str
    ).first()

    cost_this_turn = (input_tokens * 0.000000075) + (output_tokens * 0.0000003)

    if not usage:
        usage = TokenUsage(
            user_id=user_id,
            date=today_str,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=cost_this_turn
        )
        db.add(usage)
    else:
        usage.input_tokens += input_tokens
        usage.output_tokens += output_tokens
        usage.estimated_cost_usd += cost_this_turn

    db.commit()

