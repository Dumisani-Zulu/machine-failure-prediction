// test-connection.js - Simple script to test the API connection
const API_URL = 'http://localhost:5000';

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health check
    const healthResponse = await fetch(`${API_URL}/`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test prediction endpoint (need at least 3 data points for rolling features)
    const testData = [
      {
        "Timestamp": "2025-07-15 10:00:00",
        "Temperature": 75.0,
        "Vibration": 0.5,
        "Pressure": 10.0
      },
      {
        "Timestamp": "2025-07-15 11:00:00", 
        "Temperature": 76.0,
        "Vibration": 0.6,
        "Pressure": 11.0
      },
      {
        "Timestamp": "2025-07-15 12:00:00",
        "Temperature": 77.0,
        "Vibration": 0.7,
        "Pressure": 12.0
      }
    ];
    
    const predictionResponse = await fetch(`${API_URL}/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const predictionData = await predictionResponse.json();
    console.log('✅ Prediction test:', predictionData);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

// Run the test
testConnection();
