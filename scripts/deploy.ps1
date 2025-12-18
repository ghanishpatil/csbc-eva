# Mission Exploit 2.0 - Deployment Script (PowerShell)
# This script deploys both frontend and backend using Docker Compose

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Mission Exploit 2.0 - Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Docker Compose is not available" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running and WSL integration is enabled" -ForegroundColor Yellow
    exit 1
}

# Check environment files
Write-Host ""
Write-Host "Checking environment files..." -ForegroundColor Yellow

if (-not (Test-Path "./backend/.env")) {
    Write-Host "✗ Error: backend/.env file not found" -ForegroundColor Red
    Write-Host "Please create backend/.env from backend/.env.example" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "./.env.production")) {
    Write-Host "⚠ Warning: .env.production not found, using .env" -ForegroundColor Yellow
}

Write-Host "✓ Environment files found" -ForegroundColor Green
Write-Host ""

# Build and deploy
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker images built successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Starting services..." -ForegroundColor Yellow
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Services started successfully" -ForegroundColor Green
Write-Host ""

# Check health
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check backend health
Write-Host "Checking backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend health check failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This might be normal if the backend is still starting up" -ForegroundColor Yellow
}

# Check frontend health
Write-Host "Checking frontend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend health check failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠ Frontend health check skipped (endpoint may not exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  docker compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Cyan
Write-Host "  docker compose down" -ForegroundColor White
Write-Host ""

