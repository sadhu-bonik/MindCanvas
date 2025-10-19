# LLM Provider Configuration

This backend supports multiple LLM providers. You can easily switch between them or add new ones.

## Currently Supported Providers

- **Google Gemini** (default) - Using `gemini-2.0-flash-exp`
- **OpenAI ChatGPT** - Using `gpt-4o-mini`

## How to Switch Providers

### Option 1: Environment Variable (Recommended)

Set the `LLM_PROVIDER` environment variable before starting the server:

**Windows (cmd):**
```bash
set LLM_PROVIDER=openai
uvicorn main:app --reload
```

**Windows (PowerShell):**
```powershell
$env:LLM_PROVIDER="openai"
uvicorn main:app --reload
```

**Linux/Mac:**
```bash
export LLM_PROVIDER=openai
uvicorn main:app --reload
```

### Option 2: Default (No Environment Variable)

If you don't set `LLM_PROVIDER`, it defaults to **Gemini**.

## Supported Values

- `gemini` - Uses Google Gemini API
- `openai` - Uses OpenAI ChatGPT API

## API Keys

Make sure you have the appropriate API keys set:

**For Gemini:**
```bash
export GEMINI_API_KEY=your_key_here
```

**For OpenAI:**
```bash
export OPENAI_API_KEY=your_key_here
```

## Adding a New LLM Provider

To add support for a new LLM (e.g., Anthropic Claude, Cohere, etc.):

### Step 1: Create a new service file

Create `<provider>_service.py` with these three async functions:

```python
async def generate_title(text: str) -> str:
    """Generate emoji + short title"""
    pass

async def generate_chat_response(message: str, history: Optional[List[Dict]] = None) -> str:
    """Generate chat response with optional history"""
    pass

async def generate_finalization(history: List[Dict]) -> Tuple[str, str]:
    """Return (summary, reformatted_content)"""
    pass
```

### Step 2: Update `llm_provider.py`

Add a new elif block:

```python
elif LLM_PROVIDER == "claude":
    from claude_service import (
        generate_title as _generate_title,
        generate_chat_response as _generate_chat_response,
        generate_finalization as _generate_finalization
    )
    print(f"✅ Using LLM Provider: Anthropic Claude")
```

### Step 3: Use it

```bash
export LLM_PROVIDER=claude
uvicorn main:app --reload
```

## File Structure

```
Backend/
├── main.py                 # Main FastAPI app (uses llm_provider)
├── llm_provider.py         # LLM abstraction layer
├── gemini_service.py       # Google Gemini implementation
├── chatgpt_service.py      # OpenAI ChatGPT implementation
└── <new>_service.py        # Your new provider
```

## Notes

- All LLM services use the same interface (same function signatures)
- The system prompts are consistent across providers for uniform behavior
- You can customize temperature and other parameters in each service file
- The provider is selected once at startup (check console for confirmation message)
