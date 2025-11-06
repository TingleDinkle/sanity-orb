"""
Test script to verify ML API predictions
"""
import requests
import json

API_URL = "http://localhost:5001"

print("="*60)
print("TESTING SANITY ORB ML API")
print("="*60)

# Test 1: Health check
print("\n1. Testing health endpoint...")
try:
    response = requests.get(f"{API_URL}/api/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Trend prediction
print("\n2. Testing trend prediction...")
try:
    data = {
        "history": [50, 52, 55, 57, 60, 62, 65, 67, 70, 72]
    }
    response = requests.post(f"{API_URL}/api/predict/trend", json=data)
    print(f"   Status: {response.status_code}")
    result = response.json()
    if result.get('success'):
        print(f"   ✓ Next predicted value: {result['next_value']}")
        print(f"   ✓ Confidence: {result['confidence']}%")
        print(f"   ✓ Trend: {result['trend']}")
    else:
        print(f"   Error: {result.get('error')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Session prediction
print("\n3. Testing session prediction...")
try:
    data = {
        "hour": 14,
        "day_of_week": 3,
        "session_duration": 15.5,
        "interactions": 12,
        "prev_sanity_1": 65.0,
        "prev_sanity_2": 70.0,
        "prev_sanity_3": 68.0,
        "stress_level": 45.0,
        "mood_factor": 5.0
    }
    response = requests.post(f"{API_URL}/api/predict/session", json=data)
    print(f"   Status: {response.status_code}")
    result = response.json()
    if result.get('success'):
        print(f"   ✓ Predicted sanity: {result['prediction']}")
        print(f"   ✓ Confidence: {result['confidence']}%")
    else:
        print(f"   Error: {result.get('error')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 4: Classification
print("\n4. Testing sanity classification...")
try:
    data = {
        "current_sanity": 75.0,
        "session_count": 45,
        "avg_duration": 18.5,
        "interaction_rate": 1.2,
        "consistency": 75.0
    }
    response = requests.post(f"{API_URL}/api/predict/classify", json=data)
    print(f"   Status: {response.status_code}")
    result = response.json()
    if result.get('success'):
        print(f"   ✓ Category: {result['category']}")
        print(f"   ✓ Confidence: {result['confidence']}%")
        print(f"   ✓ Probabilities: {json.dumps(result['probabilities'], indent=6)}")
    else:
        print(f"   Error: {result.get('error')}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "="*60)
print("✓ ALL TESTS COMPLETED!")
print("="*60)
