"""
Test script for the real-time vitals system
"""
import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_endpoints():
    print("=" * 60)
    print("Testing Real-Time Vitals System")
    print("=" * 60)
    
    # Test 1: Get all machines
    print("\n1. Testing GET /machine/machines")
    try:
        response = requests.get(f"{BASE_URL}/machine/machines")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Success: {data.get('success')}")
        print(f"   Machine Count: {data.get('count')}")
        if data.get('data'):
            for machine in data['data']:
                print(f"   - {machine['name']}: {machine['health_status']}")
                if machine.get('failure_prediction'):
                    pred = machine['failure_prediction']
                    print(f"     Prediction: {pred.get('predicted_failure_type')} ({pred.get('risk_level')}% risk)")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get specific machine vitals
    print("\n2. Testing GET /machine/machines/1/vitals/current")
    try:
        response = requests.get(f"{BASE_URL}/machine/machines/1/vitals/current")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Success: {data.get('success')}")
        if data.get('data'):
            vitals = data['data']
            print(f"   Temperature: {vitals.get('temperature')}°C")
            print(f"   Pressure: {vitals.get('pressure')} PSI")
            print(f"   Vibration: {vitals.get('vibration')} mm/s")
            if vitals.get('prediction'):
                pred = vitals['prediction']
                print(f"   Prediction: {pred.get('predicted_failure_type')} ({pred.get('failure_risk')}% risk)")
                print(f"   Estimated Time: {pred.get('estimated_hours')} hours")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Get vitals history
    print("\n3. Testing GET /machine/machines/1/vitals/history?limit=5")
    try:
        response = requests.get(f"{BASE_URL}/machine/machines/1/vitals/history?limit=5")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Success: {data.get('success')}")
        print(f"   History Count: {data.get('count')}")
        if data.get('data'):
            for i, reading in enumerate(data['data'][-3:], 1):
                print(f"   Reading {i}: T={reading.get('Temperature')}°C, "
                      f"P={reading.get('Pressure')} PSI, "
                      f"V={reading.get('Vibration')} mm/s")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Check simulation status
    print("\n4. Testing GET /machine/simulation/status")
    try:
        response = requests.get(f"{BASE_URL}/machine/simulation/status")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Success: {data.get('success')}")
        if data.get('data'):
            print(f"   Simulation Running: {data['data'].get('running')}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 5: Test SSE stream (just connect and read a few events)
    print("\n5. Testing GET /machine/vitals/stream (SSE)")
    print("   Connecting to stream... (will read 3 events)")
    try:
        response = requests.get(f"{BASE_URL}/machine/vitals/stream", stream=True)
        print(f"   Connected! Status: {response.status_code}")
        
        event_count = 0
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data:'):
                event_count += 1
                data_str = line[6:]  # Remove 'data: ' prefix
                try:
                    event_data = json.loads(data_str)
                    print(f"   Event {event_count}: Type={event_data.get('type')}")
                    if event_data.get('type') == 'update':
                        update = event_data.get('data', {})
                        machine_count = len(update.get('machines', []))
                        print(f"   - Machines updated: {machine_count}")
                except json.JSONDecodeError:
                    pass
                
                if event_count >= 3:
                    break
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
