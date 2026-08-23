# Start P2P Processing Platform locally
# Run this from PowerShell

Write-Host "Starting P2P Processing Platform..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running." -ForegroundColor Green

# Start Docker services
Write-Host "Starting Docker services (Postgres, Redis, MinIO)..." -ForegroundColor Yellow
docker compose -f docker-compose.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Docker services may already be running." -ForegroundColor Yellow
}

# Wait for Postgres to be ready
Write-Host "Waiting for Postgres..." -ForegroundColor Yellow
for ($i = 0; $i -lt 30; $i++) {
    $ready = docker exec p2p-processing-platform-main-postgres-1 pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
}

# Set environment and run API + Web
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/p2p"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting API server on port 3001..." -ForegroundColor Yellow
Write-Host "  Starting Web app on port 3000..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start API in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:api" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Web in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:web" -WindowStyle Normal

Write-Host ""
Write-Host "Platform is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "  Web UI:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Swagger:  http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "  MinIO:    http://localhost:9001  (minioadmin/minioadmin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Owner login:  owner@p2p.local / admin123" -ForegroundColor Yellow
Write-Host ""
