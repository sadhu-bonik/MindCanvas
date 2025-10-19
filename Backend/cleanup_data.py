#!/usr/bin/env python3
"""
Simple script to clean up user data for testing.
This will remove all existing user data files.
"""

import os
import shutil

def cleanup_data():
    data_dir = "data"
    
    if os.path.exists(data_dir):
        print(f"🧹 Cleaning up data directory: {data_dir}")
        
        # List all files before deletion
        files = os.listdir(data_dir)
        if files:
            print(f"   Found {len(files)} user data files:")
            for file in files:
                print(f"   - {file}")
            
            # Remove all files
            for file in files:
                file_path = os.path.join(data_dir, file)
                os.remove(file_path)
                print(f"   ✅ Deleted {file}")
        else:
            print("   📁 Data directory is already empty")
    else:
        print(f"📁 Data directory doesn't exist yet")
    
    print("🎉 Cleanup complete! Ready for fresh testing.")

if __name__ == "__main__":
    cleanup_data()