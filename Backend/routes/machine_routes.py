# backend/routes/machine_routes.py

from flask import Blueprint, jsonify, request, Response, stream_with_context
from flask_cors import CORS
import random
import time
from datetime import datetime, timedelta
import json
import os
import threading
from threading import Lock
import csv
import statistics
import sys
import queue
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.sensor_simulation import simulator
from services.prediction_service import get_machine_specific_prediction

machine_bp = Blueprint('machine_bp', __name__)
CORS(machine_bp, origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'])

# Global variables for simulation control
simulation_running = False
simulation_thread = None
lock = Lock()

# Queue for broadcasting vitals updates to connected clients
vitals_update_queue = queue.Queue(maxsize=100)

# Log file path
LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'machine_vitals.log')

# Ensure logs directory exists
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# Path to the training dataset (used to seed realistic vitals)
DATASET_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'data', 'simulated_sensors.csv')

# Compute simple statistics from the dataset so per-machine vitals match training distribution
def load_dataset_stats(path):
    stats = {
        'temperature': {'mean': 75.0, 'std': 8.0},
        'pressure': {'mean': 100.0, 'std': 8.0},
        'vibration': {'mean': 0.4, 'std': 0.15}
    }
    try:
        temps = []
        press = []
        vib = []
        if os.path.exists(path):
            with open(path, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # tolerate header spacing and comma formatting
                    try:
                        t = row.get('Temperature') or row.get(' Temperature ') or row.get(' Temperature')
                        v = row.get('Vibration') or row.get(' Vibration ')
                        p = row.get('Pressure') or row.get(' Pressure ')
                        if t is not None and p is not None and v is not None:
                            temps.append(float(t))
                            vib.append(float(v))
                            press.append(float(p))
                    except Exception:
                        continue
        if temps and press and vib:
            stats['temperature']['mean'] = statistics.mean(temps)
            stats['temperature']['std'] = statistics.pstdev(temps) if len(temps) > 1 else stats['temperature']['std']
            stats['pressure']['mean'] = statistics.mean(press)
            stats['pressure']['std'] = statistics.pstdev(press) if len(press) > 1 else stats['pressure']['std']
            stats['vibration']['mean'] = statistics.mean(vib)
            stats['vibration']['std'] = statistics.pstdev(vib) if len(vib) > 1 else stats['vibration']['std']
    except Exception:
        # keep defaults on any failure
        pass
    return stats

# Load once at module import
DATASET_STATS = load_dataset_stats(DATASET_CSV)

# Shared in-memory store for latest per-machine vitals (updated by simulation_worker)
CURRENT_MACHINE_VITALS = {}


def get_recent_history_from_logs(limit=3):
    """Return the last `limit` sensor readings from the log file as a list of dicts.
    Attempts to parse nested structures written by the simulator and returns chronological order.
    """
    if not os.path.exists(LOG_FILE):
        return []
    readings = []
    try:
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
        for line in reversed(lines):
            if len(readings) >= limit:
                break
            try:
                payload = json.loads(line.strip())
                if isinstance(payload, dict):
                    # Support two possible log shapes:
                    # 1) old: { 'temperature': 45.0, ... }
                    # 2) new: { 'timestamp': '...', 'vitals': { 'machine_id': '1', 'temperature': 45.0, ... } }
                    def extract_sensor_from_dict(d, key):
                        if not isinstance(d, dict):
                            return None
                        # direct key
                        if key in d:
                            v = d[key]
                            if isinstance(v, dict) and 'value' in v:
                                return v.get('value')
                            return v
                        # try lowercase
                        low = key.lower()
                        if low in d:
                            v = d[low]
                            if isinstance(v, dict) and 'value' in v:
                                return v.get('value')
                            return v
                        return None

                    ts = payload.get('timestamp') or payload.get('Timestamp') or payload.get('time')

                    # If payload contains nested 'vitals', prefer that
                    vitals_obj = None
                    if 'vitals' in payload and isinstance(payload['vitals'], dict):
                        vitals_obj = payload['vitals']
                    elif 'data' in payload and isinstance(payload['data'], dict):
                        # some endpoints write {'data': {...}}
                        vitals_obj = payload['data']

                    if vitals_obj:
                        T = extract_sensor_from_dict(vitals_obj, 'temperature') or extract_sensor_from_dict(vitals_obj, 'Temperature')
                        P = extract_sensor_from_dict(vitals_obj, 'pressure') or extract_sensor_from_dict(vitals_obj, 'Pressure')
                        V = extract_sensor_from_dict(vitals_obj, 'vibration') or extract_sensor_from_dict(vitals_obj, 'Vibration')
                    else:
                        T = extract_sensor_from_dict(payload, 'temperature') or extract_sensor_from_dict(payload, 'Temperature')
                        P = extract_sensor_from_dict(payload, 'pressure') or extract_sensor_from_dict(payload, 'Pressure')
                        V = extract_sensor_from_dict(payload, 'vibration') or extract_sensor_from_dict(payload, 'Vibration')

                    # convert numeric strings to floats where possible
                    def to_num(x):
                        try:
                            return float(x)
                        except Exception:
                            return None

                    readings.append({
                        'Timestamp': ts or datetime.utcnow().isoformat(),
                        'Temperature': to_num(T),
                        'Pressure': to_num(P),
                        'Vibration': to_num(V)
                    })
            except Exception:
                continue
    except Exception:
        return []
    return list(reversed(readings))


def _extract_sensor_value(readings: dict, key: str, default: float = 0.0):
    """Return a numeric sensor value from a readings dict produced by the simulator.
    Handles nested structures like { 'temperature': {'value': 45.0, ...}, ... } or flat values.
    """
    try:
        v = readings.get(key)
        if isinstance(v, dict) and 'value' in v:
            return v.get('value', default)
        if isinstance(v, (int, float)):
            return v
    except Exception:
        pass
    return default

def generate_vitals():
    """Generate realistic machine vitals using the new sensor simulation system"""
    return simulator.get_current_readings()

def log_vitals_to_file(vitals):
    """Log vitals data to file"""
    try:
        # write a consistent record with timestamp; vitals may include machine_id
        record = {
            'timestamp': datetime.utcnow().isoformat(),
            'vitals': vitals
        }
        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps(record) + '\n')
    except Exception as e:
        print(f"Error logging vitals: {e}")

def simulation_worker():
    """Background worker that generates vitals every 30 seconds for each machine with ML predictions"""
    global simulation_running
    
    # Initialize CURRENT_MACHINE_VITALS if empty using dataset stats
    with lock:
        if not CURRENT_MACHINE_VITALS:
            for machine in MINING_MACHINES:
                # seed around dataset mean with a small machine-specific offset
                CURRENT_MACHINE_VITALS[machine['id']] = {
                    'machine_id': machine['id'],
                    'machine_name': machine['name'],
                    'machine_type': machine['type'],
                    'temperature': round(DATASET_STATS['temperature']['mean'] + random.uniform(-5, 5), 2),
                    'pressure': round(DATASET_STATS['pressure']['mean'] + random.uniform(-8, 8), 2),
                    'vibration': round(DATASET_STATS['vibration']['mean'] + random.uniform(-0.2, 0.2), 2),
                    'timestamp': datetime.utcnow().isoformat(),
                    'history': []  # Store recent history for ML predictions
                }

    print("[Simulation Worker] Started - updating vitals every 30 seconds")
    
    # Main loop: update each machine's vitals every 30s
    while simulation_running:
        with lock:
            updated_machines = []
            for machine_config in MINING_MACHINES:
                mid = machine_config['id']
                vit = CURRENT_MACHINE_VITALS.get(mid)
                
                if not vit:
                    continue
                
                # Generate realistic variations using dataset statistics
                t_std = max(0.5, DATASET_STATS['temperature']['std'] * 0.15)
                p_std = max(1.0, DATASET_STATS['pressure']['std'] * 0.15)
                v_std = max(0.02, DATASET_STATS['vibration']['std'] * 0.15)

                # Use Gaussian random walk for smooth, realistic changes
                new_t = round(max(20, min(120, random.gauss(vit['temperature'], t_std))), 2)
                new_p = round(max(30, min(220, random.gauss(vit['pressure'], p_std))), 2)
                new_v = round(max(0.05, min(8, random.gauss(vit['vibration'], v_std))), 3)

                # Update vitals
                vit['temperature'] = new_t
                vit['pressure'] = new_p
                vit['vibration'] = new_v
                vit['timestamp'] = datetime.utcnow().isoformat()
                
                # Maintain history (keep last 10 readings for ML predictions)
                if 'history' not in vit:
                    vit['history'] = []
                    
                vit['history'].append({
                    'Timestamp': vit['timestamp'],
                    'Temperature': new_t,
                    'Pressure': new_p,
                    'Vibration': new_v
                })
                
                # Keep only last 10 readings
                if len(vit['history']) > 10:
                    vit['history'] = vit['history'][-10:]
                
                # Run ML prediction using recent history
                try:
                    if len(vit['history']) >= 3:
                        prediction_result = get_machine_specific_prediction(
                            machine_config['type'], 
                            vit['history'][-3:]  # Use last 3 readings for prediction
                        )
                        
                        failure_probability = prediction_result.get('most_likely_failure_probability', 0)
                        failure_risk_percentage = int(failure_probability * 100)
                        
                        vit['prediction'] = {
                            'failure_risk': failure_risk_percentage,
                            'predicted_failure_type': prediction_result.get('most_likely_failure'),
                            'estimated_hours': prediction_result.get('most_likely_failure_estimated_hours'),
                            'risk_level': 'critical' if failure_probability > 0.7 
                                        else 'high' if failure_probability >= 0.5
                                        else 'medium' if failure_probability >= 0.3
                                        else 'low',
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                        # AUTO-SHUTDOWN: If failure risk > 90%, automatically take machine offline
                        if failure_risk_percentage > 90 and machine_config['status'] == 'online':
                            machine_config['status'] = 'offline'
                            vit['status'] = 'offline'
                            
                            # Log the automatic shutdown
                            print(f"[AUTO-SHUTDOWN] Machine {machine_config['name']} (ID: {mid}) taken offline automatically - Failure risk: {failure_risk_percentage}%")
                            
                            # Send alert notification
                            alert_message = f"""
CRITICAL ALERT: Automatic Machine Shutdown

Machine: {machine_config['name']}
Type: {machine_config['type']}
Location: {machine_config.get('location', 'Unknown')}
Status: OFFLINE (Automatic Shutdown)

Failure Risk: {failure_risk_percentage}%
Predicted Failure: {prediction_result.get('most_likely_failure', 'Unknown').replace('_', ' ').upper()}
Estimated Time to Failure: {prediction_result.get('most_likely_failure_estimated_hours', 'N/A')} hours

Current Vitals:
- Temperature: {new_t}°C
- Pressure: {new_p} PSI
- Vibration: {new_v} mm/s

ACTION REQUIRED: Immediate inspection and maintenance needed before machine can be brought back online.

Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
                            
                            try:
                                # Send email alert using sensor_simulation's email system
                                simulator.send_email_alert(
                                    subject=f"🚨 CRITICAL: {machine_config['name']} Auto-Shutdown - {failure_risk_percentage}% Failure Risk",
                                    body=simulator.create_shutdown_alert_email(
                                        machine_config['name'],
                                        machine_config['type'],
                                        machine_config.get('location', 'Unknown'),
                                        failure_risk_percentage,
                                        prediction_result.get('most_likely_failure', 'Unknown'),
                                        prediction_result.get('most_likely_failure_estimated_hours', 'N/A'),
                                        new_t,
                                        new_p,
                                        new_v
                                    )
                                )
                                print(f"[AUTO-SHUTDOWN] Alert email sent for machine {machine_config['name']}")
                            except Exception as email_error:
                                print(f"[AUTO-SHUTDOWN] Failed to send email alert: {email_error}")
                                # Print alert to console as fallback
                                print(alert_message)
                        
                except Exception as e:
                    print(f"[Simulation Worker] Prediction error for machine {mid}: {e}")
                    vit['prediction'] = None

                # log per-machine vitals
                try:
                    log_vitals_to_file({
                        'machine_id': mid,
                        'machine_name': machine_config['name'],
                        'machine_type': machine_config['type'],
                        'temperature': new_t,
                        'pressure': new_p,
                        'vibration': new_v,
                        'timestamp': vit['timestamp'],
                        'prediction': vit.get('prediction')
                    })
                except Exception as e:
                    print(f"[Simulation Worker] Logging error: {e}")
                
                updated_machines.append({
                    'machine_id': mid,
                    'machine_name': machine_config['name'],
                    'machine_type': machine_config['type'],
                    'vitals': {
                        'temperature': new_t,
                        'pressure': new_p,
                        'vibration': new_v,
                        'timestamp': vit['timestamp']
                    },
                    'prediction': vit.get('prediction')
                })
            
            # Broadcast updates to connected clients
            try:
                update_data = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'machines': updated_machines
                }
                vitals_update_queue.put(update_data, block=False)
            except queue.Full:
                # Queue full, skip this update
                pass

        # Sleep 30 seconds in 1s increments to allow prompt stop
        sleep_seconds = 30
        for _ in range(sleep_seconds):
            if not simulation_running:
                break
            time.sleep(1)
    
    print("[Simulation Worker] Stopped")

@machine_bp.route('/vitals/stream', methods=['GET'])
def stream_vitals():
    """Server-Sent Events endpoint for real-time vitals streaming"""
    def generate():
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to vitals stream'})}\n\n"
        
        # Create a local queue for this client
        client_queue = queue.Queue()
        
        while True:
            try:
                # Wait for updates with timeout
                try:
                    update = vitals_update_queue.get(timeout=5)
                    # Broadcast to all listeners
                    yield f"data: {json.dumps({'type': 'update', 'data': update})}\n\n"
                except queue.Empty:
                    # Send heartbeat to keep connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            except GeneratorExit:
                break
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

@machine_bp.route('/machines/<machine_id>/vitals/current', methods=['GET'])
def get_machine_current_vitals(machine_id):
    """Get current vitals for a specific machine"""
    try:
        with lock:
            vitals = CURRENT_MACHINE_VITALS.get(machine_id)
            
            if not vitals:
                return jsonify({
                    'success': False,
                    'error': f'Machine {machine_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': vitals
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/machines/<machine_id>/vitals/history', methods=['GET'])
def get_machine_vitals_history(machine_id):
    """Get vitals history for a specific machine"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        with lock:
            vitals = CURRENT_MACHINE_VITALS.get(machine_id)
            
            if not vitals:
                return jsonify({
                    'success': False,
                    'error': f'Machine {machine_id} not found'
                }), 404
            
            history = vitals.get('history', [])
            
            return jsonify({
                'success': True,
                'data': history[-limit:],
                'count': len(history[-limit:])
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/current', methods=['GET'])
def get_current_vitals():
    """Get current machine vitals"""
    try:
        vitals = generate_vitals()
        return jsonify({
            'success': True,
            'data': vitals
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/history', methods=['GET'])
def get_vitals_history():
    """Get historical vitals from log file"""
    try:
        limit = request.args.get('limit', 100, type=int)
        
        if not os.path.exists(LOG_FILE):
            return jsonify({
                'success': True,
                'data': []
            }), 200
        
        vitals_history = []
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
            
        # Get the last 'limit' lines
        for line in lines[-limit:]:
            try:
                vitals_history.append(json.loads(line.strip()))
            except json.JSONDecodeError:
                continue
        
        return jsonify({
            'success': True,
            'data': vitals_history,
            'count': len(vitals_history)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/simulation/start', methods=['POST'])
def start_simulation():
    """Start the vitals simulation"""
    global simulation_running, simulation_thread
    
    with lock:
        if simulation_running:
            return jsonify({
                'success': False,
                'message': 'Simulation is already running'
            }), 400
        
        simulation_running = True
        simulation_thread = threading.Thread(target=simulation_worker, daemon=True)
        simulation_thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Simulation started successfully'
        }), 200

@machine_bp.route('/simulation/stop', methods=['POST'])
def stop_simulation():
    """Stop the vitals simulation"""
    global simulation_running
    
    with lock:
        if not simulation_running:
            return jsonify({
                'success': False,
                'message': 'Simulation is not running'
            }), 400
        
        simulation_running = False
        
        return jsonify({
            'success': True,
            'message': 'Simulation stopped successfully'
        }), 200

@machine_bp.route('/simulation/status', methods=['GET'])
def get_simulation_status():
    """Get current simulation status"""
    return jsonify({
        'success': True,
        'data': {
            'running': simulation_running,
            'log_file': LOG_FILE
        }
    }), 200

@machine_bp.route('/vitals/clear-logs', methods=['DELETE'])
def clear_logs():
    """Clear the vitals log file"""
    try:
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
        
        return jsonify({
            'success': True,
            'message': 'Logs cleared successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/trigger-caution', methods=['POST'])
def trigger_caution_mode():
    """Trigger caution mode for sensors"""
    try:
        data = request.get_json() or {}
        duration = data.get('duration', 300)  # Default 5 minutes
        
        simulator.force_caution_mode(duration)
        
        return jsonify({
            'success': True,
            'message': f'Caution mode triggered for {duration} seconds',
            'mode': 'caution',
            'duration': duration
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/trigger-critical', methods=['POST'])
def trigger_critical_mode():
    """Trigger critical mode for sensors"""
    try:
        data = request.get_json() or {}
        duration = data.get('duration', 180)  # Default 3 minutes
        
        simulator.force_critical_mode(duration)
        
        return jsonify({
            'success': True,
            'message': f'Critical mode triggered for {duration} seconds',
            'mode': 'critical',
            'duration': duration
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/reset-normal', methods=['POST'])
def reset_to_normal():
    """Reset sensors to normal mode"""
    try:
        simulator.forced_mode = None
        simulator.forced_mode_start_time = None
        simulator.forced_mode_duration = 0
        simulator.simulation_mode = "normal"
        
        # Reset values to normal range
        simulator.current_values = {
            'temperature': 45.0,
            'pressure': 100.0,
            'vibration': 1.0
        }
        
        return jsonify({
            'success': True,
            'message': 'Sensors reset to normal mode',
            'mode': 'normal'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/ranges', methods=['GET'])
def get_sensor_ranges():
    """Get defined sensor ranges"""
    try:
        ranges = {}
        for sensor_type, range_obj in simulator.sensor_ranges.items():
            ranges[sensor_type] = {
                'normal': {'min': range_obj.normal_min, 'max': range_obj.normal_max},
                'caution': {'min': range_obj.caution_min, 'max': range_obj.caution_max},
                'critical': {'min': range_obj.critical_min, 'max': range_obj.critical_max},
                'unit': '°C' if sensor_type == 'temperature' else ('PSI' if sensor_type == 'pressure' else 'mm/s')
            }
        
        return jsonify({
            'success': True,
            'data': ranges
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/vitals/status', methods=['GET'])
def get_simulation_mode_status():
    """Get current simulation mode and status"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'simulation_running': simulation_running,
                'current_mode': simulator.forced_mode or simulator.simulation_mode,
                'forced_mode': simulator.forced_mode,
                'mode_remaining_seconds': (
                    max(0, simulator.forced_mode_duration - (time.time() - simulator.forced_mode_start_time))
                    if simulator.forced_mode_start_time else 0
                ),
                'current_readings': simulator.get_current_readings()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Define the 4 specific mining machines with their failure patterns
MINING_MACHINES = [
    {
        'id': '1',
        'name': 'Haul Truck HT-001',
        'type': 'Haul Truck',
        'status': 'online',
        'location': 'Pit Area A',
        'description': 'Used for transporting ore and waste',
        'common_failures': ['engine_breakdown', 'hydraulic_leak', 'tire_wear', 'transmission_fault'],
        'failure_descriptions': {
            'engine_breakdown': 'Engine mechanical failure or overheating',
            'hydraulic_leak': 'Hydraulic system pressure loss',
            'tire_wear': 'Excessive tire wear requiring replacement',
            'transmission_fault': 'Transmission system malfunction'
        }
    },
    {
        'id': '2',
        'name': 'Drill Rig DR-002',
        'type': 'Drill Rig',
        'status': 'online',
        'location': 'Blast Zone B',
        'description': 'Essential for drilling blast holes',
        'common_failures': ['drill_bit_wear', 'hydraulic_system_failure', 'motor_fault'],
        'failure_descriptions': {
            'drill_bit_wear': 'Drill bit requires replacement due to wear',
            'hydraulic_system_failure': 'Hydraulic system malfunction',
            'motor_fault': 'Drive motor electrical or mechanical fault'
        }
    },
    {
        'id': '3',
        'name': 'Shovel EX-003',
        'type': 'Shovel/Excavator',
        'status': 'online',
        'location': 'Loading Area C',
        'description': 'Used for loading ore into haul trucks',
        'common_failures': ['hydraulic_pump_failure', 'bucket_arm_wear', 'electrical_issue'],
        'failure_descriptions': {
            'hydraulic_pump_failure': 'Main hydraulic pump malfunction',
            'bucket_arm_wear': 'Bucket or arm structural wear',
            'electrical_issue': 'Electrical system or control malfunction'
        }
    },
    {
        'id': '4',
        'name': 'Crusher CR-004',
        'type': 'Crusher',
        'status': 'online',
        'location': 'Processing Plant D',
        'description': 'Used to break down mined ore',
        'common_failures': ['bearing_failure', 'liner_wear', 'motor_overheating', 'conveyor_jam'],
        'failure_descriptions': {
            'bearing_failure': 'Main bearing mechanical failure',
            'liner_wear': 'Crushing liner wear requiring replacement',
            'motor_overheating': 'Drive motor overheating',
            'conveyor_jam': 'Material jam in conveyor system'
        }
    }
]

@machine_bp.route('/machines', methods=['GET'])
def get_mining_machines():
    """Get all 4 mining machines with current vitals and failure predictions"""
    try:
        machines_with_data = []
        with lock:
            for machine in MINING_MACHINES:
                stored = CURRENT_MACHINE_VITALS.get(machine['id'])
                
                if stored:
                    machine_vitals = {
                        'temperature': stored.get('temperature', DATASET_STATS['temperature']['mean']),
                        'pressure': stored.get('pressure', DATASET_STATS['pressure']['mean']),
                        'vibration': stored.get('vibration', DATASET_STATS['vibration']['mean']),
                        'timestamp': stored.get('timestamp')
                    }
                    
                    # Use stored prediction if available
                    prediction = stored.get('prediction')
                else:
                    # fallback: derive from global simulator with small offsets
                    current_vitals = simulator.get_current_readings()
                    machine_vitals = {
                        'temperature': _extract_sensor_value(current_vitals, 'temperature', DATASET_STATS['temperature']['mean']) + random.uniform(-5, 5),
                        'pressure': _extract_sensor_value(current_vitals, 'pressure', DATASET_STATS['pressure']['mean']) + random.uniform(-8, 8),
                        'vibration': _extract_sensor_value(current_vitals, 'vibration', DATASET_STATS['vibration']['mean']) + random.uniform(-0.2, 0.2),
                        'timestamp': datetime.utcnow().isoformat()
                    }
                    prediction = None

                # Calculate health status based on vitals
                health_status = 'excellent'
                if (machine_vitals['temperature'] > 95 or 
                    machine_vitals['pressure'] > 180 or 
                    machine_vitals['vibration'] > 4):
                    health_status = 'critical'
                elif (machine_vitals['temperature'] > 85 or 
                      machine_vitals['pressure'] > 150 or 
                      machine_vitals['vibration'] > 2):
                    health_status = 'warning'
                elif (machine_vitals['temperature'] > 70 or 
                      machine_vitals['pressure'] > 120 or 
                      machine_vitals['vibration'] > 1.5):
                    health_status = 'good'

                if prediction:
                    # Use ML prediction
                    failure_risk = prediction.get('failure_risk', 0)
                    predicted_failure = prediction.get('predicted_failure_type', 'unknown')
                    estimated_hours = prediction.get('estimated_hours', 'N/A')
                    maintenance_priority = prediction.get('risk_level', 'low')
                    
                    if maintenance_priority == 'critical':
                        recommended_action = 'Shut down and perform immediate inspection'
                    elif maintenance_priority == 'high':
                        recommended_action = 'Schedule maintenance in next 24 hours'
                    elif maintenance_priority == 'medium':
                        recommended_action = 'Monitor closely and schedule preventive maintenance'
                    else:
                        recommended_action = 'Continue normal operations'
                    
                    machine_data = {
                        **machine,
                        'health_status': health_status,
                        'vitals': machine_vitals,
                        'operating_hours': random.randint(1500, 4000),
                        'efficiency': random.randint(70, 95),
                        'last_maintenance': '2024-10-15',
                        'next_maintenance': '2024-12-15',
                        'failure_prediction': {
                            'risk_level': failure_risk,
                            'predicted_failure_type': predicted_failure,
                            'failure_description': machine['failure_descriptions'].get(predicted_failure, ''),
                            'estimated_time_to_failure': f"{estimated_hours} hours",
                            'confidence': failure_risk,
                            'maintenance_priority': maintenance_priority,
                            'recommended_action': recommended_action,
                            'last_updated': prediction.get('timestamp')
                        }
                    }
                else:
                    # Fallback without prediction
                    machine_data = {
                        **machine,
                        'health_status': health_status,
                        'vitals': machine_vitals,
                        'operating_hours': random.randint(1500, 4000),
                        'efficiency': random.randint(70, 95),
                        'last_maintenance': '2024-10-15',
                        'next_maintenance': '2024-12-15',
                        'failure_prediction': None
                    }

                machines_with_data.append(machine_data)
        
        return jsonify({
            'success': True,
            'data': machines_with_data,
            'count': len(machines_with_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/machines/<machine_id>', methods=['GET'])
def get_machine_details(machine_id):
    """Get detailed information for a specific machine"""
    try:
        machine = next((m for m in MINING_MACHINES if m['id'] == machine_id), None)
        if not machine:
            return jsonify({
                'success': False,
                'error': 'Machine not found'
            }), 404
        
        # Use the latest in-memory vitals if available (kept updated by worker)
        with lock:
            stored = CURRENT_MACHINE_VITALS.get(machine_id)
            if stored:
                machine_vitals = {
                    'temperature': stored.get('temperature'),
                    'pressure': stored.get('pressure'),
                    'vibration': stored.get('vibration'),
                    'timestamp': stored.get('timestamp')
                }
            else:
                # fallback to simulator-based values
                current_vitals = simulator.get_current_readings()
                machine_vitals = {
                    'temperature': _extract_sensor_value(current_vitals, 'temperature', DATASET_STATS['temperature']['mean']) + random.uniform(-5, 5),
                    'pressure': _extract_sensor_value(current_vitals, 'pressure', DATASET_STATS['pressure']['mean']) + random.uniform(-8, 8),
                    'vibration': _extract_sensor_value(current_vitals, 'vibration', DATASET_STATS['vibration']['mean']) + random.uniform(-0.2, 0.2)
                }
        
        try:
            # Build 3-row synthetic history as fallback and prefer real log history
            sample_history = []
            for i in range(3):
                sample_history.append({
                    'Timestamp': (datetime.utcnow() - timedelta(minutes=(2 - i))).isoformat(),
                    'Temperature': machine_vitals['temperature'] + random.uniform(-1, 1),
                    'Pressure': machine_vitals['pressure'] + random.uniform(-0.5, 0.5),
                    'Vibration': machine_vitals['vibration'] + random.uniform(-0.05, 0.05)
                })

            history = get_recent_history_from_logs(limit=3)
            if not history:
                history = sample_history

            prediction_result = get_machine_specific_prediction(machine['type'], history)

            prob = prediction_result.get('most_likely_failure_probability', 0)
            if prob > 0.7:
                maintenance_priority = 'critical'
                recommended_action = 'Shut down and perform immediate inspection'
            elif prob > 0.5:
                maintenance_priority = 'high'
                recommended_action = 'Schedule maintenance in next 24 hours'
            elif prob > 0.3:
                maintenance_priority = 'medium'
                recommended_action = 'Monitor closely and schedule preventive maintenance'
            else:
                maintenance_priority = 'low'
                recommended_action = 'Continue normal operations'

            detailed_data = {
                **machine,
                'vitals': machine_vitals,
                'operating_hours': random.randint(1500, 4000),
                'efficiency': random.randint(70, 95),
                'last_maintenance': '2024-07-15',
                'next_maintenance': '2024-09-15',
                'maintenance_history': [
                    {'date': '2024-07-15', 'type': 'Routine', 'duration': '4 hours'},
                    {'date': '2024-05-20', 'type': 'Repair', 'duration': '8 hours'},
                    {'date': '2024-03-10', 'type': 'Routine', 'duration': '3 hours'}
                ],
                'failure_prediction': {
                    'predicted_failure_type': prediction_result.get('most_likely_failure'),
                    'failure_description': machine['failure_descriptions'].get(prediction_result.get('most_likely_failure', ''), ''),
                    'estimated_time_to_failure': f"{prediction_result.get('most_likely_failure_estimated_hours', 'N/A')} hours",
                    'confidence': int(prediction_result.get('most_likely_failure_probability', 0)*100),
                    'maintenance_priority': maintenance_priority,
                    'recommended_action': recommended_action
                }
            }
        except Exception as e:
            # fallback
            detailed_data = {
                **machine,
                'vitals': machine_vitals,
                'operating_hours': random.randint(1500, 4000),
                'efficiency': random.randint(70, 95),
                'last_maintenance': '2024-07-15',
                'next_maintenance': '2024-09-15',
                'maintenance_history': [
                    {'date': '2024-07-15', 'type': 'Routine', 'duration': '4 hours'},
                    {'date': '2024-05-20', 'type': 'Repair', 'duration': '8 hours'},
                    {'date': '2024-03-10', 'type': 'Routine', 'duration': '3 hours'}
                ]
            }
        
        return jsonify({
            'success': True,
            'data': detailed_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@machine_bp.route('/machines/<machine_id>/status', methods=['PATCH'])
def update_machine_status(machine_id):
    """Update machine status (online/offline/maintenance)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        if new_status not in ['online', 'offline', 'maintenance']:
            return jsonify({
                'success': False,
                'error': 'Invalid status. Must be one of: online, offline, maintenance'
            }), 400
        
        # Find the machine in MINING_MACHINES
        machine = next((m for m in MINING_MACHINES if m['id'] == machine_id), None)
        if not machine:
            return jsonify({
                'success': False,
                'error': f'Machine {machine_id} not found'
            }), 404
        
        # Update the status
        with lock:
            machine['status'] = new_status
            
            # Also update in CURRENT_MACHINE_VITALS if it exists
            if machine_id in CURRENT_MACHINE_VITALS:
                CURRENT_MACHINE_VITALS[machine_id]['status'] = new_status
        
        return jsonify({
            'success': True,
            'message': f'Machine {machine["name"]} status updated to {new_status}',
            'data': {
                'id': machine_id,
                'name': machine['name'],
                'status': new_status
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
