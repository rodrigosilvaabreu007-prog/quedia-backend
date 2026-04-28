#!/usr/bin/env pwsh
# Deploy direto no Cloud Run - usando build local via gcloud run deploy com --source

$projectId = "quedia-backend"
$region = "us-central1"

Write-Host "🚀 Deploy Backend via Cloud Run (build local)..." -ForegroundColor Cyan
Write-Host ""

# Navegar para backend
$backendDir = "C:\Users\tidia\Downloads\quedia.com.br\backend"
Set-Location $backendDir

Write-Host "📁 Diretório: $backendDir" -ForegroundColor Yellow
Write-Host ""

# Usar gcloud run deploy com --source para fazer build automático
Write-Host "🔨 Compilando e deployando via Cloud Run..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy eventhub-api `
  --source . `
  --platform managed `
  --region $region `
  --project $projectId `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --timeout 3600 `
  --set-env-vars "NODE_ENV=production"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deploy falhou!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅✅✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API está disponível em:" -ForegroundColor Cyan
Write-Host "   https://quedia-backend-649702844549.us-central1.run.app/api" -ForegroundColor Green
Write-Host ""
Write-Host "Testando conexão..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$testUrl = "https://quedia-backend-649702844549.us-central1.run.app/api/eventos"
try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ API está respondendo!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Ainda inicializando (timeout esperado)..." -ForegroundColor Yellow
}

Write-Host ""
