from google import genai
from google.genai import types

# Create client (uses GEMINI_API_KEY env variable)
client = genai.Client(api_key="AIzaSyBoa8asRfwKVGpeICmONs6BdrJZY78i-j0")

# Build your conversation history
history = [
    types.Content(role="user",  parts=[types.Part.from_text(text="You are my Flowlytics helper.")]),
    types.Content(role="model", parts=[types.Part.from_text(text="Got it. I’ll be concise.")]),
    types.Content(role="user",  parts=[types.Part.from_text(text="Remember I like CSV uploads only.")]),
    types.Content(role="model", parts=[types.Part.from_text(text="Noted: CSV-only uploads.")]),
]

# New user turn
new_turn = types.Content(
    role="user",
    parts=[types.Part.from_text(text="Given our context, outline the MVP steps in 5 bullets.")]
)

# Generate a response
resp = client.models.generate_content(
    model="gemini-2.0-flash",   # or gemini-2.5-flash if you have access
    contents=history + [new_turn],
    config=types.GenerateContentConfig(temperature=0.3),
)

print(resp.text)
