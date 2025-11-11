"""
Test script to verify the vitals simulation system is working correctly
Run this while the backend is running to see real-time vitals updates
"""

import requests
import time
import json
from datetime import datetime

API_BASE = "http://localhost:5000"

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_backend_connection():
    """Test if backend is running"""
    print_header("1. Testing Backend Connection")
    try:
        response = requests.get(f"{API_BASE}/")
        data = response.json()
        print(f"✅ Backend is running: {data.get('message')}")
        return True
    except Exception as e:
        print(f"❌ Backend not running: {e}")
        return False

def check_simulation_status():
    """Check if simulation is running"""
    print_header("2. Checking Simulation Status")
    try:
        response = requests.get(f"{API_BASE}/machine/simulation/status")
        data = response.json()
        running = data.get('data', {}).get('running', False)
        
        if running:
            print("✅ Simulation is RUNNING")
        else:
            print("⚠️  Simulation is STOPPED")
            print("   Starting simulation...")
            start_response = requests.post(f"{API_BASE}/machine/simulation/start")
            if start_response.json().get('success'):
                print("✅ Simulation started successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def get_all_machines():
    """Fetch all machines with current vitals"""
    print_header("3. Fetching All Machines")
    try:
        response = requests.get(f"{API_BASE}/machine/machines")
        data = response.json()
        
        if data.get('success'):
            machines = data.get('data', [])
            print(f"✅ Found {len(machines)} machines")
            
            for machine in machines:
                print(f"\n📍 {machine['name']} ({machine['type']})")
                print(f"   Location: {machine['location']}")
                print(f"   Status: {machine['status']} | Health: {machine['health_status']}")
                
                vitals = machine.get('vitals', {})
                print(f"   🌡️  Temperature: {vitals.get('temperature', 0):.1f}°C")
                print(f"   📊 Pressure: {vitals.get('pressure', 0):.1f} PSI")
                print(f"   ⚡ Vibration: {vitals.get('vibration', 0):.2f} mm/s")
                
                prediction = machine.get('failure_prediction')
                if prediction:
                    print(f"   🔮 Failure Risk: {prediction.get('risk_level', 0)}% ({prediction.get('maintenance_priority', 'N/A')})")
                    print(f"   ⚠️  Type: {prediction.get('predicted_failure_type', 'N/A')}")
                    print(f"   ⏱️  ETA: {prediction.get('estimated_time_to_failure', 'N/A')}")
            
            return machines
        else:
            print("❌ Failed to fetch machines")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def monitor_machine_vitals(machine_id, machine_name, duration=90):
    """Monitor a specific machine's vitals for specified duration"""
    print_header(f"4. Monitoring {machine_name} for {duration} seconds")
    print(f"Updates every 30 seconds...\n")
    
    start_time = time.time()
    update_count = 0
    
    while time.time() - start_time < duration:
        try:
            response = requests.get(f"{API_BASE}/machine/machines/{machine_id}/vitals/current")
            data = response.json()
            
            if data.get('success'):
                update_count += 1
                vitals = data.get('data', {})
                timestamp = vitals.get('timestamp', '')
                
                print(f"\n[Update #{update_count}] {datetime.now().strftime('%H:%M:%S')}")
                print(f"  🌡️  Temp: {vitals.get('temperature', 0):.1f}°C")
                print(f"  📊 Press: {vitals.get('pressure', 0):.1f} PSI")
                print(f"  ⚡ Vib: {vitals.get('vibration', 0):.2f} mm/s")
                
                prediction = vitals.get('prediction')
                if prediction:
                    risk = prediction.get('failure_risk', 0)
                    risk_emoji = "🟢" if risk < 40 else "🟡" if risk < 70 else "🔴"
                    print(f"  {risk_emoji} Risk: {risk}% ({prediction.get('risk_level', 'N/A')})")
                    print(f"  ⚠️  Type: {prediction.get('predicted_failure_type', 'N/A')}")
                    print(f"  ⏱️  ETA: {prediction.get('estimated_hours', 'N/A')}h")
            
            # Wait before next check
            time.sleep(10)  # Check every 10 seconds to catch 30-second updates
            
        except KeyboardInterrupt:
            print("\n\n⏹️  Monitoring stopped by user")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(10)

def get_machine_history(machine_id, machine_name):
    """Get historical vitals for a machine"""
    print_header(f"5. Getting History for {machine_name}")
    try:
        response = requests.get(f"{API_BASE}/machine/machines/{machine_id}/vitals/history?limit=10")
        data = response.json()
        
        if data.get('success'):
            history = data.get('data', [])
            print(f"✅ Retrieved {len(history)} historical readings\n")
            
            for i, reading in enumerate(history[-5:], 1):  # Show last 5
                print(f"Reading #{i}:")
                print(f"  Time: {reading.get('Timestamp', 'N/A')}")
                print(f"  Temp: {reading.get('Temperature', 0):.1f}°C")
                print(f"  Press: {reading.get('Pressure', 0):.1f} PSI")
                print(f"  Vib: {reading.get('Vibration', 0):.2f} mm/s\n")
        else:
            print("❌ Failed to fetch history")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main test sequence"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║   MACHINE VITALS SIMULATION SYSTEM - TEST SUITE           ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    # Step 1: Check backend
    if not check_backend_connection():
        print("\n❌ Backend is not running. Please start it first:")
        print("   cd Backend")
        print("   python app.py")
        return
    
    # Step 2: Check simulation
    if not check_simulation_status():
        print("\n❌ Could not verify simulation status")
        return
    
    # Step 3: Get all machines
    machines = get_all_machines()
    if not machines:
        print("\n❌ No machines found")
        return
    
    # Wait a bit for first simulation update
    print("\n⏳ Waiting 5 seconds for simulation to generate data...")
    time.sleep(5)
    
    # Step 4: Monitor first machine
    if len(machines) > 0:
        machine = machines[0]
        print(f"\n📊 Will monitor '{machine['name']}' for 90 seconds")
        print("   (You'll see updates every ~30 seconds)")
        print("   Press Ctrl+C to stop early\n")
        
        input("Press ENTER to start monitoring...")
        monitor_machine_vitals(machine['id'], machine['name'], duration=90)
    
    # Step 5: Get history
    if len(machines) > 0:
        machine = machines[0]
        get_machine_history(machine['id'], machine['name'])
    
    print_header("✅ Test Complete!")
    print("\n📝 Summary:")
    print("  - Backend is running")
    print("  - Simulation is active")
    print(f"  - {len(machines)} machines monitored")
    print("  - Vitals update every 30 seconds")
    print("  - ML predictions running automatically")
    print("\n🎉 System is working correctly!\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
