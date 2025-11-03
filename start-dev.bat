@echo off
echo Starting Flask Backend and Next.js Frontend...
echo.

echo Starting Flask Backend...
start "Flask Backend" cmd /c "cd /d Backend && python app.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Next.js Frontend...
start "Next.js Frontend" cmd /c "cd /d frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
