@echo off
echo ========================================
echo   Testing Vitals Simulation System
echo ========================================
echo.
echo This will test that:
echo   1. Backend is running
echo   2. Simulation is active  
echo   3. Vitals are being generated
echo   4. ML predictions are working
echo.
echo Make sure the backend is running first!
echo.
pause

cd /d "%~dp0Backend"
python test_vitals_system.py

pause
