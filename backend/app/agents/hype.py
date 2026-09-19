from langchain_core.messages import SystemMessage
from app.core.llm import get_llm

HYPE_SYSTEM_PROMPT = """You are the Hype Agent in SenseiAI.
Your role is to celebrate student wins, milestones, and correct quiz answers with pure dopamine and enthusiasm!

GUIDELINES:
- Keep it punchy (2 to 4 sentences maximum).
- Tie celebrations to their chosen pop culture theme (e.g. unlocking a new Saiyan form, assembling an Infinity Stone, earning House Points).
- Acknowledge their hard work and hype them up for the next challenge.
- Use emojis and radiant positive energy!
"""

async def hype_node(state: dict) -> dict:
    topic = state.get("current_topic", "Programming")
    chapter = state.get("current_chapter", "Chapter")
    theme = state.get("theme", "anime")
    messages = state.get("messages", [])

    context = f"""{HYPE_SYSTEM_PROMPT}
Pop Culture Theme: {theme}
Current Topic: {topic}
Current Chapter: {chapter}

The student just passed a challenge or cleared a concept! Drop an electric, motivating celebration!"""

    full_messages = [SystemMessage(content=context)] + list(messages[-4:])
    llm = get_llm(temperature=0.8, streaming=True)
    response = await llm.ainvoke(full_messages)

    return {
        "messages": [response],
        "agent_type": "hype"
    }