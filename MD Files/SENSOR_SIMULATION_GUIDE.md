# Sensor Data Simulation System

## Overview
This system implements a comprehensive sensor data simulation with three operational ranges (Normal, Caution, Critical) and an email alert system for machine monitoring.

## Sensor Ranges

### Temperature (°C)
- **Normal Range**: 20.0 - 85.0°C
- **Caution Range**: 85.1 - 95.0°C  
- **Critical Range**: ≥95.1°C

### Pressure (PSI)
- **Normal Range**: 50.0 - 150.0 PSI
- **Caution Range**: 150.1 - 180.0 PSI
- **Critical Range**: ≥180.1 PSI

### Vibration (mm/s)
- **Normal Range**: 0.1 - 2.0 mm/s
- **Caution Range**: 2.1 - 4.0 mm/s
- **Critical Range**: ≥4.1 mm/s

## Alert System

### Behavior
- **Normal Range**: No alerts sent
- **Caution Range**: Warning alerts sent (with 5-minute cooldown)
- **Critical Range**: Critical alerts sent immediately (with 5-minute cooldown)

### Email Configuration
To enable email alerts, create a `.env` file in the Backend directory with:
```
ALERT_EMAIL=your-alert-email@gmail.com
ALERT_EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@yourcompany.com
```

## Control Features

### Available Controls
1. **Trigger Caution Mode**: Forces sensors into caution range for 5 minutes
2. **Trigger Critical Mode**: Forces sensors into critical range for 3 minutes  
3. **Reset to Normal**: Immediately returns all sensors to normal operating range

### API Endpoints
- `POST /machine/vitals/trigger-caution` - Trigger caution mode
- `POST /machine/vitals/trigger-critical` - Trigger critical mode
- `POST /machine/vitals/reset-normal` - Reset to normal mode
- `GET /machine/vitals/ranges` - Get sensor range definitions
- `GET /machine/vitals/status` - Get current simulation status

## Data Simulation Behavior

### Normal Operation
- Sensors vary by small amounts (±3% of current value)
- Values stay within normal ranges
- No alerts are generated

### Caution Mode
- Sensors spike to caution range values
- Small variations within caution range
- Warning alerts sent (with cooldown)

### Critical Mode  
- Sensors spike to critical range values
- Larger variations within critical range
- Critical alerts sent immediately (with cooldown)

## Features Implemented

✅ **Sensor Range Definitions**: Clear normal, caution, and critical ranges
✅ **Progressive Alert System**: No alerts → Warning alerts → Critical alerts  
✅ **Email Alert System**: HTML formatted emails with detailed sensor information
✅ **Control Buttons**: Easy-to-use interface for testing different modes
✅ **Real-time Monitoring**: Live updating dashboard with status indicators
✅ **Alert Cooldown**: Prevents spam alerts (5-minute intervals)
✅ **Automatic Mode Expiry**: Forced modes automatically return to normal
✅ **Status Indicators**: Clear visual feedback for current operating mode

## Usage

1. **Start Simulation**: Click "Start" to begin normal sensor simulation
2. **Test Caution**: Click "Trigger Caution" to simulate warning conditions
3. **Test Critical**: Click "Trigger Critical" to simulate emergency conditions  
4. **Reset**: Click "Reset Normal" to immediately return to normal operation
5. **Monitor**: Watch real-time sensor values and status changes
6. **Email Alerts**: Configure email settings to receive actual alert notifications

## Technical Implementation

- **Backend**: Flask with CORS support, threaded simulation worker
- **Frontend**: React with TypeScript, real-time updates every 5 seconds
- **Data Structure**: Comprehensive sensor objects with value, status, and timestamp
- **Error Handling**: Graceful fallbacks for missing data or connection issues
- **Responsive Design**: Works on desktop and mobile devices
