# Frontend-Backend Connection Setup

## Overview
I've successfully connected your Next.js frontend to your Flask backend with a complete machine learning prediction interface.

## What Was Created

### 1. Frontend Components
- **`/types/index.ts`**: TypeScript types for sensor data and API responses
- **`/lib/api.ts`**: API client for communicating with the Flask backend
- **`/components/PredictionForm.tsx`**: Form for inputting sensor data and displaying predictions
- **`/components/StatusPanel.tsx`**: Real-time backend connection status monitoring
- **`/app/page.tsx`**: Updated dashboard page with ML prediction interface

### 2. Environment Configuration
- **`.env.local`**: Contains backend API URL configuration

## How to Start the Application

### Step 1: Start the Backend (Flask)
```bash
cd Backend
python app.py
```
This will start the Flask server at http://localhost:5000

### Step 2: Start the Frontend (Next.js) 
```bash
cd Frontend
npm run dev
```
This will start the Next.js server at http://localhost:3000

### Alternative: Use the provided startup script
```bash
./start-dev.bat
```

## Features

### Connection Status
- Real-time monitoring of backend connectivity
- Automatic connection testing every 30 seconds
- Manual refresh capability

### Machine Learning Prediction
- Interactive form for sensor data input:
  - Temperature (°C)
  - Pressure (Pa) 
  - Vibration (mm/s)
  - Humidity (%)
  - Speed (RPM)
- Real-time prediction results showing:
  - Failure prediction (Yes/No)
  - Failure probability percentage
  - Normal operation probability percentage
  - Visual probability bar

### Sample Data
- Quick "Sample Data" button to fill the form with test values

## API Endpoints

### Backend (Flask)
- `GET /` - Health check
- `POST /ml/predict` - Machine learning predictions

### Request Format
```json
{
  "temperature": 75.5,
  "pressure": 150.2,
  "vibration": 8.7,
  "humidity": 45.3,
  "speed": 2150
}
```

### Response Format
```json
{
  "prediction": 1,
  "probability_no_failure": 0.25,
  "probability_failure": 0.75
}
```

## Next Steps

1. **Start both servers** using the commands above
2. **Open http://localhost:3000** in your browser
3. **Test the connection** - the status panel should show "Connected"
4. **Try predictions** by entering sensor data or using sample data
5. **Monitor real-time predictions** for machine failure analysis

## Troubleshooting

### Backend Issues
- Ensure Python dependencies are installed: `pip install -r requirements.txt`
- Check if port 5000 is available
- Verify the ML model files exist in `/Backend/ml/model/`

### Frontend Issues
- Ensure Node.js dependencies are installed: `npm install` or `pnpm install`
- Check if port 3000 is available
- Verify the backend URL in `.env.local`

### CORS Issues
- The backend already has CORS enabled for cross-origin requests
- If issues persist, check the CORS configuration in `prediction_routes.py`

## Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5000)

The application is now fully connected and ready to use!
