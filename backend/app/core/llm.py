"""
LLM Provider — Model-Agnostic LLM Wrapper

Why this matters for your learning:
Instead of hardcoding Gemini calls everywhere in the app,
we route everything through this single get_llm() factory.

If you ever want to switch from Gemini Flash to Claude, GPT-4o, or local Ollama,
you only change it here in this ONE file. The rest of the LangGraph agents
and backend won't even notice.
"""
from app.core.config import settings


def get_llm(temperature: float = 0.7, streaming: bool = True):
    """
    Returns an instance of the configured LLM (Groq or Gemini).
    
    Args:
        temperature: Controls randomness/creativity (0.0 = strict & factual, 1.0 = creative & wild).
                     0.7 is the sweet spot for humorous analogies and witty explanations.
        streaming: When True, allows token-by-token streaming via SSE.
    """
    provider = getattr(settings, "LLM_PROVIDER", "openrouter").lower()

    if provider == "openrouter":
        openrouter_key = getattr(settings, "OPENROUTER_API_KEY", "")
        if not openrouter_key:
            raise ValueError("OPENROUTER_API_KEY is not set in backend/.env! Get your key at https://openrouter.ai/keys")

        from langchain_openai import ChatOpenAI
        model = settings.LLM_MODEL if settings.LLM_MODEL else "qwen/qwen3.8-27b:free"
        max_tokens = getattr(settings, "PER_REQUEST_MAX_TOKENS", 4000)
        return ChatOpenAI(
            model=model,
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=temperature,
            streaming=streaming,
            max_tokens=max_tokens,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "SenseiAI",
            }
        )

    elif provider == "groq":
        groq_key = getattr(settings, "GROQ_API_KEY", "")
        if not groq_key:
            raise ValueError("GROQ_API_KEY is not set in backend/.env! Get a free key at https://console.groq.com/")
        
        from langchain_groq import ChatGroq
        model = settings.LLM_MODEL if settings.LLM_MODEL else "openai/gpt-oss-120b"
        return ChatGroq(
            model=model,
            groq_api_key=groq_key,
            temperature=temperature,
            streaming=streaming,
        )

    else:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in backend/.env!")

        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=temperature,
            streaming=streaming,
        )
