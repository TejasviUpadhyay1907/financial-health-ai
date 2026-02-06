#!/usr/bin/env python3
"""
Simple test script to verify the backend works locally with SQLite.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_create_business():
    """Test business creation with frontend payload."""
    try:
        payload = {
            "businessName": "Test Business",
            "industry": "Manufacturing",
            "language": "en"
        }
        
        response = requests.post(f"{BASE_URL}/business", json=payload)
        if response.status_code == 200:
            business = response.json()
            print(f"✅ Business created: ID {business['id']}, Name: {business['name']}")
            return business['id']
        else:
            print(f"❌ Business creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Business creation error: {e}")
        return None

def test_business_details(business_id):
    """Test getting business details."""
    try:
        response = requests.get(f"{BASE_URL}/business/{business_id}")
        if response.status_code == 200:
            business = response.json()
            print(f"✅ Business details retrieved: {business['name']}")
            return True
        else:
            print(f"❌ Business details failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Business details error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing Local Backend with SQLite")
    print(f"   Server: {BASE_URL}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = True
    
    # Test health
    if not test_health():
        success = False
    
    # Test business creation
    business_id = test_create_business()
    if not business_id:
        success = False
    
    # Test business details
    if business_id and not test_business_details(business_id):
        success = False
    
    print(f"\n=== Test Results ===")
    if success:
        print("🎉 All tests passed! Backend is working correctly.")
        print("\n📋 Next steps:")
        print("   1. Start frontend: cd ../frontend && npm run dev")
        print("   2. Open http://localhost:5173")
        print("   3. Test the complete flow")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure backend is running: uvicorn app.main:app --reload")
        print("   2. Check DATABASE_URL=sqlite:///./app.db in .env")
        print("   3. Verify all dependencies are installed")
        sys.exit(1)

if __name__ == "__main__":
    main()
