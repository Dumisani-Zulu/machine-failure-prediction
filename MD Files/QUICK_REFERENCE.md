# Quick Reference - Real-Time Vitals System

## 🚀 Quick Start

```bash
# Terminal 1 - Start Backend
cd Backend
python app.py

# Terminal 2 - Start Frontend  
cd Frontend
pnpm run dev

# Open Browser
http://localhost:3001/vitals
```

## 📡 API Endpoints

### Machines
```bash
# Get all machines with vitals and predictions
GET http://localhost:5000/machine/machines

# Get specific machine details
GET http://localhost:5000/machine/machines/1
```

### Vitals
```bash
# Current vitals for specific machine
GET http://localhost:5000/machine/machines/1/vitals/current

# Vitals history for specific machine
GET http://localhost:5000/machine/machines/1/vitals/history?limit=20

# Real-time stream (SSE)
GET http://localhost:5000/machine/vitals/stream
```

### Simulation Control
```bash
# Start simulation
POST http://localhost:5000/machine/simulation/start

# Stop simulation
POST http://localhost:5000/machine/simulation/stop

# Check status
GET http://localhost:5000/machine/simulation/status
```

## 🎯 Key Features

| Feature | Description | Update Frequency |
|---------|-------------|------------------|
| Vitals Generation | Realistic sensor value simulation | Every 30 seconds |
| ML Predictions | Automatic failure prediction | Every 30 seconds |
| Dashboard Updates | Frontend auto-refresh | Every 30 seconds |
| SSE Streaming | Real-time push notifications | Instant |
| History Storage | Per-machine vitals history | Last 10 readings |
| Logging | File-based vitals logs | Every update |

## 📊 Sensor Ranges

### Temperature (°C)
- ✅ Normal: 20-85
- ⚠️ Caution: 85-95
- ❌ Critical: 95+

### Pressure (PSI)
- ✅ Normal: 50-150
- ⚠️ Caution: 150-180
- ❌ Critical: 180+

### Vibration (mm/s)
- ✅ Normal: 0.1-2.0
- ⚠️ Caution: 2.0-4.0
- ❌ Critical: 4.0+

## 🤖 Machine Types

### 1. Haul Truck (Machine 1)
- **Failures**: Engine breakdown, hydraulic leak, tire wear, transmission fault
- **Key Sensor**: Temperature (40%)

### 2. Drill Rig (Machine 2)
- **Failures**: Drill bit wear, hydraulic system failure, motor fault
- **Key Sensor**: Vibration (50%)

### 3. Shovel/Excavator (Machine 3)
- **Failures**: Hydraulic pump failure, bucket arm wear, electrical issue
- **Key Sensor**: Pressure (60%)

### 4. Crusher (Machine 4)
- **Failures**: Bearing failure, liner wear, motor overheating, conveyor jam
- **Key Sensor**: Varies

## 🎨 Status Colors

| Color | Status | Risk Level |
|-------|--------|-----------|
| 🟢 Green | Excellent/Normal | Low (0-25%) |
| 🔵 Blue | Good | Low-Medium (26-40%) |
| 🟡 Yellow | Warning/Caution | Medium (41-60%) |
| 🔴 Red | Critical | High/Critical (61-100%) |

## 💻 Code Structure

### Backend Key Files
```
Backend/
├── app.py                          # Flask app entry point
├── routes/
│   └── machine_routes.py           # Machine vitals API
├── services/
│   ├── sensor_simulation.py        # Sensor simulator
│   └── prediction_service.py       # ML prediction service
└── logs/
    └── machine_vitals.log          # Vitals log file
```

### Frontend Key Files
```
Frontend/
├── app/
│   └── vitals/
│       └── page.tsx                # Main vitals dashboard
└── lib/
    └── api.ts                      # API client
```

## 🔍 Common Tasks

### Check if Simulation is Running
```bash
curl http://localhost:5000/machine/simulation/status
```

### Get Latest Vitals for Machine 1
```bash
curl http://localhost:5000/machine/machines/1/vitals/current | jq
```

### View All Machines
```bash
curl http://localhost:5000/machine/machines | jq
```

### Watch Real-Time Stream
```bash
curl -N http://localhost:5000/machine/vitals/stream
```

## 🐛 Troubleshooting

### Simulation Not Running
```bash
# Check status
curl http://localhost:5000/machine/simulation/status

# Start it
curl -X POST http://localhost:5000/machine/simulation/start
```

### No Data Showing
1. Check backend is running (visit http://localhost:5000)
2. Check simulation status (should show `running: true`)
3. Wait 30 seconds for first update
4. Refresh browser

### Charts Not Updating
1. Enable "Auto Refresh" toggle
2. Check browser console for errors
3. Verify API calls in Network tab
4. Manually click "Refresh Now"

## 📈 Understanding Predictions

### Risk Levels
- **Low (0-25%)**: Normal operation
- **Medium (26-40%)**: Monitor closely
- **Medium (41-60%)**: Schedule maintenance soon
- **High (61-80%)**: Schedule within 24 hours
- **Critical (81-100%)**: Immediate action required

### Failure Probabilities
The ML model analyzes:
- Current sensor values
- Trend over last 3 readings
- Machine-specific failure patterns
- Historical training data

### Time Estimates
- Based on failure probability
- Higher risk = shorter time estimate
- Ranges from 1-168 hours (1 week)

## 🎓 Learning Points

### Backend Concepts
- Background worker threads
- Server-Sent Events (SSE)
- ML model integration
- RESTful API design
- In-memory state management
- File-based logging

### Frontend Concepts
- Real-time data polling
- Interactive charts
- Component state management
- API client abstraction
- Responsive design
- Auto-refresh patterns

### ML Concepts
- Feature engineering
- Rolling window analysis
- Prediction confidence
- Machine-specific patterns
- Risk classification

## 📚 Documentation Files

- `IMPLEMENTATION_GUIDE.md` - Complete implementation details
- `REALTIME_VITALS_IMPLEMENTATION.md` - Technical documentation
- `SYSTEM_ARCHITECTURE.md` - Visual architecture diagrams
- `QUICK_REFERENCE.md` - This file

## 🎯 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3001/vitals
- [ ] All 4 machines visible
- [ ] Vitals show reasonable values
- [ ] Predictions display with percentages
- [ ] Can click machine cards
- [ ] Charts render correctly
- [ ] Auto-refresh works
- [ ] Simulation can start/stop
- [ ] API endpoints respond

## 💡 Pro Tips

1. **Leave it running**: More data = better visualizations
2. **Watch trends**: Patterns emerge over time
3. **Compare machines**: Different failure patterns
4. **Use auto-refresh**: Best real-time experience
5. **Check logs**: See complete history in log files
6. **Test endpoints**: Use curl/Postman to explore API

## 🔗 URLs

- **Frontend Dashboard**: http://localhost:3001/vitals
- **Backend API**: http://localhost:5000
- **SSE Stream**: http://localhost:5000/machine/vitals/stream
- **API Docs**: See `REALTIME_VITALS_IMPLEMENTATION.md`

---

**Happy Monitoring! 🎉**
