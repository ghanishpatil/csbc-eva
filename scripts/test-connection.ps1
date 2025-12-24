# Backend-Frontend Connection Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend-Frontend Connection Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read configuration
$frontendEnv = Get-Content ".env" | Where-Object { $_ -match "VITE_BACKEND_URL" }
$backendEnv = Get-Content "backend\.env" | Where-Object { $_ -match "^PORT=" }
$corsEnv = Get-Content "backend\.env" | Where-Object { $_ -match "FRONTEND_URL=" }

Write-Host "Configuration:" -ForegroundColor Yellow
if ($frontendEnv) {
    $backendUrl = ($frontendEnv -split "=")[1].Trim()
    Write-Host "  Frontend Backend URL: $backendUrl" -ForegroundColor Green
} else {
    Write-Host "  Frontend Backend URL: NOT SET" -ForegroundColor Red
    $backendUrl = "http://localhost:5002"
}

if ($backendEnv) {
    $backendPort = ($backendEnv -split "=")[1].Trim()
    Write-Host "  Backend Port: $backendPort" -ForegroundColor Green
} else {
    Write-Host "  Backend Port: NOT SET" -ForegroundColor Red
    $backendPort = "5002"
}

if ($corsEnv) {
    $corsUrl = ($corsEnv -split "=")[1].Trim()
    Write-Host "  CORS Frontend URL: $corsUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "Testing Backend Connection..." -ForegroundColor Yellow

$testUrl = $backendUrl
if (-not $testUrl) {
    $testUrl = "http://localhost:$backendPort"
}

$healthUrl = "$testUrl/health"

try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host ""
    Write-Host "Backend is ONLINE" -ForegroundColor Green
    Write-Host "  URL: $healthUrl" -ForegroundColor Gray
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Connection Status: WORKING" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Backend is OFFLINE or not accessible" -ForegroundColor Red
    Write-Host "  URL: $healthUrl" -ForegroundColor Gray
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure backend is running: cd backend; npm start" -ForegroundColor White
    Write-Host "  2. Check if port $backendPort is available" -ForegroundColor White
    Write-Host "  3. Verify firewall is not blocking port $backendPort" -ForegroundColor White
    Write-Host ""
    Write-Host "Connection Status: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
