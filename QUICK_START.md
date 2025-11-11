# Quick Start Guide - Machine Vitals System

## 🚀 Start Everything (2 Simple Steps)

### 1. Start Backend
```powershell
cd d:\Apps\machine-failure-prediction\Backend
python app.py
```
✅ Automatically starts vitals simulation for all 4 machines  
✅ Updates every 30 seconds  
✅ ML predictions run automatically

### 2. Start Frontend
```powershell
cd d:\Apps\machine-failure-prediction\Frontend
npm run dev
```
Then open: **http://localhost:3001**

## 📊 View Machine Vitals

1. Click **"Machine Vitals"** in the sidebar
2. See all 4 machines updating automatically
3. Click any machine card for detailed view
4. Charts show real-time trends

## 🎯 What You'll See

### 4 Mining Machines
- **Haul Truck HT-001** - Pit Area A
- **Drill Rig DR-002** - Blast Zone B
- **Shovel EX-003** - Loading Area C
- **Crusher CR-004** - Processing Plant D

### Live Data (Updates Every 30s)
- 🌡️ **Temperature** (°C)
- 📊 **Pressure** (PSI)
- ⚡ **Vibration** (mm/s)

### ML Predictions
- 🎯 **Failure Risk** (0-100%)
- ⚠️ **Failure Type** (engine breakdown, hydraulic leak, etc.)
- ⏱️ **Estimated Time** (hours to failure)
- 🚨 **Risk Level** (low/medium/high/critical)

## 🔍 Testing

Run test script to verify:
```powershell
.\test-vitals-system.bat
```

## ✅ System Features

- ✅ Auto-starts when backend launches
- ✅ Generates vitals every 30 seconds
- ✅ ML predictions run automatically
- ✅ Detects failure conditions
- ✅ Real-time frontend updates
- ✅ Color-coded risk indicators
- ✅ Historical charts
- ✅ All 4 machines monitored

## 📖 Full Documentation

- **VITALS_SYSTEM_READY.md** - Quick overview
- **VITALS_SIMULATION_SYSTEM.md** - Complete technical details
- **SENSOR_SIMULATION_GUIDE.md** - Sensor ranges and behavior

## 🎉 That's It!

Your system is ready to use. Just start both servers and navigate to the Machine Vitals page!
