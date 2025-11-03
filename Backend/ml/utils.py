# backend/ml_model/utils.py

import os
import joblib
import pandas as pd
import numpy as np

# Global variables to hold the loaded model and scaler to avoid reloading on every request
_model = None
_scaler = None

def _get_model_path():
    """Helper to get the absolute path to the trained model directory."""
    # This path is relative to the current file (utils.py)
    return os.path.join(os.path.dirname(__file__), 'model')

def load_ml_artifacts():
    """
    Loads the pre-trained machine learning model and scaler.
    These are loaded only once when the function is first called.
    """
    global _model, _scaler
    if _model is None:
        model_path = os.path.join(_get_model_path(), 'failure_prediction_model.pkl')
        _model = joblib.load(model_path)
        print(f"ML Model loaded from: {model_path}")

    if _scaler is None:
        scaler_path = os.path.join(_get_model_path(), 'scaler.pkl')
        _scaler = joblib.load(scaler_path)
        print(f"Scaler loaded from: {scaler_path}")

    return _model, _scaler

def preprocess_input_data(input_data: pd.DataFrame) -> pd.DataFrame:
    if _scaler is None:
        # This means load_ml_artifacts wasn't called or failed
        raise RuntimeError("Scaler not loaded. Call load_ml_artifacts() first.")

    if 'Timestamp' in input_data.columns:
        input_data['Timestamp'] = pd.to_datetime(input_data['Timestamp'])
        input_data['hour'] = input_data['Timestamp'].dt.hour
        input_data['day_of_week'] = input_data['Timestamp'].dt.dayofweek
    else:
        pass 
    input_data.columns = input_data.columns.str.strip()


    window_size = 3
    for col in ['Temperature', 'Vibration', 'Pressure']:
        input_data[f'{col}_mean_{window_size}'] = input_data[col].rolling(window=window_size).mean()
        input_data[f'{col}_std_{window_size}'] = input_data[col].rolling(window=window_size).std()
        input_data[f'{col}_max_{window_size}'] = input_data[col].rolling(window=window_size).max()
        input_data[f'{col}_min_{window_size}'] = input_data[col].rolling(window=window_size).min()

    input_data = input_data.dropna()

    if input_data.empty:
        raise ValueError(f"Input data resulted in empty DataFrame after processing, likely due to insufficient history ({window_size} rows needed for rolling features).")

    expected_features = [
        'Temperature', 'Vibration', 'Pressure', 'hour', 'day_of_week',
        'Temperature_mean_3', 'Temperature_std_3', 'Temperature_max_3', 'Temperature_min_3',
        'Vibration_mean_3', 'Vibration_std_3', 'Vibration_max_3', 'Vibration_min_3',
        'Pressure_mean_3', 'Pressure_std_3', 'Pressure_max_3', 'Pressure_min_3'
    ]
    processed_df = input_data[expected_features] 

    scaled_data = _scaler.transform(processed_df)

    return scaled_data

if __name__ == '__main__':
    dummy_data = pd.DataFrame([
        {'Timestamp': '2023-01-01 00:00:00', 'Temperature': 25.0, 'Vibration': 10.0, 'Pressure': 100.0},
        {'Timestamp': '2023-01-01 01:00:00', 'Temperature': 26.0, 'Vibration': 11.0, 'Pressure': 101.0},
        {'Timestamp': '2023-01-01 02:00:00', 'Temperature': 27.0, 'Vibration': 12.0, 'Pressure': 102.0}
    ])
    # The actual prediction will be made on the LAST row of this DataFrame after rolling features are computed.

    try:
        model, scaler = load_ml_artifacts()
        processed_input = preprocess_input_data(dummy_data)
        # We need to predict on the *last* row's processed features if this is a streaming scenario
        if processed_input.shape[0] > 0:
            prediction = model.predict(processed_input[-1].reshape(1, -1)) # Predict on the last row
            print(f"Dummy Prediction: {prediction[0]}")
            prediction_proba = model.predict_proba(processed_input[-1].reshape(1, -1))
            print(f"Dummy Prediction Probabilities: {prediction_proba[0]}")
        else:
            print("No valid data for prediction after preprocessing.")
    except Exception as e:
        print(f"Error during dummy prediction: {e}")