# Real-Time Vitals System - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                    (http://localhost:3001/vitals)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Haul Truck   │  │  Drill Rig   │  │   Shovel     │  │ Crusher ││
│  │   HT-001     │  │   DR-002     │  │   EX-003     │  │ CR-004  ││
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├─────────┤│
│  │ 🌡️ 72.5°C    │  │ 🌡️ 68.3°C    │  │ 🌡️ 81.2°C    │  │ 🌡️ 75.1°C│
│  │ 📊 105 PSI   │  │ 📊 98 PSI    │  │ 📊 142 PSI   │  │ 📊 112 PSI│
│  │ ⚡ 1.42 mm/s │  │ ⚡ 1.15 mm/s │  │ ⚡ 2.8 mm/s  │  │ ⚡ 1.8 mm/s│
│  │ Risk: 35%    │  │ Risk: 18%    │  │ Risk: 62%    │  │ Risk: 41%│
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              DETAILED VIEW (Selected Machine)               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Current Vitals          ML Prediction                      │   │
│  │  • Temperature: 72.5°C   • Failure Type: Tire Wear         │   │
│  │  • Pressure: 105 PSI     • Risk: 35% (MEDIUM)              │   │
│  │  • Vibration: 1.42 mm/s  • Est. Time: 95 hours             │   │
│  │                                                              │   │
│  │  📈 Historical Charts (Last 20 readings)                    │   │
│  │  [Temperature] [Pressure] [Vibration]                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Controls: [⏯️ Start/Stop] [🔄 Auto-Refresh] [↻ Refresh]    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP API
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                     │
│                   (http://localhost:5000)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GET /machine/machines                                              │
│  └─> Returns all 4 machines with vitals + predictions               │
│                                                                      │
│  GET /machine/machines/<id>/vitals/current                          │
│  └─> Returns current vitals for specific machine                    │
│                                                                      │
│  GET /machine/machines/<id>/vitals/history?limit=20                 │
│  └─> Returns last 20 readings for specific machine                  │
│                                                                      │
│  GET /machine/vitals/stream (SSE)                                   │
│  └─> Real-time streaming of all machine updates                     │
│                                                                      │
│  POST /machine/simulation/start                                     │
│  └─> Start vitals generation                                        │
│                                                                      │
│  POST /machine/simulation/stop                                      │
│  └─> Stop vitals generation                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ Internal
┌─────────────────────────────────────────────────────────────────────┐
│                    SIMULATION WORKER                                │
│                  (Background Thread - Every 30s)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ FOR EACH MACHINE (1, 2, 3, 4):                           │     │
│  │                                                           │     │
│  │  1️⃣ Generate New Sensor Values                            │     │
│  │     ├─ Temperature: Gaussian(current ± 0.5-2°C)          │     │
│  │     ├─ Pressure: Gaussian(current ± 1-3 PSI)             │     │
│  │     └─ Vibration: Gaussian(current ± 0.02-0.1 mm/s)      │     │
│  │                                                           │     │
│  │  2️⃣ Update Machine History                                │     │
│  │     └─ Keep last 10 readings                             │     │
│  │                                                           │     │
│  │  3️⃣ Run ML Prediction                                     │     │
│  │     ├─ Input: Last 3 readings                            │     │
│  │     ├─ Feature Engineering                               │     │
│  │     ├─ Model Prediction                                  │     │
│  │     └─ Output: Failure type + probability                │     │
│  │                                                           │     │
│  │  4️⃣ Store Results                                         │     │
│  │     ├─ CURRENT_MACHINE_VITALS[machine_id]                │     │
│  │     └─ Log to file                                       │     │
│  │                                                           │     │
│  │  5️⃣ Broadcast Update (SSE)                                │     │
│  │     └─ Notify connected clients                          │     │
│  │                                                           │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ⏰ SLEEP 30 seconds, then repeat                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    ML PREDICTION ENGINE                             │
│              (services/prediction_service.py)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Input: [                                                           │
│    {Timestamp: T-2, Temperature: 70, Pressure: 100, Vibration: 1.2}│
│    {Timestamp: T-1, Temperature: 71, Pressure: 103, Vibration: 1.4}│
│    {Timestamp: T-0, Temperature: 72, Pressure: 105, Vibration: 1.5}│
│  ]                                                                  │
│                                                                      │
│  ↓ Feature Engineering                                              │
│  ├─ Rolling Average (3 readings)                                    │
│  ├─ Rolling Std Deviation                                           │
│  ├─ Rate of Change                                                  │
│  └─ Min/Max values                                                  │
│                                                                      │
│  ↓ Normalization (using trained scaler)                             │
│                                                                      │
│  ↓ ML Model Prediction (Random Forest)                              │
│  ├─ General failure probability: 0.65 (65%)                         │
│  └─ Confidence: 0.85 (85%)                                          │
│                                                                      │
│  ↓ Machine-Specific Analysis                                        │
│  ├─ Haul Truck patterns → Tire Wear (weighted by sensors)           │
│  ├─ Calculate specific probabilities per failure type              │
│  └─ Estimate hours to failure: 95 hours                             │
│                                                                      │
│  Output: {                                                          │
│    most_likely_failure: "tire_wear",                                │
│    failure_risk: 35,                                                │
│    estimated_hours: 95,                                             │
│    risk_level: "medium"                                             │
│  }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  IN-MEMORY (CURRENT_MACHINE_VITALS):                                │
│  ├─ Machine 1: {temp: 72.5, press: 105, vib: 1.42, prediction: ...}│
│  ├─ Machine 2: {temp: 68.3, press: 98, vib: 1.15, prediction: ...} │
│  ├─ Machine 3: {temp: 81.2, press: 142, vib: 2.8, prediction: ...} │
│  └─ Machine 4: {temp: 75.1, press: 112, vib: 1.8, prediction: ...} │
│                                                                      │
│  LOG FILE (logs/machine_vitals.log):                                │
│  └─ Append-only JSON lines with timestamp, vitals, predictions      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Timeline Example (90-Second Cycle)

```
T=0s (System Start)
├─ Backend starts
├─ Simulation worker initializes
├─ Creates initial vitals for 4 machines
└─ ML predictions generated for each

T=5s
├─ User opens dashboard
├─ Frontend fetches all machines
├─ Displays 4 overview cards
└─ Shows initial predictions

T=30s (First Update)
├─ Simulation worker wakes up
├─ Generates new values for all 4 machines
├─ Runs ML predictions
├─ Updates stored in memory
├─ Logged to file
└─ SSE broadcast (if connected)

T=35s
├─ Frontend auto-refresh timer fires
├─ Fetches updated machine data
├─ UI updates with new values
├─ Charts update with new data point
└─ Predictions update

T=60s (Second Update)
├─ Simulation worker wakes up again
├─ New values generated
├─ ML predictions run
├─ Data stored and logged
└─ Broadcast to clients

T=65s
├─ Frontend refreshes
├─ UI shows latest data
└─ Charts now have 3 data points

T=90s (Third Update)
└─ Pattern continues every 30 seconds...
```

## Data Flow - Single Machine Example

```
Machine: Haul Truck HT-001
─────────────────────────────────────────────────────────

SENSORS                    PROCESSING              OUTPUT
────────                   ──────────              ──────

🌡️ Temperature   ──┐
                  ├─→ [Gaussian      ──→ [Feature      ──→ [ML Model] ──→ Display
📊 Pressure      ──┤     Random Walk]     Engineering]       ↓
                  │                                      Prediction:
⚡ Vibration    ──┘                                      • Risk: 35%
                                                        • Type: Tire Wear
                   Current Values:                      • ETA: 95 hours
                   ├─ Temp: 72.5°C                      • Level: Medium
                   ├─ Pressure: 105 PSI
                   └─ Vibration: 1.42 mm/s
                          ↓
                   [History Buffer]
                   ├─ Reading 1 (90s ago)
                   ├─ Reading 2 (60s ago)
                   ├─ Reading 3 (30s ago)
                   └─ Current (now)
                          ↓
                   [ML Prediction]
                   Uses last 3 readings
                   Outputs failure prediction
                          ↓
                   [Store + Log]
                   ├─ In-memory cache
                   └─ Log file
                          ↓
                   [API Response]
                   Available to frontend
```

## Machine Types & Failure Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                    HAUL TRUCK (Machine 1)                   │
├─────────────────────────────────────────────────────────────┤
│ Primary Sensors: Temperature (40%), Pressure (30%), Vib(30%)│
│                                                              │
│ Failure Types:                                              │
│ ├─ Engine Breakdown      ←  High Temp + High Pressure       │
│ ├─ Hydraulic Leak        ←  High Pressure                   │
│ ├─ Tire Wear             ←  High Vibration                  │
│ └─ Transmission Fault    ←  Temp + Pressure + Vibration     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DRILL RIG (Machine 2)                    │
├─────────────────────────────────────────────────────────────┤
│ Primary Sensors: Vibration (50%), Temperature (30%), Press  │
│                                                              │
│ Failure Types:                                              │
│ ├─ Drill Bit Wear        ←  High Vibration                  │
│ ├─ Hydraulic System Fail ←  High Pressure                   │
│ └─ Motor Fault           ←  High Temperature                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                SHOVEL/EXCAVATOR (Machine 3)                 │
├─────────────────────────────────────────────────────────────┤
│ Primary Sensors: Pressure (60%), Vibration (30%), Temp      │
│                                                              │
│ Failure Types:                                              │
│ ├─ Hydraulic Pump Fail   ←  High Pressure                   │
│ ├─ Bucket Arm Wear       ←  High Vibration                  │
│ └─ Electrical Issue      ←  Temperature + Vibration         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     CRUSHER (Machine 4)                     │
├─────────────────────────────────────────────────────────────┤
│ Primary Sensors: Varies by failure type                     │
│                                                              │
│ Failure Types:                                              │
│ ├─ Bearing Failure       ←  High Vibration                  │
│ ├─ Liner Wear            ←  Pressure + Vibration            │
│ ├─ Motor Overheating     ←  High Temperature                │
│ └─ Conveyor Jam          ←  Vibration + Pressure            │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
User Action: "Click Machine Card"
      ↓
[Frontend] Vitals Page
      ├─ Set selected machine ID
      ├─ Fetch current vitals: GET /machine/machines/1/vitals/current
      └─ Fetch history: GET /machine/machines/1/vitals/history
      ↓
[Backend] API Routes
      ├─ machine_routes.py handles request
      ├─ Looks up CURRENT_MACHINE_VITALS[1]
      └─ Returns: {temperature, pressure, vibration, prediction, history}
      ↓
[Frontend] Updates UI
      ├─ Display large sensor values
      ├─ Show ML prediction card
      ├─ Render historical charts
      └─ Enable chart tab switching

User Action: "Toggle Auto-Refresh"
      ↓
[Frontend] Sets interval
      ├─ Every 30 seconds:
      │   ├─ Fetch all machines
      │   ├─ Fetch selected machine details
      │   └─ Update UI
      └─ On toggle off: Clear interval

Background: Simulation Running
      ↓
[Backend] Simulation Worker (every 30s)
      ├─ Generate new values
      ├─ Run ML predictions
      ├─ Store in memory
      ├─ Log to file
      └─ Broadcast via SSE
      ↓
[Frontend] Auto-refresh fetches
      └─ UI updates with new data
```

This diagram shows how all components work together to create the real-time monitoring system!
