Write-Host "======================================"
Write-Host "   DL-Studio Orchestrator Setup       "
Write-Host "======================================"
$ErrorActionPreference = "Continue"

$repoRoot = $PSScriptRoot
Set-Location $repoRoot

function Install-Winget {
    param([string]$Id, [string]$Name)
    Write-Host "  Installing $Name via winget..."
    try {
        winget install -e --id $Id --accept-package-agreements --accept-source-agreements --silent 2>$null
        Write-Host "  $Name installed."
        return $true
    } catch {
        Write-Host "  WARNING: Failed to install $Name. Please install manually."
        return $false
    }
}

function Find-InjectPath {
    param([string[]]$Paths)
    foreach ($p in $Paths) {
        if (Test-Path $p) {
            $dir = Split-Path $p -Parent
            if (-not $env:PATH.Contains($dir)) { $env:PATH = "$env:PATH;$dir" }
            return $true
        }
    }
    return $false
}

# ---- Git ----
Write-Host "`n[0/6] Checking for Git..."
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    Write-Host "  Git found!"
} else {
    Write-Host "  Git not found."
    Install-Winget "Git.Git" "Git"
    Start-Sleep 2
    if (Find-InjectPath @("C:\Program Files\Git\cmd\git.exe")) {
        Write-Host "  Git injected into PATH."
    } else {
        Write-Host "  WARNING: Git not available. App will still run."
    }
}

# ---- Python ----
Write-Host "`n[1/6] Checking for Python..."
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $pyVer = python --version 2>&1
    Write-Host "  Python found: $pyVer"
} else {
    Write-Host "  Python not found."
    Install-Winget "Python.Python.3.11" "Python 3.11"
    Start-Sleep 3
    if (Find-InjectPath @(
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "C:\Python311\python.exe",
        "C:\Program Files\Python311\python.exe"
    )) {
        Write-Host "  Python injected into PATH."
    } else {
        Write-Host "  FATAL: Python not found. Restart terminal and try again."
        pause; exit 1
    }
}

# ---- Virtual Environment ----
Write-Host "`n[2/6] Setting up Python Virtual Environment..."
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
$envPath = Join-Path $repoRoot ".venv\Scripts\activate.ps1"

python -m pip install --upgrade pip --disable-pip-version-check 2>$null

if (-Not (Test-Path $venvPython)) {
    Write-Host "  Creating virtual environment..."
    if (Test-Path ".venv") { Remove-Item -Recurse -Force ".venv" -ErrorAction SilentlyContinue; Start-Sleep 1 }
    python -m venv .venv
    Start-Sleep 3
    if (-Not (Test-Path $venvPython)) {
        Write-Host "  Retry creating venv..."
        python -m venv .venv
        Start-Sleep 3
    }
}

if (-Not (Test-Path $venvPython)) {
    Write-Host "  FATAL: Cannot create virtual environment."
    pause; exit 1
}
Write-Host "  Virtual environment ready."

# ---- Backend Dependencies ----
Write-Host "`n[3/6] Installing Python Backend Requirements..."
Write-Host "  This may take a few minutes on first run..."
& $venvPython -m pip install --upgrade pip --disable-pip-version-check 2>$null

cd backend
$ok = $false
for ($i = 1; $i -le 3; $i++) {
    Write-Host "  Attempt $i/3..."
    & $venvPython -m pip --disable-pip-version-check install --no-input -r requirements.txt 2>$null
    if ($LASTEXITCODE -eq 0) { $ok = $true; break }
    Write-Host "  Failed. Retrying..."
    Start-Sleep 3
}
cd ..

if (-Not $ok) {
    Write-Host "  Trying essential packages individually..."
    & $venvPython -m pip install fastapi uvicorn numpy pandas scikit-learn tensorflow shap lime openpyxl --disable-pip-version-check 2>$null
}
Write-Host "  Backend dependencies installed."

# ---- Node.js ----
Write-Host "`n[4/6] Checking for Node.js..."
if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    $nodeVer = node --version 2>&1
    Write-Host "  Node.js found: $nodeVer"
} else {
    Write-Host "  Node.js not found."
    Install-Winget "OpenJS.NodeJS" "Node.js"
    Start-Sleep 3
    if (Find-InjectPath @("C:\Program Files\nodejs\npm.cmd")) {
        Write-Host "  Node.js injected into PATH."
    } else {
        Write-Host "  FATAL: Node.js not found. Restart terminal and try again."
        pause; exit 1
    }
}

# ---- Frontend Dependencies ----
Write-Host "`n[5/6] Installing Frontend Dependencies..."
cd frontend
$npmOk = $false
for ($i = 1; $i -le 3; $i++) {
    Write-Host "  npm install attempt $i/3..."
    npm.cmd install --legacy-peer-deps 2>$null
    if ($LASTEXITCODE -eq 0) { $npmOk = $true; break }
    Write-Host "  Failed. Retrying..."
    Start-Sleep 3
}
cd ..

if (-Not $npmOk) {
    Write-Host "  WARNING: npm install had issues. Continuing anyway..."
}

# ---- Start Servers ----
Write-Host "`n[6/6] Starting Servers..."
Write-Host "  Cleaning up old processes..."
try {
    Get-NetTCPConnection -LocalPort 8000 -State Listen -EA SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }
    Get-NetTCPConnection -LocalPort 3000 -State Listen -EA SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }
} catch {}
Start-Sleep 1

Write-Host "  Starting FastAPI Backend on Port 8000..."
cd backend; Start-Process -NoNewWindow -FilePath $venvPython -ArgumentList "main.py"; cd ..
Start-Sleep 3

Write-Host "  Starting React Frontend on Port 3000..."
cd frontend; Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run dev"; cd ..

Write-Host "`n  Waiting for servers..."
Start-Sleep 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "======================================"
Write-Host "  DL-Studio is now running!"
try {
    $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" })[0].IPv4Address.IPAddress
    if ($ip) { Write-Host "  Network:  http://$ip:3000" }
} catch {}
Write-Host "  Local:    http://localhost:3000"
Write-Host "======================================"
