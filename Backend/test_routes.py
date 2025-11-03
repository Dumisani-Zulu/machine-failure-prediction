# Test script for prediction routes
from flask import Flask
from routes.prediction_routes import prediction_bp
import json

# Create a test Flask app
app = Flask(__name__)
app.register_blueprint(prediction_bp, url_prefix='/api')

# Test the import and blueprint registration
if __name__ == '__main__':
    print("Testing prediction routes...")
    
    with app.test_client() as client:
        # Test data that matches the expected format
        test_data = [
            {'Timestamp': '2023-01-01 00:00:00', 'Temperature': 75.0, 'Vibration': 0.4, 'Pressure': 100.0},
            {'Timestamp': '2023-01-01 01:00:00', 'Temperature': 80.0, 'Vibration': 0.45, 'Pressure': 105.0},
            {'Timestamp': '2023-01-01 02:00:00', 'Temperature': 85.0, 'Vibration': 0.5, 'Pressure': 110.0}
        ]
        
        # Test the predict endpoint
        response = client.post('/api/predict', 
                             data=json.dumps(test_data),
                             content_type='application/json')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
        if response.status_code == 200:
            print("✅ Routes are working correctly!")
        else:
            print("❌ There's an issue with the routes")
