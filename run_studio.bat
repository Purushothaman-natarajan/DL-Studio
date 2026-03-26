@echo off
title DL-Studio Orchestrator
echo =========================================
echo    Launching Machine Learning Studio
echo =========================================
echo.

REM Check for Git first
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Git not found. Attempting to install via winget...
    winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo WARNING: Git install failed. Continuing anyway...
    ) else {
        echo Git installed successfully.
    }
    echo.
)

echo Running Setup Script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0main.ps1"
pause
