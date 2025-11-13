# Machine Failure Prediction System - Real-Time Vitals Implementation

## 🎯 What Was Implemented

I've transformed your machine failure prediction system into a **real-time monitoring platform** with automatic ML predictions. Here's what changed:

## ✨ Key Features

### 1. **Real-Time Vitals Simulation** (Every 30 seconds)
- ✅ Each of the 4 mining machines has independent, realistic sensor readings
- ✅ Temperature, pressure, and vibration change smoothly over time
- ✅ Values stay within realistic ranges based on your training data
- ✅ Runs automatically in the background

### 2. **Automatic ML Predictions**
- ✅ Machine learning model runs **automatically** every time vitals update
- ✅ Predicts specific failure types for each machine (engine breakdown, hydraulic leak, etc.)
- ✅ Calculates failure probability and estimated time to failure
- ✅ Stores predictions with vitals for instant retrieval

### 3. **Machine-Specific Intelligence**
Each machine type has unique failure patterns:
- **Haul Truck**: Engine breakdown, hydraulic leak, tire wear, transmission fault
- **Drill Rig**: Drill bit wear, hydraulic system failure, motor fault  
- **Shovel/Excavator**: Hydraulic pump failure, bucket arm wear, electrical issue
- **Crusher**: Bearing failure, liner wear, motor overheating, conveyor jam

### 4. **Beautiful New Dashboard**
- ✅ Overview cards showing all 4 machines at a glance
- ✅ Click any machine to see detailed vitals and predictions
- ✅ Live charts showing temperature, pressure, vibration trends
- ✅ Color-coded status indicators (green/yellow/red)
- ✅ Auto-refresh every 30 seconds
- ✅ Real-time failure risk display

## 🚀 How to Use

### Start the System

1. **Backend** (Terminal 1):
   ```bash
   cd Backend
   python app.py
   ```
   - Simulation starts automatically
   - Generates vitals every 30 seconds
   - Runs ML predictions automatically

2. **Frontend** (Terminal 2):
   ```bash
   cd Frontend
   pnpm run dev
   ```
   - Dashboard available at http://localhost:3001

3. **Open Dashboard**:
   - Navigate to http://localhost:3001/vitals
   - You'll see all 4 machines updating in real-time!

### Using the Dashboard

**Overview Section**:
- See all 4 machines at a glance
- Each card shows current temperature, pressure, vibration
- Failure risk percentage displayed
- Color-coded health status

**Detailed View**:
- Click any machine card to see details
- View large sensor readings
- See ML prediction results:
  - Predicted failure type
  - Failure risk percentage
  - Estimated hours until failure
  - Risk level (low/medium/high/critical)

**Charts**:
- Switch between Temperature, Pressure, Vibration tabs
- See trends over the last 20 readings
- Interactive tooltips on hover

**Controls**:
- **Auto Refresh**: Toggle on/off (updates every 30s)
- **Refresh Now**: Manually fetch latest data
- **Start/Stop Simulation**: Control vitals generation

## 📊 What You'll See

### Machine Card Example:
```
🚛 Haul Truck HT-001
Type: Haul Truck
Status: GOOD

🌡️ Temp:  72.5°C
📊 Press: 105.3 PSI
⚡ Vib:   1.42 mm/s

Failure Risk: 35% [MEDIUM]
```

### ML Prediction Example:
```
Failure Risk: 35%
Risk Level: MEDIUM
Predicted Failure: tire_wear
Estimated Time: 95 hours
Last Updated: 2:45:30 PM
```

## 🔧 Technical Implementation

### Backend Changes (`Backend/routes/machine_routes.py`)

**Enhanced Simulation Worker**:
```python
# Runs every 30 seconds
def simulation_worker():
    while simulation_running:
        # Update each machine
        for machine in MINING_MACHINES:
            # 1. Generate realistic sensor values
            # 2. Maintain history (last 10 readings)
            # 3. Run ML prediction
            # 4. Store results
            # 5. Log to file
        
        sleep(30 seconds)
```

**New API Endpoints**:
- `GET /machine/machines` - All machines with vitals and predictions
- `GET /machine/machines/<id>/vitals/current` - Specific machine vitals
- `GET /machine/machines/<id>/vitals/history` - Vitals history
- `GET /machine/vitals/stream` - Real-time streaming (SSE)

### Frontend Changes (`Frontend/app/vitals/page.tsx`)

**Complete Rewrite**:
- Machine-centric view (instead of global vitals)
- Per-machine vitals and predictions
- Interactive charts with tabs
- Auto-refresh functionality
- Beautiful UI with color coding

## 📈 Data Flow

```
Every 30 seconds:

1. Backend generates new sensor values
   └─ Temperature, Pressure, Vibration per machine
   
2. ML model analyzes readings
   └─ Predicts failure type and probability
   
3. Results stored in memory
   └─ Available immediately via API
   
4. Frontend polls or receives updates
   └─ Dashboard updates automatically
   
5. User sees:
   └─ Current vitals
   └─ ML predictions
   └─ Historical trends
```

## 🎨 Visual Improvements

### Color Coding
- **Green**: Excellent/Normal (no issues)
- **Blue**: Good (minor variations)
- **Yellow**: Warning/Caution (attention needed)
- **Red**: Critical (immediate action required)

### Status Indicators
- Pulsing green dot when simulation is active
- Risk badges for failure predictions
- Health status badges for overall machine condition
- Timestamp displays for last updates

### Charts
- Smooth line charts for each sensor
- Interactive tooltips
- Tabbed interface for easy switching
- Last 20 readings displayed

## 🔍 Example Scenario

**Time: 2:00 PM**
- Haul Truck temperature: 68°C ✅
- Pressure: 102 PSI ✅
- Vibration: 1.3 mm/s ✅
- Prediction: Low risk (15%)

**Time: 2:30 PM** (after 1 update)
- Temperature: 71°C ⚠️ (increased)
- Pressure: 108 PSI ⚠️ (increased)
- Vibration: 1.8 mm/s ⚠️ (increased)
- Prediction: Medium risk (42%)
- Predicted failure: Hydraulic leak
- Estimated time: 72 hours

**Time: 3:00 PM** (after 2 updates)
- Temperature: 89°C ❌ (high)
- Pressure: 165 PSI ❌ (high)
- Vibration: 3.2 mm/s ❌ (high)
- Prediction: High risk (78%)
- Predicted failure: Engine breakdown
- Estimated time: 24 hours
- **Alert**: Schedule immediate maintenance!

## 📁 Files Modified

### Backend
1. `routes/machine_routes.py` - Major enhancement
   - Enhanced simulation worker
   - Added ML integration
   - New API endpoints

### Frontend
1. `app/vitals/page.tsx` - Complete rewrite
2. `lib/api.ts` - Added new methods

## 🧪 Testing

Run the test script:
```bash
cd Backend
python test_realtime_vitals.py
```

This will:
- Test all API endpoints
- Verify ML predictions
- Check vitals generation
- Test SSE streaming

## 🎯 Benefits

1. **Real-Time Monitoring**: See vitals change every 30 seconds
2. **Automatic Predictions**: No manual analysis needed
3. **Machine-Specific**: Each machine has unique failure patterns
4. **Predictive Maintenance**: Know when failures might occur
5. **Beautiful UI**: Easy to understand at a glance
6. **Historical Trends**: See how vitals change over time

## 🚦 What's Running

When both servers are running:

**Backend** (localhost:5000):
- ✅ Vitals simulation (every 30s)
- ✅ ML predictions (automatic)
- ✅ API endpoints (always available)
- ✅ Data logging (to files)

**Frontend** (localhost:3001):
- ✅ Interactive dashboard
- ✅ Auto-refresh (every 30s)
- ✅ Charts and visualizations
- ✅ Real-time updates

## 💡 Tips

1. **Leave it running**: The longer it runs, the more data you'll see in charts
2. **Watch the trends**: Interesting patterns emerge over time
3. **Try different machines**: Each has unique characteristics
4. **Check predictions**: See how they change with vitals
5. **Enable auto-refresh**: Best experience for real-time monitoring

## 🎓 What You Learned

This implementation demonstrates:
- Real-time data simulation
- Automatic ML pipeline integration
- Per-entity state management
- RESTful API design
- Server-Sent Events (SSE)
- React component composition
- Real-time data visualization
- Predictive maintenance concepts

## 🔮 Future Enhancements

Potential additions:
- Email/SMS alerts for critical conditions
- Export data to CSV/Excel
- Custom threshold configuration
- Historical analytics dashboard
- Multi-site support
- Mobile app
- Maintenance scheduling automation

## 📞 Support

If something isn't working:
1. Check both servers are running
2. Visit http://localhost:5000 (should show welcome message)
3. Visit http://localhost:3001/vitals (should show dashboard)
4. Check browser console for errors
5. Check backend terminal for error messages

---

**Enjoy your real-time machine monitoring system! 🎉**

The vitals are now streaming, the ML model is predicting failures automatically, and you have a beautiful dashboard to visualize everything!
