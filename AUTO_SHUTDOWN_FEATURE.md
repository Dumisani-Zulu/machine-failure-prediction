# Automatic Machine Shutdown Feature

## Overview
Machines with failure probability exceeding **90%** are now automatically taken offline and critical alerts are sent to maintenance personnel.

## How It Works

### Automatic Shutdown Trigger
- **Threshold:** Failure risk > 90%
- **Action:** Machine automatically changes status from `online` to `offline`
- **Frequency:** Checked every 30 seconds during simulation updates
- **Scope:** Applies to all 4 mining machines

### Alert System
When a machine is automatically shut down:

1. **Console Log Alert**
   ```
   [AUTO-SHUTDOWN] Machine Haul Truck HT-001 (ID: 1) taken offline automatically - Failure risk: 92%
   ```

2. **Email Alert** (if configured)
   - Subject: `🚨 CRITICAL: {Machine Name} Auto-Shutdown - {Risk}% Failure Risk`
   - Professional HTML email with:
     - Machine details (name, type, location, status)
     - Failure prediction (risk %, type, estimated hours)
     - Current sensor readings (temperature, pressure, vibration)
     - Required actions checklist
     - Timestamp and priority level

3. **Fallback:** If email fails, full alert is printed to console

## Email Configuration

### Environment Variables
Set these in your environment or `.env` file:

```bash
# Email sender configuration
ALERT_EMAIL=your-monitoring-email@company.com
ALERT_EMAIL_PASSWORD=your-app-specific-password

# Email recipient(s)
ADMIN_EMAIL=admin@company.com
```

### Gmail Setup Example
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Select "2-Step Verification"
   - Select "App passwords"
   - Generate password for "Mail" app
3. Use the generated password as `ALERT_EMAIL_PASSWORD`

### Multiple Recipients
Edit `Backend/services/sensor_simulation.py`:
```python
'recipient_emails': [
    os.getenv('ADMIN_EMAIL', 'admin@company.com'),
    'maintenance@company.com',
    'safety@company.com',
    'operations@company.com'
]
```

## Frontend Visual Indicators

### Automatic Shutdown Alert (Risk > 90% & Offline)
```
🚨 AUTOMATIC SHUTDOWN: This machine was automatically taken offline due to 
critically high failure risk (>90%).

IMMEDIATE MAINTENANCE REQUIRED - Do not restart until inspection is complete.
```
- **Style:** Red border, red background, red text
- **Icon:** AlertCircle
- **Location:** Top of ML Prediction card

### Critical Warning (70% < Risk ≤ 90% & Online)
```
⚠️ Critical Warning: This machine has a failure risk above 70%. 
It is recommended to take it offline immediately to prevent potential damage.
```
- **Style:** Destructive red alert
- **Icon:** AlertTriangle
- **Action:** "Take Machine Offline" button visible

### Manual Offline (Risk ≤ 90% & Offline)
```
Machine Offline: This machine has been taken offline for safety. 
Please perform necessary maintenance before bringing it back online.
```
- **Style:** Orange border, orange background
- **Icon:** PowerOff

## Machine Card Indicators

When machine is offline (manual or automatic):
- Orange border on card
- Reduced opacity (70%)
- PowerOff icon next to name
- "OFFLINE" badge
- No failure risk displayed

## Safety Features

✅ **Automatic Protection** - No human intervention needed  
✅ **Multi-Level Alerts** - Console + Email  
✅ **Visual Warnings** - Clear UI indicators  
✅ **Maintenance Checklist** - Actionable steps in email  
✅ **Status Persistence** - Remains offline until manually restarted  
✅ **Real-time Detection** - Checked every 30 seconds  
✅ **Comprehensive Data** - Full context in alerts  

## Alert Email Contents

### Header Section
- Critical alert banner
- "AUTOMATIC MACHINE SHUTDOWN" title
- Red styling for urgency

### Machine Information Table
- Machine Name
- Machine Type
- Location
- Current Status (OFFLINE badge)

### Failure Prediction Panel
- Large failure risk percentage (e.g., 92%)
- Predicted failure type
- Estimated time to failure

### Current Sensor Readings Table
- Temperature with normal range
- Pressure with normal range
- Vibration with normal range

### Required Actions Checklist
1. **IMMEDIATE:** Do not attempt to restart
2. **URGENT:** Dispatch maintenance team
3. **REQUIRED:** Investigate predicted failure type
4. **CRITICAL:** Perform comprehensive diagnostics
5. **SAFETY:** Secure area and notify personnel

### Footer Information
- Timestamp (UTC)
- System name
- Alert type
- Priority level (CRITICAL)

## Example Scenarios

### Scenario 1: Haul Truck Critical Failure
```
Failure Risk: 92%
Predicted: Engine Breakdown
Time to Failure: 2 hours

Temperature: 105°C (Critical)
Pressure: 185 PSI (Critical)
Vibration: 4.5 mm/s (Critical)

ACTION: Machine automatically taken offline
EMAIL: Sent to admin@company.com, maintenance@company.com
STATUS: OFFLINE - Awaiting maintenance
```

### Scenario 2: Drill Rig Hydraulic Failure
```
Failure Risk: 95%
Predicted: Hydraulic System Failure
Time to Failure: 1 hour

Temperature: 88°C (High)
Pressure: 195 PSI (Critical)
Vibration: 3.2 mm/s (Caution)

ACTION: Machine automatically taken offline
EMAIL: Sent to maintenance team
STATUS: OFFLINE - Emergency maintenance required
```

## Bringing Machine Back Online

### Prerequisites
1. ✅ Physical inspection completed
2. ✅ Predicted failure addressed
3. ✅ All vitals within normal range
4. ✅ Maintenance logged
5. ✅ Safety clearance obtained

### Process
1. Navigate to Machine Vitals page
2. Click the offline machine card
3. Review failure details and maintenance notes
4. Click "Bring Back Online" button
5. Machine status changes to `online`
6. Monitoring resumes automatically

## Testing Auto-Shutdown

### Option 1: Wait for Natural Occurrence
- Run simulation long enough
- Risk may naturally exceed 90%
- Watch for automatic shutdown

### Option 2: Manual Testing (Development)
Temporarily modify `Backend/routes/machine_routes.py`:
```python
# For testing - lower threshold temporarily
if failure_risk_percentage > 50:  # Changed from 90 for testing
    machine_config['status'] = 'offline'
    # ... rest of shutdown logic
```

Then restart backend and wait for next update cycle.

### Option 3: Trigger High Vitals
Modify sensor ranges to generate critical readings that produce high failure predictions.

## Monitoring & Logs

### Backend Console
Monitor for these log messages:
```
[AUTO-SHUTDOWN] Machine {name} (ID: {id}) taken offline automatically - Failure risk: {risk}%
[AUTO-SHUTDOWN] Alert email sent for machine {name}
[AUTO-SHUTDOWN] Failed to send email alert: {error}
```

### Log File
Check `Backend/logs/machine_vitals.log`:
```json
{
  "timestamp": "2024-11-11T10:30:00Z",
  "vitals": {
    "machine_id": "1",
    "status": "offline",
    "prediction": {
      "failure_risk": 92,
      "risk_level": "critical"
    }
  }
}
```

### Email Inbox
Look for emails with subject:
```
🚨 CRITICAL: [Machine Name] Auto-Shutdown - [Risk]% Failure Risk
```

## Configuration

### Threshold Adjustment
To change the 90% threshold, edit:

**Backend/routes/machine_routes.py** (line ~276):
```python
if failure_risk_percentage > 90:  # Change this value
```

### Email SMTP Settings
Edit **Backend/services/sensor_simulation.py** (line ~74):
```python
'smtp_server': 'smtp.gmail.com',  # Change for other providers
'smtp_port': 587,                  # TLS port
```

### Alert Recipients
Edit **Backend/services/sensor_simulation.py** (line ~77):
```python
'recipient_emails': [
    os.getenv('ADMIN_EMAIL', 'admin@company.com'),
    'your-email@company.com'  # Add more emails
]
```

## Troubleshooting

### Machine Not Shutting Down
**Check:**
- Simulation is running: `GET /machine/simulation/status`
- Predictions are being generated
- Failure risk actually exceeds 90%
- Console logs for errors

### Emails Not Sending
**Check:**
- Environment variables are set
- SMTP credentials are correct
- App password (not regular password) for Gmail
- Network allows SMTP connections
- Check console for email errors

**Fallback:**
Even if emails fail, console will print the alert message.

### Machine Won't Come Back Online
**Verify:**
- You clicked "Bring Back Online" button
- API endpoint returns success
- Machine status updated in backend
- No errors in console

## Files Modified

### Backend
1. **`Backend/routes/machine_routes.py`**
   - Added auto-shutdown logic in simulation worker
   - Checks failure_risk_percentage > 90
   - Updates machine status to 'offline'
   - Sends email alerts

2. **`Backend/services/sensor_simulation.py`**
   - Added `create_shutdown_alert_email()` method
   - Professional HTML email template
   - Comprehensive alert information

### Frontend
3. **`Frontend/app/vitals/page.tsx`**
   - Added automatic shutdown alert (risk > 90% & offline)
   - Different styling for auto vs manual shutdown
   - "IMMEDIATE MAINTENANCE REQUIRED" warning

## Risk Level Summary

| Risk Range | Status | Action |
|------------|--------|--------|
| 0-30% | Low | Normal operation |
| 31-50% | Medium | Monitor closely |
| 51-70% | High | Schedule maintenance |
| 71-90% | Critical | Manual shutdown recommended |
| **>90%** | **CRITICAL** | **AUTOMATIC SHUTDOWN + ALERT** |

## Benefits

✅ **Prevents Catastrophic Failures** - Machines shut down before critical damage  
✅ **Reduces Downtime** - Proactive maintenance instead of emergency repairs  
✅ **Improves Safety** - No human error or delayed response  
✅ **Clear Communication** - Everyone notified immediately  
✅ **Audit Trail** - All shutdowns logged with full context  
✅ **Cost Savings** - Prevents expensive emergency repairs  

## Summary

This automatic shutdown feature provides a critical safety layer that:
1. Monitors failure risk in real-time (every 30 seconds)
2. Automatically takes machines offline when risk exceeds 90%
3. Sends comprehensive email alerts to maintenance teams
4. Provides clear visual indicators in the UI
5. Requires manual intervention to bring machines back online
6. Logs all events for audit and analysis

The system is production-ready and requires no manual monitoring - it runs 24/7 protecting your valuable equipment! 🚀
