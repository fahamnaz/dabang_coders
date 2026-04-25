@echo off
echo ===================================================
echo      Starting Play Gugglu - Kiosk Mode
echo ===================================================
echo Please wait while all services are started.
echo Three new command windows will open for the Backend, Frontend, and Engine.
echo.

echo [1/3] Starting Backend Server...
cd backend
start "Play Gugglu Backend" cmd /k "npm install && node server.js"
cd ..

echo [2/3] Starting Frontend React App...
cd frontend
start "Play Gugglu Frontend" cmd /k "npm install && npm run dev"
cd ..

echo [3/3] Starting Eye Tracking Engine...
cd engine
start "Play Gugglu Engine" cmd /k "pip install -r requirements.txt && python main.py"
cd ..

echo.
echo All systems are launching!
echo The React app should open in your browser automatically.
echo Keep the new command windows open while playing. 
echo To stop everything, just close the three black command windows.
pause
