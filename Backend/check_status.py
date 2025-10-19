#!/usr/bin/env python3
"""
Quick status check script to verify everything is working.
"""

import os
import sys
import asyncio
from llm_provider import generate_title, generate_chat_response

def check_dependencies():
    """Check if all required packages are installed."""
    print("📦 Checking dependencies...")
    
    required_packages = [
        'fastapi', 'pydantic', 'openai', 'google.genai', 
        'python_dotenv', 'uvicorn'
    ]
    
    missing = []
    for package in required_packages:
        try:
            if package == 'google.genai':
                import google.genai
            elif package == 'python_dotenv':
                import dotenv
            else:
                __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    else:
        print("   🎉 All dependencies installed!")
        return True

def check_llm_provider():
    """Check if LLM provider is working."""
    print("\n🤖 Testing LLM provider...")
    
    provider = os.getenv("LLM_PROVIDER", "openai")
    print(f"   Using provider: {provider}")
    
    try:
        # Test title generation
        result = asyncio.run(generate_title("test message"))
        print(f"   ✅ Title generation: {result}")
        
        # Test chat response
        result = asyncio.run(generate_chat_response("Hello, can you help me?"))
        print(f"   ✅ Chat response: {result[:50]}...")
        
        return True
    except Exception as e:
        print(f"   ❌ LLM provider error: {e}")
        return False

def check_data_directory():
    """Check data directory setup."""
    print("\n📁 Checking data directory...")
    
    data_dir = "data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"   ✅ Created data directory: {data_dir}")
    else:
        files = os.listdir(data_dir)
        print(f"   ✅ Data directory exists with {len(files)} files")
    
    return True

def main():
    print("🔍 System Status Check")
    print("=" * 50)
    
    checks = [
        ("Dependencies", check_dependencies),
        ("LLM Provider", check_llm_provider),
        ("Data Directory", check_data_directory),
    ]
    
    all_passed = True
    for name, check_func in checks:
        try:
            if not check_func():
                all_passed = False
        except Exception as e:
            print(f"   ❌ {name} check failed: {e}")
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All checks passed! System is ready to go.")
        print("\nNext steps:")
        print("1. Run: python start_server.py")
        print("2. Test: python test_api.py")
        print("3. Visit: http://localhost:8000/docs")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()