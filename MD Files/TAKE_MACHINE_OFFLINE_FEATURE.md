# Take Machine Offline Feature

## Overview
Added safety feature to take machines offline when failure risk exceeds 70%.

## Features Added

### 1. Backend API Endpoint
**Route:** `PATCH /machine/machines/{machine_id}/status`

**Request Body:**
```json
{
  "status": "online" | "offline" | "maintenance"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Machine Haul Truck HT-001 status updated to offline",
  "data": {
    "id": "1",
    "name": "Haul Truck HT-001",
    "status": "offline"
  }
}
```

### 2. Frontend UI Components

#### Take Offline Button
- **Appears when:** Failure risk > 70%
- **Location:** ML Prediction card header in detailed view
- **Action:** Takes machine offline immediately
- **Visual:** Red destructive button with PowerOff icon

#### Bring Online Button
- **Appears when:** Machine status is "offline"
- **Location:** Same as take offline button
- **Action:** Brings machine back online
- **Visual:** Default button with Power icon

#### Critical Warning Alert
- **Appears when:** Failure risk > 70% AND machine is online
- **Content:** "Critical Warning: This machine has a failure risk above 70%. It is recommended to take it offline immediately to prevent potential damage or safety hazards."
- **Style:** Destructive red alert with AlertTriangle icon

#### Offline Status Alert
- **Appears when:** Machine status is "offline"
- **Content:** "Machine Offline: This machine has been taken offline for safety. Please perform necessary maintenance before bringing it back online."
- **Style:** Orange alert with PowerOff icon

### 3. Machine Card Visual Indicators

When a machine is offline:
- ✅ Card has orange border
- ✅ Card opacity reduced (70%)
- ✅ PowerOff icon next to machine name
- ✅ "OFFLINE" badge displayed
- ✅ Health status badge hidden
- ✅ Failure risk not shown

## User Flow

### Scenario: High Risk Machine

1. **Monitor detects high risk**
   - ML prediction shows failure risk > 70%
   - Risk level badge shows "CRITICAL" or "HIGH"

2. **User sees warnings**
   - Red critical warning alert appears
   - "Take Machine Offline" button becomes visible

3. **User takes action**
   - Clicks "Take Machine Offline" button
   - Confirmation toast appears: "Machine Taken Offline"

4. **System updates**
   - Machine status changes to "offline"
   - Card shows OFFLINE badge and orange styling
   - Alert changes to show offline status
   - Button changes to "Bring Back Online"

5. **Maintenance performed**
   - Physical maintenance on the machine
   - Repairs completed

6. **User brings machine back online**
   - Clicks "Bring Back Online" button
   - Confirmation toast appears: "Machine Brought Online"

7. **System resumes**
   - Machine status changes to "online"
   - Normal monitoring resumes
   - Health status badges reappear

## Safety Features

✅ **Automatic Button Display** - Only shows when risk > 70%  
✅ **Visual Warnings** - Multiple alerts inform user of critical status  
✅ **Status Persistence** - Machine status persists across page refreshes  
✅ **Clear Indicators** - Offline machines clearly marked in overview  
✅ **Toast Notifications** - Confirms all status changes  
✅ **Data Refresh** - Automatically updates after status change  

## Technical Details

### State Management
- Machine status stored in `MINING_MACHINES` array (backend)
- Status synced to `CURRENT_MACHINE_VITALS` for consistency
- Thread-safe updates using lock mechanism

### API Integration
- Uses existing `apiClient.updateMachineStatus()` method
- Properly handles errors with try-catch
- Shows user-friendly error messages

### UI Responsiveness
- Button disabled during status update
- Loading states handled
- Immediate visual feedback
- Data refetches after successful update

## Usage Example

### Backend
```python
# Machine status is updated
MINING_MACHINES[0]['status'] = 'offline'
CURRENT_MACHINE_VITALS['1']['status'] = 'offline'
```

### Frontend
```typescript
// Take machine offline
await apiClient.updateMachineStatus('1', 'offline')

// Bring back online
await apiClient.updateMachineStatus('1', 'online')
```

## Testing

1. **Start both servers**
   ```powershell
   # Backend
   cd Backend
   python app.py
   
   # Frontend
   cd Frontend
   npm run dev
   ```

2. **Navigate to Machine Vitals**
   - Go to http://localhost:3001/vitals

3. **Wait for high risk scenario**
   - Simulation may naturally generate high risk
   - Or wait for 30-second updates

4. **Test taking machine offline**
   - Click any machine with risk > 70%
   - Click "Take Machine Offline"
   - Verify alerts and status change

5. **Test bringing back online**
   - Click "Bring Back Online"
   - Verify status returns to normal

## Future Enhancements

Possible improvements:
- 📝 Add maintenance log when taking offline
- ⏱️ Track downtime duration
- 📧 Email notifications to maintenance team
- 🔐 Require authorization for critical actions
- 📊 Analytics on offline frequency
- 🔄 Auto-restart after maintenance completion

## Files Modified

### Backend
- `Backend/routes/machine_routes.py`
  - Added `update_machine_status()` endpoint

### Frontend
- `Frontend/app/vitals/page.tsx`
  - Added PowerOff and Power icons import
  - Added `takeMachineOffline()` function
  - Added `bringMachineOnline()` function
  - Updated ML Prediction card with conditional button
  - Added critical warning alert
  - Added offline status alert
  - Updated machine cards with offline indicators

- `Frontend/lib/api.ts`
  - Updated `updateMachineStatus()` to use correct endpoint

## Summary

This feature adds a critical safety mechanism to prevent machine failures by allowing operators to take machines offline when ML predictions indicate high failure risk (>70%). The UI provides clear visual indicators and warnings, making it easy for operators to make informed decisions about machine safety.
