"""
LLM Provider abstraction layer.

This module allows easy switching between different LLM providers.
Set the LLM_PROVIDER environment variable to choose which provider to use.

Supported providers:
- "gemini" (default) - Google Gemini
- "openai" - OpenAI ChatGPT
"""

import os
from typing import List, Dict, Tuple, Optional

# Determine which LLM provider to use
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

# Import the appropriate service based on the provider
if LLM_PROVIDER == "openai":
    from chatgpt_service import (
        generate_title as _generate_title,
        generate_chat_response as _generate_chat_response,
        generate_finalization as _generate_finalization
    )
    print(f"✅ Using LLM Provider: OpenAI (ChatGPT)")
elif LLM_PROVIDER == "gemini":
    from gemini_service import (
        generate_title as _generate_title,
        generate_chat_response as _generate_chat_response,
        generate_finalization as _generate_finalization
    )
    print(f"✅ Using LLM Provider: Google Gemini")
else:
    raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER}. Supported: 'gemini', 'openai'")


# Export unified interface
async def generate_title(text: str) -> str:
    """Generate an emoji + short title from the given text."""
    return await _generate_title(text)


async def generate_chat_response(message: str, history: Optional[List[Dict]] = None) -> str:
    """Generate a conversational chat response."""
    return await _generate_chat_response(message, history)


async def generate_finalization(history: List[Dict]) -> Tuple[str, str]:
    """Generate both a summary and reformatted content from conversation history."""
    return await _generate_finalization(history)
