#!/usr/bin/env pwsh
# Script de Deploy do Backend para Cloud Run

$projectId = "quedia-backend"
$region = "us-central1"
$imageName = "eventhub-api"
$serviceAccount = "quedia-backend@quedia-backend.iam.gserviceaccount.com"

Write-Host "🚀 Iniciando Deploy do Backend..." -ForegroundColor Cyan
Write-Host "Projeto: $projectId" -ForegroundColor Cyan
Write-Host "Região: $region" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build da imagem Docker
Write-Host "1️⃣ Building Docker image..." -ForegroundColor Yellow
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $backendDir "backend"
cd $backendDir

docker build -t gcr.io/$projectId/$imageName`:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build falhou!" -ForegroundColor Red
    exit 1
}

# Step 2: Push para Google Container Registry
Write-Host ""
Write-Host "2️⃣ Pushing image to GCR..." -ForegroundColor Yellow
docker push gcr.io/$projectId/$imageName`:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push falhou!" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy no Cloud Run
Write-Host ""
Write-Host "3️⃣ Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy eventhub-api `
    --image gcr.io/$projectId/$imageName`:latest `
    --platform managed `
    --region $region `
    --project $projectId `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --timeout 3600 `
    --set-env-vars "PORT=8080"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deploy falhou!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "API URL: https://quedia-backend-649702844549.us-central1.run.app/api" -ForegroundColor Cyan
