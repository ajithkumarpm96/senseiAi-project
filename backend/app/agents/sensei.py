"""
Sensei Agent — The Core Teacher Node

Concepts for your learning:
1. In LangGraph, each agent is just a Python function (called a 'Node').
2. The node receives the current global state (StudyState), reads what it needs,
   calls the LLM with custom persona prompts, and returns updated state fields.
"""
from pathlib import Path
from langchain_core.messages import SystemMessage, AIMessage
from app.core.llm import get_llm
from app.agents.tools.search import duckduckgo_search

# Directory containing our Markdown prompts
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt_template(filename: str) -> str:
    """Reads a markdown prompt file from app/prompts/"""
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


def build_sensei_prompt(
    topic: str = "General",
    chapter: str = "Introduction",
    mood: str = "focused",
    theme: str = "anime",
    study_mode: str = "chill",
    difficulty_level: str = "beginner"
) -> str:
    """
    Combines the base sensei prompt with the user's selected pop culture theme,
    study mode (Serious vs Chill), knowledge level, and current mood.
    """
    base_prompt = load_prompt_template("sensei.md")
    
    # Map theme to overlay file
    theme_file_map = {
        "anime": "sensei_anime.md",
        "marvel": "sensei_marvel.md",
        "harry_potter": "sensei_hp.md"
    }
    overlay_filename = theme_file_map.get(theme.lower(), "sensei_anime.md")
    theme_overlay = load_prompt_template(overlay_filename)

    # Serious Mode vs Chill Mode
    if study_mode == "serious":
        mode_instructions = """## Study Mode: 🎓 SERIOUS (Interview & Production Focus)
- Focus on clean, production-grade code, real-world edge cases, and industry standards.
- Minimize pop culture lore; prioritize technical precision, time/space complexity, and interview best practices.
- Do NOT generate full quizzes (our Challenger agent will handle that); provide clean code demonstrations instead."""
    else:
        mode_instructions = f"""## Study Mode: 🍹 CHILL (Analogies & Lore)
## Pop Culture Flavor Guide ({theme.upper()})
{theme_overlay}
- Use witty metaphors, relatable pop culture analogies, and playful banter to make concepts effortless to grasp."""

    # Knowledge / Difficulty calibration
    diff_key = (difficulty_level or "beginner").lower()
    if diff_key == "advanced":
        diff_instructions = """## Student Knowledge Level: 🔴 ADVANCED / SENIOR
- Treat the student as an experienced peer or senior developer.
- DO NOT waste time on trivial syntax or basic definitions.
- Dive straight into runtime internals, memory layout, concurrency mechanics, architectural bottlenecks, and production trade-offs."""
    elif diff_key == "intermediate":
        diff_instructions = """## Student Knowledge Level: 🟡 INTERMEDIATE
- The student already understands basic syntax and standard coding fundamentals.
- Focus on idiomatic practices, architectural patterns, state management, and real-world system patterns."""
    else:
        diff_instructions = """## Student Knowledge Level: 🟢 BEGINNER (Default — Zero Knowledge)
- Assume the student is starting from absolute zero or has no prior background in this concept.
- Break down concepts step-by-step from first principles.
- Use intuitive, relatable physical analogies before introducing code.
- Explain any technical term immediately so the student never feels lost or overwhelmed."""

    # Mood-specific guidance
    mood_instructions = {
        "chill": "The student is feeling CHILL. Keep tone relaxed, fun, low pressure, lighthearted.",
        "focused": "The student is FOCUSED. Deliver crisp, punchy, insightful technical breakdowns.",
        "tired": "The student is TIRED or BRAIN-FRIED (ADHD low dopamine). Keep explanations super short, ultra simple, use one punchy meme or punchline.",
        "hyped": "The student is HYPED! Match their fiery energy! Use high-excitement enthusiasm!"
    }
    mood_guide = mood_instructions.get(mood.lower(), mood_instructions["focused"])

    return f"""{base_prompt}

{mode_instructions}

{diff_instructions}

## Current Mood Calibration
{mood_guide}

## Tool Usage Rules
- You have access to the `duckduckgo_search` tool.
- If asked about recent syntax (e.g. React 19, Python 3.13+, new ES features) or specific documentation you are not 100% sure about, call `duckduckgo_search` to verify before answering.
- Never output raw JSON of tool calls; use the tool calling mechanism.

Context:
- Subject: {topic}
- Chapter: {chapter}
- Target Level: {diff_key.capitalize()}
"""


async def sensei_node(state: dict) -> dict:
    """
    LangGraph Node for Sensei with tool-calling capabilities.
    """
    topic = state.get("current_topic", "General Programming")
    chapter = state.get("current_chapter", "Chapter 1")
    mood = state.get("mood", "focused")
    theme = state.get("theme", "anime")
    study_mode = state.get("study_mode", "chill")
    difficulty_level = state.get("difficulty_level", "beginner")
    messages = state.get("messages", [])

    system_prompt = build_sensei_prompt(
        topic=topic,
        chapter=chapter,
        mood=mood,
        theme=theme,
        study_mode=study_mode,
        difficulty_level=difficulty_level
    )
    
    full_messages = [SystemMessage(content=system_prompt)] + list(messages)

    # Bind DuckDuckGo search tool to LLM
    llm = get_llm(temperature=0.7, streaming=True)
    llm_with_tools = llm.bind_tools([duckduckgo_search])

    response = await llm_with_tools.ainvoke(full_messages)

    return {
        "messages": [response],
        "agent_type": "sensei"
    }


