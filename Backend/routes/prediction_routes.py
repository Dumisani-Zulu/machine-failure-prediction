# backend/routes/prediction_routes.py

from flask import Blueprint, request, jsonify
from services.prediction_service import get_prediction, get_machine_specific_prediction
from flask_cors import CORS # Make sure you installed Flask-CORS

prediction_bp = Blueprint('prediction_bp', __name__)

# Apply CORS to this blueprint or specific routes
# For development, allow all origins. In production, restrict to your Next.js frontend origin.
CORS(prediction_bp)

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    raw_data = request.get_json()

    if not raw_data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Call the prediction service
        prediction_result = get_prediction(raw_data)
        return jsonify(prediction_result), 200
    except ValueError as ve:
        # Handle specific data validation errors
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        # Handle general prediction errors
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@prediction_bp.route('/predict/machine/<machine_type>', methods=['POST'])
def predict_machine_specific(machine_type):
    """Machine-specific failure prediction"""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    raw_data = request.get_json()

    if not raw_data:
        return jsonify({"error": "No data provided"}), 400

    # Validate machine type
    valid_machine_types = ['Haul Truck', 'Drill Rig', 'Shovel/Excavator', 'Crusher']
    if machine_type not in valid_machine_types:
        return jsonify({"error": f"Invalid machine type. Must be one of: {valid_machine_types}"}), 400

    try:
        # Call the machine-specific prediction service
        prediction_result = get_machine_specific_prediction(machine_type, raw_data)
        return jsonify(prediction_result), 200
    except ValueError as ve:
        # Handle specific data validation errors
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        # Handle general prediction errors
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500