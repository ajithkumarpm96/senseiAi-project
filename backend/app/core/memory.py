"""
Conversation Memory — Sliding window + summarization.

Manages how much conversation history we send to the LLM:
- Keep the last 10 messages exactly as they are
- Summarize older messages into a short summary
- This saves tokens (money) while maintaining context

Will be implemented in Phase 3.
"""
# TODO: Implement in Phase 3
# - Sliding window of last 10 messages
# - LLM-generated summary of older messages
# - Store summary in conversations.summary column
