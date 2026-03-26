@echo off
title DL-Studio Orchestrator
color 0A
echo =========================================
echo    Launching Machine Learning Studio
echo =========================================
echo.

REM --- Check for winget (Windows Package Manager) ---
where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] winget not found. Manual installs may be needed.
    echo Install "App Installer" from Microsoft Store for automatic setup.
    echo.
)

REM --- Check for Git ---
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [SETUP] Git not found. Installing via winget...
    winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements --silent
    echo Git installed.
    echo.
)

REM --- Check for Python ---
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [SETUP] Python not found. Installing via winget...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements --silent
    echo Python installed.
    echo.
)

REM --- Check for Node.js ---
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [SETUP] Node.js not found. Installing via winget...
    winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements --silent
    echo Node.js installed.
    echo.
)

echo Running Setup Script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0main.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Setup script failed. Check output above.
    pause
    exit /b 1
)
pause
