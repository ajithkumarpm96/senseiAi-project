"""
Chapter Generation Tool — AI Curriculum Architect

Concepts for your learning:
1. Structured AI Output: We instruct the LLM to output valid JSON with two tiers:
   - "core_chapters": Non-negotiable, essential fundamentals for this topic.
   - "optional_chapters": Electives, advanced deep dives, or niche topics.
2. Robust Parsing: We strip any accidental markdown fences (```json ... ```)
   and parse it safely into Python dictionaries.
"""
import re
import json
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.llm import get_llm


def clean_chapter_title(title: str) -> str:
    """
    Cleans a chapter title to be concise, professional, and free of double numbering
    or long roleplay/metaphor prefixes.
    
    Examples:
    - 'Chapter 1: Ninja Academy Basics - Variables & Scope' -> 'Variables & Scope'
    - '6. Bankai Activation: WebSockets & Real-Time' -> 'WebSockets & Real-Time'
    - '1. JavaScript Fundamentals' -> 'JavaScript Fundamentals'
    """
    if not title:
        return ""
    t = title.strip().strip('"\'*`')
    # Remove leading Chapter X: or X. or X: or X -
    t = re.sub(r'^(?:Chapter\s*\d+[\s:.-]*|\d+[\s:.-]+)\s*', '', t, flags=re.IGNORECASE).strip()
    
    # If the title contains a roleplay/analogy delimiter (' - ' or ': '), extract the real tech topic
    if ' - ' in t:
        parts = t.split(' - ', 1)
        if len(parts[1].strip()) >= 4:
            t = parts[1].strip()
    elif ': ' in t:
        parts = t.split(': ', 1)
        if len(parts[1].strip()) >= 4:
            t = parts[1].strip()

    t = re.sub(r'^(?:Chapter\s*\d+[\s:.-]*|\d+[\s:.-]+)\s*', '', t, flags=re.IGNORECASE).strip()
    return t


def verify_and_refine_curriculum(core: list, optional: list, topic_title: str) -> dict:
    """
    Validates and standardizes generated chapters:
    - Strips numbering and metaphors
    - Deduplicates titles
    - Ensures clean, concise standard titles
    """
    cleaned_core = []
    seen = set()

    for item in core:
        cleaned = clean_chapter_title(str(item))
        norm = cleaned.lower()
        if cleaned and norm not in seen:
            cleaned_core.append(cleaned)
            seen.add(norm)

    cleaned_optional = []
    for item in optional:
        cleaned = clean_chapter_title(str(item))
        norm = cleaned.lower()
        if cleaned and norm not in seen:
            cleaned_optional.append(cleaned)
            seen.add(norm)

    # Fallback if too few core chapters were produced
    if len(cleaned_core) < 3:
        fallbacks = [
            f"{topic_title} Fundamentals & Syntax",
            "Control Flow & Data Structures",
            "Functions, Scope & Modularity",
            "Asynchronous Operations & APIs",
            "Advanced Patterns & Architecture"
        ]
        for fb in fallbacks:
            if fb.lower() not in seen:
                cleaned_core.append(fb)
                seen.add(fb.lower())

    return {
        "core_chapters": cleaned_core[:6],
        "optional_chapters": cleaned_optional[:6]
    }


async def generate_chapters_for_project(
    topic_title: str,
    topic_description: str = "",
    theme: str = "anime",
    difficulty_level: str = "beginner"
) -> dict:
    """
    Analyzes a subject and returns a deterministic, verified roadmap calibrated to the user's knowledge level:
    - 4 to 6 core/mandatory chapters (clean, professional technical names)
    - 4 to 6 optional/elective chapters
    
    Difficulty calibration:
    - 'beginner': Starts at absolute zero, essential fundamentals, core building blocks, zero assumed jargon.
    - 'intermediate': Skips trivial syntax; focuses on real-world patterns, architecture, and idiomatic practices.
    - 'advanced': Dives straight into engine/memory internals, concurrency, performance tuning, and edge cases.
    """
    # Use temperature=0.0 for consistent, reproducible curriculum generation
    llm = get_llm(temperature=0.0, streaming=False)

    level_key = (difficulty_level or "beginner").lower().strip()
    if level_key == "intermediate":
        level_guidelines = """TARGET KNOWLEDGE LEVEL: INTERMEDIATE
- Assume student already knows basic syntax, commands, and simple usage.
- DO NOT start with 'Introduction to...' or basic installation.
- Chapter 1 MUST begin with practical patterns, modular architecture, or idiomatic core techniques.
- Progress to production workflows, API integration, state management, and real-world system patterns."""
    elif level_key == "advanced":
        level_guidelines = """TARGET KNOWLEDGE LEVEL: ADVANCED / EXPERT
- The student is a professional engineer. DO NOT waste time on basics or common patterns.
- Chapter 1 MUST dive straight into runtime internals, memory layout, compilation/execution mechanics, or concurrency.
- Progress through low-level performance profiling, distributed edge cases, security hardening, and deep architectural trade-offs."""
    else:
        level_guidelines = """TARGET KNOWLEDGE LEVEL: BEGINNER (Default — Zero Assumed Knowledge)
- Assume student has zero prior knowledge or is learning this topic for the first time.
- Chapter 1 MUST begin with the absolute foundation, core mental model, and fundamental syntax/building blocks.
- Build up step-by-step progressively without steep difficulty spikes."""

    system_prompt = f"""You are a Principal Curriculum Architect and Technical Director.
Your task is to break down the given study topic into a progressive, crystal-clear, industry-standard syllabus.

{level_guidelines}

CRITICAL RULES FOR CHAPTER TITLES:
1. Output REAL, CONCISE technical topic names (e.g. "Variables & Data Types", "Functions & Scope", "DOM Manipulation", "Promises & Async/Await", "Classes & OOP").
2. DO NOT include numbers or prefixes like "Chapter 1:" or "1.".
3. DO NOT include pop-culture metaphors or roleplay lore in the syllabus titles (e.g., NO "Ninja Academy Basics - ...", NO "Bankai Activation: ..."). Metaphors and lore are handled exclusively inside the chat by Sensei.
4. Keep each title punchy and readable: between 2 and 6 words.

Divide into two tiers:
1. "core_chapters": 4 to 6 ESSENTIAL progressive milestones in standard logical learning order (calibrated to the target knowledge level).
2. "optional_chapters": 4 to 6 valuable elective topics, deep dives, or practical extensions.

Output ONLY valid JSON with this exact schema (no markdown, no conversational commentary):
{{
  "core_chapters": ["Core Topic 1", "Core Topic 2", "Core Topic 3", "Core Topic 4", "Core Topic 5"],
  "optional_chapters": ["Elective Topic 1", "Elective Topic 2", "Elective Topic 3", "Elective Topic 4"]
}}
"""

    user_prompt = f"""Topic: {topic_title}
Context / Description: {topic_description or 'Mastering this subject'}
Knowledge Level: {level_key.capitalize()}

Generate the core and optional chapters in pure JSON:"""

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ])

    raw_text = response.content.strip()

    # Clean markdown if present
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
        core = data.get("core_chapters", [])
        optional = data.get("optional_chapters", [])
        return verify_and_refine_curriculum(core, optional, topic_title)
    except Exception as e:
        # Verified fallback if parsing fails
        return verify_and_refine_curriculum([], [
            f"Advanced {topic_title} Internals",
            f"Performance Optimization in {topic_title}",
            f"Testing & Tooling"
        ], topic_title)


