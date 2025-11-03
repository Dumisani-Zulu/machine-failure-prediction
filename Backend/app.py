# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
# from routes.auth import auth_bp  # Comment out - file doesn't exist yet
# from routes.api import api_bp # Comment out - file doesn't exist yet
from routes.prediction_routes import prediction_bp # Import your new blueprint
from routes.machine_routes import machine_bp # Import machine vitals blueprint
from ml.utils import load_ml_artifacts # Import to ensure model is loaded on startup
import threading
import routes.machine_routes as machine_routes

app = Flask(__name__)
CORS(app) # Apply CORS to the entire app, or just specific blueprints/routes as needed

# Load ML artifacts when the app starts
with app.app_context():
    load_ml_artifacts() # This will load your model and scaler when the app context is pushed

# Register blueprints
# app.register_blueprint(auth_bp, url_prefix='/auth')  # Comment out - blueprint doesn't exist yet
# app.register_blueprint(api_bp, url_prefix='/api')  # Comment out - blueprint doesn't exist yet
app.register_blueprint(prediction_bp, url_prefix='/ml') # Prefix your ML API calls with /ml
app.register_blueprint(machine_bp, url_prefix='/machine') # Prefix machine vitals API calls with /machine

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Fullstack Flask Backend!"})

if __name__ == '__main__':
    # Optionally auto-start the vitals simulation worker so vitals stream immediately
    try:
        with machine_routes.lock:
            if not getattr(machine_routes, 'simulation_running', False):
                machine_routes.simulation_running = True
                machine_routes.simulation_thread = threading.Thread(target=machine_routes.simulation_worker, daemon=True)
                machine_routes.simulation_thread.start()
                print('Auto-started vitals simulation worker')
    except Exception as e:
        print(f'Failed to auto-start simulation worker: {e}')

    app.run(debug=True) # Set debug=False in production