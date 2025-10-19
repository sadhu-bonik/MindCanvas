# LLM-Powered Mind Mapping API

A FastAPI-based backend for creating interactive mind maps powered by LLMs (OpenAI ChatGPT or Google Gemini).

## Features

- 🗺️ **Multiple Maps**: Create and manage multiple topic-based mind maps
- 🤖 **LLM Integration**: Powered by OpenAI ChatGPT or Google Gemini
- 💬 **Interactive Chat**: Continue conversations within blocks
- 📝 **Smart Finalization**: Auto-generate summaries and reformatted notes
- 🔗 **Block Linking**: Create child blocks from highlighted text
- 💾 **Simple Storage**: JSON file-based storage (no database required)

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Choose your LLM provider
LLM_PROVIDER=openai  # or "gemini"

# Add your API key
OPENAI_API_KEY=your_key_here
# OR
GEMINI_API_KEY=your_key_here
```

### 3. Start the Server
```bash
python start_server.py
```

The server will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs

### 4. Test the API
```bash
python test_api.py
```

## API Overview

### Authentication
All requests require: `Authorization: {user_id}`

### Key Endpoints

- `POST /api/map/create` - Create a new mind map
- `GET /api/user/maps` - Get all user maps
- `POST /api/block/create` - Create a new block/conversation
- `POST /api/block/{id}/message` - Send message to block
- `POST /api/block/{id}/finalize` - Generate summary & reformatted content
- `GET /api/map/{id}` - Get complete map with all blocks

## Project Structure

```
├── main.py              # FastAPI application
├── llm_provider.py      # LLM abstraction layer
├── chatgpt_service.py   # OpenAI ChatGPT integration
├── gemini_service.py    # Google Gemini integration
├── start_server.py      # Server startup script
├── test_api.py          # API testing script
├── data/                # User data storage (JSON files)
└── requirements.txt     # Python dependencies
```

## How It Works

1. **Create Map**: Start with a topic/message, get an LLM-generated title
2. **Create Blocks**: Each block is a conversation thread with the LLM
3. **Chat**: Send follow-up messages within blocks
4. **Finalize**: Generate a summary and reformatted note from the conversation
5. **Link Blocks**: Highlight text from any block to create child conversations

## LLM Providers

### OpenAI (Default)
- Model: `gpt-4o-mini`
- Fast and cost-effective
- Requires OpenAI API key

### Google Gemini
- Model: `gemini-2.0-flash-exp`
- Free tier available
- Requires Google AI API key

Switch providers by setting `LLM_PROVIDER=gemini` or `LLM_PROVIDER=openai` in your environment.

## Development

The API is built with:
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **JSON Storage** - Simple file-based persistence

For development, the server runs with auto-reload enabled. Check the logs for debugging information.

## Status

✅ **Working Features:**
- All API endpoints functional
- Both LLM providers working
- JSON storage system
- CORS enabled for web frontends
- Comprehensive error handling

The backend is ready for frontend integration!