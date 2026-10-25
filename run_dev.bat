@echo off
title Digital Twin Launcher
echo ========================================================
echo        Starting Digital Twin v3 (Backend + Frontend)
echo ========================================================

echo.
echo Starting Backend (FastAPI on http://localhost:8000)...
start "Digital Twin - Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo Starting Frontend (Vite on http://localhost:5173)...
start "Digital Twin - Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================================
echo  Both servers started in separate terminal windows!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://localhost:8000/docs
echo ========================================================
pause
