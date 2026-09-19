"""
DuckDuckGo Web Search Tool — Real-Time Fact Grounding

Concepts for your learning:
1. Tool Calling / Function Calling:
   By decorating this function with `@tool`, LangChain generates an OpenAPI-compatible
   JSON schema containing the tool's name, description, and parameter types.
   When passed to Gemini, the model can autonomously decide:
   "I don't know the latest 2026 update for this, let me call duckduckgo_search."
2. Zero-Cost Grounding:
   Uses DuckDuckGo so it requires $0.00 and no external API key!
"""
from langchain_core.tools import tool

try:
    from duckduckgo_search import DDGS
except ImportError:
    try:
        from ddgs import DDGS
    except ImportError:
        DDGS = None


@tool
def duckduckgo_search(query: str) -> str:
    """
    Search the live internet via DuckDuckGo for recent documentation,
    syntax updates, interview trends, or library versions.
    Use this tool when you need to verify modern facts or when the user asks about recent versions.
    """
    try:
        if DDGS is None:
            return f"Search is currently unavailable in this environment."
        results = list(DDGS().text(query, max_results=3))
        if not results:
            return f"No relevant web search results found for query: '{query}'."

        formatted_snippets = []
        for idx, r in enumerate(results, 1):
            title = r.get("title", "Untitled")
            body = r.get("body", "")
            href = r.get("href", "")
            formatted_snippets.append(f"[{idx}] {title}\nSummary: {body}\nLink: {href}")

        return "\n\n".join(formatted_snippets)
    except Exception as e:
        return f"Search temporary error: {str(e)}"
