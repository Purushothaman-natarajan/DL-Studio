@echo off
title DL-Studio Orchestrator
echo =========================================
echo    Launching Machine Learning Studio
echo =========================================
echo.
echo Running Setup Script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0main.ps1"
pause
