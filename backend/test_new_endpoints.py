#!/usr/bin/env python3
"""
Simple test script for new forecasting and PDF report endpoints.
Run this to verify the new features are working correctly.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server runs elsewhere

def test_forecast_endpoint(business_id: int = 1):
    """Test the forecasting endpoint."""
    print(f"\n=== Testing Forecast Endpoint ===")
    
    # Test forecast info first
    try:
        response = requests.get(f"{BASE_URL}/forecast/{business_id}/info")
        if response.status_code == 200:
            print("✅ Forecast info endpoint working")
            info = response.json()
            print(f"   Business {business_id} has {info['data_points']} months of data")
            print(f"   Recommended method: {info['recommended_method']}")
            print(f"   Can forecast: {info['can_forecast']}")
        else:
            print(f"❌ Forecast info failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Forecast info error: {e}")
        return False
    
    # Test actual forecast
    try:
        response = requests.post(f"{BASE_URL}/forecast/{business_id}?horizon=3")
        if response.status_code == 200:
            print("✅ Forecast endpoint working")
            forecast = response.json()
            print(f"   Forecast method: {forecast['method']}")
            print(f"   History points: {len(forecast['history'])}")
            print(f"   Forecast points: {len(forecast['forecast'])}")
            print(f"   Sample forecast: {forecast['forecast'][0] if forecast['forecast'] else 'None'}")
        else:
            print(f"❌ Forecast failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Forecast error: {e}")
        return False
    
    return True


def test_report_endpoint(business_id: int = 1):
    """Test the PDF report endpoint."""
    print(f"\n=== Testing PDF Report Endpoint ===")
    
    # Test report info first
    try:
        response = requests.get(f"{BASE_URL}/report/{business_id}/info")
        if response.status_code == 200:
            print("✅ Report info endpoint working")
            info = response.json()
            print(f"   Business: {info['business_name']}")
            print(f"   Has assessment: {info['has_assessment']}")
            print(f"   Health score: {info.get('health_score', 'N/A')}")
            print(f"   Has insights: {info.get('has_insights', 'N/A')}")
        else:
            print(f"❌ Report info failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Report info error: {e}")
        return False
    
    # Test PDF generation
    try:
        response = requests.get(f"{BASE_URL}/report/{business_id}.pdf?lang=en")
        if response.status_code == 200:
            print("✅ PDF report endpoint working")
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("   Correct content-type: application/pdf")
                
                # Save PDF to file for verification
                filename = f"test_report_{business_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"   PDF saved as: {filename}")
            else:
                print(f"❌ Wrong content-type: {content_type}")
                return False
        else:
            print(f"❌ PDF report failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ PDF report error: {e}")
        return False
    
    return True


def main():
    """Run all tests."""
    print("🧪 Testing New Backend Endpoints")
    print(f"   Server: {BASE_URL}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test with business_id=1 (adjust as needed)
    business_id = 1
    
    success = True
    
    # Test forecasting
    if not test_forecast_endpoint(business_id):
        success = False
    
    # Test PDF reporting
    if not test_report_endpoint(business_id):
        success = False
    
    print(f"\n=== Test Results ===")
    if success:
        print("🎉 All tests passed! New endpoints are working correctly.")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
