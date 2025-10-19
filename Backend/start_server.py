#!/usr/bin/env python3
"""
Simple script to start the FastAPI server.
"""

import uvicorn
import os

if __name__ == "__main__":
    # Set default environment variables if not set
    if not os.getenv("LLM_PROVIDER"):
        os.environ["LLM_PROVIDER"] = "openai"  # Default to OpenAI
    
    print(f"🚀 Starting server with LLM Provider: {os.getenv('LLM_PROVIDER', 'openai').upper()}")
    print("📝 Server will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )