# backend/services/prediction_service.py

from ml.utils import load_ml_artifacts, preprocess_input_data
import pandas as pd # Import pandas here as well for data handling
import random
from datetime import datetime, timedelta
import os

# Load artifacts once when this module is imported
# This ensures the model and scaler are ready before the first request
model, scaler = load_ml_artifacts()

# Machine-specific failure prediction weights
MACHINE_FAILURE_WEIGHTS = {
    'Haul Truck': {
        'engine_breakdown': {'temp_weight': 0.4, 'pressure_weight': 0.3, 'vibration_weight': 0.3},
        'hydraulic_leak': {'temp_weight': 0.2, 'pressure_weight': 0.6, 'vibration_weight': 0.2},
        'tire_wear': {'temp_weight': 0.1, 'pressure_weight': 0.2, 'vibration_weight': 0.7},
        'transmission_fault': {'temp_weight': 0.3, 'pressure_weight': 0.4, 'vibration_weight': 0.3}
    },
    'Drill Rig': {
        'drill_bit_wear': {'temp_weight': 0.3, 'pressure_weight': 0.2, 'vibration_weight': 0.5},
        'hydraulic_system_failure': {'temp_weight': 0.2, 'pressure_weight': 0.7, 'vibration_weight': 0.1},
        'motor_fault': {'temp_weight': 0.5, 'pressure_weight': 0.3, 'vibration_weight': 0.2}
    },
    'Shovel/Excavator': {
        'hydraulic_pump_failure': {'temp_weight': 0.3, 'pressure_weight': 0.6, 'vibration_weight': 0.1},
        'bucket_arm_wear': {'temp_weight': 0.2, 'pressure_weight': 0.3, 'vibration_weight': 0.5},
        'electrical_issue': {'temp_weight': 0.4, 'pressure_weight': 0.2, 'vibration_weight': 0.4}
    },
    'Crusher': {
        'bearing_failure': {'temp_weight': 0.3, 'pressure_weight': 0.2, 'vibration_weight': 0.5},
        'liner_wear': {'temp_weight': 0.2, 'pressure_weight': 0.4, 'vibration_weight': 0.4},
        'motor_overheating': {'temp_weight': 0.6, 'pressure_weight': 0.3, 'vibration_weight': 0.1},
        'conveyor_jam': {'temp_weight': 0.2, 'pressure_weight': 0.3, 'vibration_weight': 0.5}
    }
}

def get_prediction(raw_input_data: dict) -> dict:
    try:
        # Convert the incoming data (which might be a list of dicts for windowing) to a DataFrame
        # Ensure it handles single dict or list of dicts correctly
        if isinstance(raw_input_data, dict):
            input_df = pd.DataFrame([raw_input_data])
        elif isinstance(raw_input_data, list):
            input_df = pd.DataFrame(raw_input_data)
        else:
            raise ValueError("Input data must be a dictionary or a list of dictionaries.")

        # Normalize column names (accept both lower and Title case keys)
        col_map = {}
        mapping = {
            'temperature': 'Temperature',
            'vibration': 'Vibration',
            'pressure': 'Pressure',
            'timestamp': 'Timestamp'
        }
        for c in input_df.columns:
            lc = str(c).strip().lower()
            if lc in mapping:
                col_map[c] = mapping[lc]

        if col_map:
            input_df = input_df.rename(columns=col_map)

        # If Timestamp is missing, create recent timestamps so rolling features can be computed
        if 'Timestamp' not in input_df.columns:
            now = datetime.utcnow()
            # create timestamps spaced 1 minute apart ending at 'now'
            rows = input_df.shape[0]
            generated = [((now - timedelta(minutes=(rows - i - 1))).isoformat()) for i in range(rows)]
            input_df['Timestamp'] = generated

        # Preprocess the input data
        # This function handles feature engineering and scaling
        processed_data_for_prediction = preprocess_input_data(input_df)

        # Make prediction. Predict on the *last* row of the processed data,
        # as that represents the most current reading's features.
        # Ensure it's reshaped for single sample prediction: (1, -1)
        single_sample_for_prediction = processed_data_for_prediction[-1].reshape(1, -1)

        prediction_label = model.predict(single_sample_for_prediction)[0]
        prediction_proba = model.predict_proba(single_sample_for_prediction)[0].tolist() # Convert numpy array to list

        return {
            "prediction": int(prediction_label), # Convert numpy int to Python int
            "probability_no_failure": prediction_proba[0],
            "probability_failure": prediction_proba[1]
        }
    except ValueError as ve:
        # Catch specific data processing errors
        print(f"Data processing error: {ve}")
        raise ValueError(f"Invalid input data for prediction: {ve}")
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Error during prediction: {e}")
        raise RuntimeError(f"An error occurred during prediction: {e}")

def get_machine_specific_prediction(machine_type: str, raw_input_data: dict) -> dict:
    """
    Get prediction with machine-specific failure type analysis
    """
    try:
        # Ensure we have at least 3 rows for rolling features required by the model.
        # If a single dict is provided, expand it into 3 similar timestamped rows.
        if isinstance(raw_input_data, dict):
            base = raw_input_data
            now = datetime.utcnow()
            history_for_prediction = []
            for i in range(3):
                # small deterministic offsets (no randomness)
                history_for_prediction.append({
                    'Timestamp': (now - timedelta(minutes=(2 - i))).isoformat(),
                    'Temperature': base.get('temperature') or base.get('Temperature'),
                    'Pressure': base.get('pressure') or base.get('Pressure'),
                    'Vibration': base.get('vibration') or base.get('Vibration')
                })
        elif isinstance(raw_input_data, list):
            if len(raw_input_data) >= 3:
                history_for_prediction = raw_input_data
            else:
                # pad by repeating last element with adjusted timestamps
                now = datetime.utcnow()
                history_for_prediction = []
                for i in range(3 - len(raw_input_data)):
                    history_for_prediction.append({
                        'Timestamp': (now - timedelta(minutes=(2 - i))).isoformat(),
                        'Temperature': raw_input_data[0].get('temperature') or raw_input_data[0].get('Temperature'),
                        'Pressure': raw_input_data[0].get('pressure') or raw_input_data[0].get('Pressure'),
                        'Vibration': raw_input_data[0].get('vibration') or raw_input_data[0].get('Vibration')
                    })
                # append existing
                for item in raw_input_data:
                    history_for_prediction.append(item)
        else:
            history_for_prediction = []

        # First get the general failure prediction (on padded/expanded history)
        try:
            general_prediction = get_prediction(history_for_prediction) if history_for_prediction else get_prediction(raw_input_data)
        except Exception:
            # If general prediction fails, continue with machine-specific heuristic only
            general_prediction = {
                "prediction": None,
                "probability_no_failure": None,
                "probability_failure": None
            }

        # If no machine-specific weights available, return general prediction
        if machine_type not in MACHINE_FAILURE_WEIGHTS:
            return {
                **general_prediction,
                "machine_type": machine_type,
                "specific_failure_predictions": {}
            }

        # Extract the latest reading (support dict or list of dicts)
        if isinstance(raw_input_data, list) and raw_input_data:
            latest = raw_input_data[-1]
        elif isinstance(raw_input_data, dict):
            latest = raw_input_data
        elif isinstance(history_for_prediction, list) and history_for_prediction:
            latest = history_for_prediction[-1]
        else:
            latest = {}

        # Support either lowercase or Title-case keys
        def _get_val(d, *keys, default=0):
            for k in keys:
                if k in d:
                    return d[k]
            # try lower-case keys
            for k in keys:
                if k.lower() in d:
                    return d[k.lower()]
            return default

        temp = _get_val(latest, 'temperature', 'Temperature', default=0)
        pressure = _get_val(latest, 'pressure', 'Pressure', default=0)
        vibration = _get_val(latest, 'vibration', 'Vibration', default=0)

        # Normalize sensor values (assuming normal ranges)
        # Normalize using ranges similar to the training data:
        # Temperature roughly 60-110 °C, Pressure roughly 80-125 (dataset units), Vibration roughly 0-1 mm/s
        try:
            temp_val = float(temp)
        except Exception:
            temp_val = 0.0
        try:
            pressure_val = float(pressure)
        except Exception:
            pressure_val = 0.0
        try:
            vibration_val = float(vibration)
        except Exception:
            vibration_val = 0.0

        temp_normalized = min(max((temp_val - 60) / 50, 0), 1)
        pressure_normalized = min(max((pressure_val - 80) / 45, 0), 1)
        vibration_normalized = min(max(vibration_val / 1.2, 0), 1)

        specific_failure_predictions = {}
        failure_weights = MACHINE_FAILURE_WEIGHTS[machine_type]

        for failure_type, weights in failure_weights.items():
            # Calculate weighted score based on sensor readings
            failure_score = (
                temp_normalized * weights.get('temp_weight', 0) +
                pressure_normalized * weights.get('pressure_weight', 0) +
                vibration_normalized * weights.get('vibration_weight', 0)
            )

            # Deterministic scale to probability (no randomness)
            failure_probability = min(max(failure_score, 0), 1)

            # Estimate time to failure in hours: higher probability => shorter ETA
            estimated_hours = max(1, int((1.0 - failure_probability) * 168))  # scale up to 1 week (168 hours)

            specific_failure_predictions[failure_type] = {
                "probability": failure_probability,
                "risk_level": "critical" if failure_probability > 0.7 else 
                            "high" if failure_probability > 0.5 else 
                            "medium" if failure_probability > 0.3 else "low",
                "estimated_time_to_failure_hours": estimated_hours
            }

        # Find the most likely failure type
        most_likely_failure = max(specific_failure_predictions.items(), 
                                key=lambda x: x[1]['probability'])

        return {
            **general_prediction,
            "machine_type": machine_type,
            "most_likely_failure": most_likely_failure[0],
            "most_likely_failure_probability": most_likely_failure[1]['probability'],
            "most_likely_failure_estimated_hours": most_likely_failure[1]['estimated_time_to_failure_hours'],
            "specific_failure_predictions": specific_failure_predictions
        }
        
    except Exception as e:
        print(f"Error in machine-specific prediction: {e}")
        # Fallback to general prediction
        general_prediction = get_prediction(raw_input_data)
        return {
            **general_prediction,
            "machine_type": machine_type,
            "error": f"Machine-specific analysis failed: {str(e)}"
        }