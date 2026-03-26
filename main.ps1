Write-Host "======================================"
Write-Host "   DL-Studio Orchestrator Setup       "
Write-Host "======================================"
$ErrorActionPreference = "Stop"

# Always run from repository root even when invoked from another folder.
$repoRoot = $PSScriptRoot
Set-Location $repoRoot

# 1. Check for Git
Write-Host "`n[0/5] Checking for Git..."
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    Write-Host "Git found!"
} else {
    Write-Host "Git not found. Attempting to install Git via winget..."
    winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
    $gitDir = "C:\Program Files\Git\cmd"
    if (Test-Path "$gitDir\git.exe") {
        Write-Host "Dynamically injecting Git into current session PATH..."
        $env:PATH = "$env:PATH;$gitDir"
    } else {
        Write-Host "WARNING: Git installation may require a terminal restart."
        Write-Host "Continuing anyway — Git is only needed for cloning, not for running the app."
    }
}

# 2. Check for Python
Write-Host "`n[1/6] Checking for Python..."
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    Write-Host "Python found!"
} else {
    Write-Host "Python not found. Attempting to install Python via winget..."
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    Write-Host "Please restart your terminal after Python installs and run this script again."
    exit
}

# 2. Virtual Environment & Dependencies
Write-Host "`n[2/6] Setting up Python Virtual Environment..."
$envPath = Join-Path $PWD ".venv\Scripts\activate.ps1"
$venvPython = Join-Path $PWD ".venv\Scripts\python.exe"

if (-Not (Test-Path $envPath)) {
    Write-Host "Virtual environment is broken or missing. Purging and recreating..."
    if (Test-Path ".venv") {
        Remove-Item -Recurse -Force ".venv"
    }
    python -m venv .venv
    # Wait precisely for Windows to finish writing the scripts to disk
    Start-Sleep -Seconds 3 
}

# Validate venv and install dependencies
if (-Not (Test-Path $envPath) -or -Not (Test-Path $venvPython)) {
    Write-Host "FATAL ERROR: Failed to create virtual environment (Test-Path returned false for $envPath)."
    Write-Host "Please manually run 'python -m venv .venv' to check for errors."
    exit
}

Write-Host "Installing Python Backend Requirements..."
Write-Host "This may take a few minutes on first run. Please do not interrupt."
cd backend
& $venvPython -m pip --disable-pip-version-check install --no-input -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "First dependency install attempt failed. Retrying once..."
    Start-Sleep -Seconds 2
    & $venvPython -m pip --disable-pip-version-check install --no-input -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend dependency install failed. Please check internet connectivity/VPN and run again."
        exit 1
    }
}
cd ..

# 3. Check for Node.js (Required for React/Vite)
Write-Host "`n[3/6] Checking for Node.js (npm)..."
if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    Write-Host "Node.js found in PATH!"
} else {
    $nodeDir = "C:\Program Files\nodejs"
    if (-Not (Test-Path "$nodeDir\npm.cmd")) {
        Write-Host "Node.js not found. Attempting to install Node.js via winget..."
        winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
    }
    
    if (Test-Path "$nodeDir\npm.cmd") {
        Write-Host "Dynamically injecting Node.js into current session PATH..."
        $env:PATH = "$env:PATH;$nodeDir"
    } else {
        Write-Host "Node.js installation failed or path is non-standard. Please restart terminal."
        exit
    }
}

# 4. Start Servers
Write-Host "`n[4/6] Starting Servers..."

Write-Host "Cleaning up zombie server processes..."
try {
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($port8000) { Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue }
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($port3000) { Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue }
} catch {}

Write-Host "Starting FastAPI Backend on Port 8000..."
cd backend
Start-Process -NoNewWindow -FilePath $venvPython -ArgumentList "main.py"
cd ..

Write-Host "Installing Frontend Dependencies..."
cd frontend
npm.cmd install --legacy-peer-deps

Write-Host "Starting React Frontend on Port 3000..."
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run dev"
cd ..

# 5. Open Browser
Write-Host "`n[5/6] Launching Browser..."
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host "`n======================================"
Write-Host " DL-Studio is now actively running!"
try {
    $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" })[0].IPv4Address.IPAddress
    if ($ip -and $ip.Trim() -ne "") {
        Write-Host "  Network IP: http://$ip:3000"
    }
} catch {
    # Fallback if network configs are hidden
}
Write-Host "  Local IP:   http://localhost:3000"
Write-Host "======================================"
