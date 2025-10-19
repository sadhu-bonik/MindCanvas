import os
from google import genai
from google.genai import types
from typing import List, Dict, Tuple, Optional

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBoa8asRfwKVGpeICmONs6BdrJZY78i-j0")

# Create client
client = genai.Client(api_key=GEMINI_API_KEY)

# System prompts
CHAT_SYSTEM_PROMPT = """You are a helpful educational assistant. Your role is to:
- Provide clear, conversational explanations
- Break down complex topics into understandable parts
- Use markdown formatting for better readability
- Be encouraging and supportive
- Ask clarifying questions when needed
- Provide examples and analogies to help understanding

Keep your responses educational, friendly, and well-structured using markdown."""

TITLE_SYSTEM_PROMPT = """Generate a short, descriptive title (3-5 words max) with a relevant emoji at the start.
The title should capture the main topic or question.
Format: "emoji Short Title Here"
Examples:
- "🧬 DNA Structure"
- "📊 Statistics Basics"
- "🌍 Climate Change"
- "💻 Python Functions"

Only return the title, nothing else."""

FINALIZATION_SYSTEM_PROMPT = """You will receive a conversation history between a student and assistant.
Your task is to create TWO things:

1. SUMMARY: A concise 2-3 sentence summary of the key points and main takeaways from the conversation.

2. REFORMATTED CONTENT: Take the entire conversation and rewrite it as one cohesive, well-structured note. 
   - Make it look pretty, lively
   - Remove the conversational back-and-forth format
   - Organize information logically with headers and sections
   - Use markdown formatting (headers, bullet points, code blocks, etc.)
   - Include all important information, examples, and explanations
   - Make it read like a comprehensive study note, not a conversation

"""


async def generate_title(text: str) -> str:
    """
    Generate an emoji + short title from the given text.
    
    Args:
        text: The text to generate a title from
        
    Returns:
        A string in format "emoji Short Title"
    """
    try:
        # Build the conversation
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(text=f"{TITLE_SYSTEM_PROMPT}\n\nText: {text}")])
        ]
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        
        title = response.text.strip()
        return title
    except Exception as e:
        print(f"Error generating title: {e}")
        return "📝 New Topic"


async def generate_chat_response(message: str, history: Optional[List[Dict]] = None) -> str:
    """
    Generate a conversational chat response.
    
    Args:
        message: The user's message
        history: Optional conversation history (list of messages with 'role' and 'content')
        
    Returns:
        The assistant's response in markdown format
    """
    try:
        # Build the conversation context
        contents = []
        
        # Add system prompt as first user message
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=CHAT_SYSTEM_PROMPT)])
        )
        contents.append(
            types.Content(role="model", parts=[types.Part.from_text(text="Understood. I'll provide clear, educational responses using markdown formatting.")])
        )
        
        # Add conversation history
        if history:
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])])
                )
        
        # Add new user message
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=message)])
        )
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        
        return response.text.strip()
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again."


async def generate_finalization(history: List[Dict]) -> Tuple[str, str]:
    """
    Generate both a summary and reformatted content from conversation history.
    
    Args:
        history: List of conversation messages with 'role' and 'content'
        
    Returns:
        Tuple of (summary, reformatted_content)
    """
    try:
        # Build conversation history for the prompt
        conversation_text = []
        for msg in history:
            role = "User" if msg["role"] == "user" else "Assistant"
            conversation_text.append(f"{role}: {msg['content']}")
        
        conversation = "\n\n".join(conversation_text)
        
        prompt = f"{FINALIZATION_SYSTEM_PROMPT}\n\nCONVERSATION:\n{conversation}"
        
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
        ]
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.5),
        )
        
        result = response.text.strip()
        
        # Parse the response
        if "SUMMARY:" in result and "REFORMATTED:" in result:
            parts = result.split("REFORMATTED:")
            summary_part = parts[0].replace("SUMMARY:", "").strip()
            reformatted_part = parts[1].strip()
            return summary_part, reformatted_part
        else:
            # Fallback if format is not correct
            print("Warning: Finalization response format unexpected")
            # Try to extract what we can
            lines = result.split("\n")
            summary = " ".join(lines[:3])  # Take first few lines as summary
            reformatted = result  # Use full response as reformatted
            return summary, reformatted
            
    except Exception as e:
        print(f"Error generating finalization: {e}")
        # Return reasonable defaults
        summary = "This conversation covered several important topics and concepts."
        reformatted = "# Summary\n\nAn error occurred while reformatting this content."
        return summary, reformatted
