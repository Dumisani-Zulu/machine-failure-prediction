# Machine Learning Prediction App

This application consists of a Flask backend with machine learning capabilities and a Next.js frontend for user interaction.

## Starting the app
### Backend
cd backend
python app.py

### Frontend
cd frontend
npm run dev

## Project Structure

```
machine/
├── Backend/                 # Flask API server
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic
│   └── ml/                 # Machine learning models and utilities
├── frontend/               # Next.js React application
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and API client
│   ├── types/              # TypeScript type definitions
│   └── package.json        # Node.js dependencies
├── start-dev.ps1           # PowerShell script to start both servers
└── start-dev.bat           # Batch script to start both servers
```

## Quick Start

### Option 1: Use the startup script (Recommended)

1. **PowerShell (Windows):**
   ```powershell
   .\start-dev.ps1
   ```

2. **Command Prompt (Windows):**
   ```cmd
   start-dev.bat
   ```

### Option 2: Manual setup

1. **Start the Flask Backend:**
   ```bash
   cd Backend
   pip install -r requirements.txt
   python app.py
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Next.js Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## Features

- **Flask Backend:**
  - RESTful API with CORS enabled
  - Machine learning prediction endpoint (`/ml/predict`)
  - Error handling and validation
  - Pre-trained ML model for failure prediction

- **Next.js Frontend:**
  - React-based user interface
  - TypeScript for type safety
  - Tailwind CSS for styling
  - API integration with the Flask backend
  - Real-time connection testing
  - Interactive prediction form

## API Endpoints

### Backend (Flask)

- `GET /` - Health check endpoint
- `POST /ml/predict` - Machine learning prediction endpoint

#### Example prediction request:
```json
{
  "temperature": 75,
  "vibration": 0.5,
  "pressure": 10,
  "humidity": 60,
  "speed": 1500
}
```

## Environment Configuration

The frontend uses environment variables for configuration:

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:5000`)

## Development

### Backend Development
- Flask runs in debug mode by default
- Changes to Python files will automatically restart the server

### Frontend Development
- Next.js runs with Turbopack for fast development
- Changes to React components will hot-reload automatically

## Production Deployment

### Backend
1. Set `debug=False` in `app.py`
2. Use a production WSGI server like Gunicorn
3. Configure proper CORS origins

### Frontend
1. Update `NEXT_PUBLIC_API_URL` to your production backend URL
2. Run `npm run build`
3. Deploy the built application

## Troubleshooting

### Connection Issues
1. Ensure both servers are running
2. Check that ports 3000 and 5000 are available
3. Verify CORS configuration in the Flask backend
4. Test the "Test Backend Connection" button in the frontend

### Dependencies
- Python 3.7+ required for Backend
- Node.js 18+ required for Frontend
- Install all dependencies as listed in requirements.txt and package.json
