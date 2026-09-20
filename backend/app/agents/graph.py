"""
LangGraph Multi-Agent Orchestrator — StateGraph

Key concepts for your learning:
1. StateGraph: The master blueprint defining state structure, agent nodes, and transition paths.
2. State (StudyState): A shared dictionary holding messages, topic, mood, and theme.
3. add_messages: A LangGraph reducer. When a node returns {"messages": [response]},
   it automatically APPENDS the response rather than wiping out the previous messages!
4. MemorySaver: In-memory checkpointer that tracks conversation threads per session.
"""
from typing import TypedDict, Annotated, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

from langgraph.prebuilt import ToolNode, tools_condition
from app.agents.tools.search import duckduckgo_search
from app.agents.sensei import sensei_node
from app.agents.challenger import challenger_node
from app.agents.hype import hype_node


class StudyState(TypedDict):
    """The central state passed across every node in our graph."""
    messages: Annotated[list[BaseMessage], add_messages]
    current_topic: Optional[str]
    current_chapter: Optional[str]
    mood: Optional[str]        # "chill" | "focused" | "tired" | "hyped"
    theme: Optional[str]       # "anime" | "marvel" | "harry_potter"
    study_mode: Optional[str]  # "chill" (analogies) | "serious" (interview prep)
    difficulty_level: Optional[str]  # "beginner" | "intermediate" | "advanced"
    target_agent: Optional[str] # Explicit routing override ("sensei" | "challenger" | "hype")
    agent_type: Optional[str]  # Which agent responded ("sensei" | "challenger" | "hype")


def route_agent_decision(state: StudyState) -> str:
    """
    Intelligent Router: Determines which specialized agent speaks.
    1. Explicit UI action (e.g. user clicked "⚔️ Challenge Me" button).
    2. Intent triggers (e.g. user typed "quiz me", "test me", "interview question").
    3. Milestone celebration triggers ("finished chapter", "passed").
    4. Default: Sensei (The Teacher).
    """
    target = state.get("target_agent")
    if target in ["challenger", "hype", "sensei"]:
        return target

    messages = state.get("messages", [])
    if messages:
        last_content = str(messages[-1].content).lower()
        
        quiz_triggers = [
            "quiz", "test me", "challenge me", "interview question",
            "give me a challenge", "test my knowledge", "quiz me", "give me a test"
        ]
        if any(trigger in last_content for trigger in quiz_triggers):
            return "challenger"

        hype_triggers = [
            "i passed", "all done", "finished chapter", "completed module", "let's celebrate"
        ]
        if any(trigger in last_content for trigger in hype_triggers):
            return "hype"

    return "sensei"


def create_study_graph():
    """
    Constructs and compiles the Multi-Agent StateGraph.
    
    Architecture:
                      [User Message]
                            │
               route_agent_decision(state)
               ├── "challenger" ──> Challenger Node ──> END
               ├── "hype"       ──> Hype Node       ──> END
               └── "sensei"     ──> Sensei Node
                                         │
                                   (Tool Called?)
                                    ├── YES ──> Tool Node (DuckDuckGo) ──> Sensei Node
                                    └── NO  ──> END
    """
    workflow = StateGraph(StudyState)

    # 1. Register All Specialized Agent Nodes
    workflow.add_node("sensei", sensei_node)
    workflow.add_node("challenger", challenger_node)
    workflow.add_node("hype", hype_node)
    workflow.add_node("tools", ToolNode([duckduckgo_search]))

    # 2. Set Conditional Entry Point (The Router)
    workflow.set_conditional_entry_point(
        route_agent_decision,
        {
            "sensei": "sensei",
            "challenger": "challenger",
            "hype": "hype"
        }
    )

    # 3. Sensei's Tool Calling Edges
    workflow.add_conditional_edges("sensei", tools_condition)
    workflow.add_edge("tools", "sensei")

    # 4. Challenger & Hype terminal edges
    workflow.add_edge("challenger", END)
    workflow.add_edge("hype", END)

    # 5. Compile with in-memory checkpointer for thread persistence
    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)


# Singleton compiled graph instance ready for FastAPI
study_graph = create_study_graph()

