#!/usr/bin/env python3
"""
Simple test script to verify the API endpoints work correctly.
Run this while the server is running to test functionality.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
USER_ID = "test_user_123"

def test_api():
    print("🧪 Testing API endpoints...")
    print("-" * 50)
    
    headers = {"Authorization": USER_ID}
    
    try:
        # Test 1: Create a map
        print("1. Creating a new map...")
        response = requests.post(
            f"{BASE_URL}/api/map/create",
            json={"message": "I want to learn about machine learning"},
            headers=headers
        )
        if response.status_code == 200:
            map_data = response.json()
            map_id = map_data["mapId"]
            print(f"   ✅ Map created: {map_data['title']}")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        # Test 2: Create a block
        print("2. Creating a block...")
        response = requests.post(
            f"{BASE_URL}/api/block/create",
            json={
                "mapId": map_id,
                "message": "What are the main types of machine learning?"
            },
            headers=headers
        )
        if response.status_code == 200:
            block_data = response.json()
            block_id = block_data["blockId"]
            print(f"   ✅ Block created: {block_data['title']}")
            print(f"   📝 Response preview: {block_data['response'][:100]}...")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        # Test 3: Send a follow-up message
        print("3. Sending follow-up message...")
        response = requests.post(
            f"{BASE_URL}/api/block/{block_id}/message",
            json={"message": "Can you give me examples of supervised learning?"},
            headers=headers
        )
        if response.status_code == 200:
            message_data = response.json()
            print(f"   ✅ Message sent successfully")
            print(f"   📝 Response preview: {message_data['response'][:100]}...")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        # Test 4: Finalize the block
        print("4. Finalizing block...")
        response = requests.post(
            f"{BASE_URL}/api/block/{block_id}/finalize",
            headers=headers
        )
        if response.status_code == 200:
            final_data = response.json()
            print(f"   ✅ Block finalized")
            print(f"   📋 Summary: {final_data['summary']}")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        # Test 5: Get all maps
        print("5. Getting all maps...")
        response = requests.get(f"{BASE_URL}/api/user/maps", headers=headers)
        if response.status_code == 200:
            maps_data = response.json()
            print(f"   ✅ Found {len(maps_data['maps'])} maps")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        # Test 6: Get map details
        print("6. Getting map details...")
        response = requests.get(f"{BASE_URL}/api/map/{map_id}", headers=headers)
        if response.status_code == 200:
            map_details = response.json()
            print(f"   ✅ Map details retrieved")
            print(f"   📊 Found {len(map_details['blocks'])} blocks")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return
        
        print("-" * 50)
        print("🎉 All tests passed! The API is working correctly.")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_api()