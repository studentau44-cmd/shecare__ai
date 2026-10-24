@echo off
title SurvivorCare AI - Launcher
echo ============================================================
echo Starting SurvivorCare AI - Secure Offline-First Care App
echo ============================================================
echo.
echo Opening browser at http://localhost:8000
start http://localhost:8000
echo.
echo Launching local secure server...
python server.py
pause
