#!/usr/bin/env pwsh
# Deploy ignorando erro de permissão - tentar com imagem tag

$projectId = "quedia-backend"
$region = "us-central1"
$imageName = "gcr.io/$projectId/eventhub-api"

Write-Host "🚀 Tentando deploy com imagem existente..." -ForegroundColor Cyan
Write-Host ""

# Tentar deploy direto com a imagem mais recente
Write-Host "Executando gcloud run deploy..." -ForegroundColor Yellow

gcloud run deploy eventhub-api `
  --image $imageName`:latest `
  --platform managed `
  --region $region `
  --project $projectId `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --set-env-vars "PORT=8080,NODE_ENV=production" `
  --no-traffic 2>&1

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Exit Code: $exitCode" -ForegroundColor Yellow

if ($exitCode -eq 0) {
    Write-Host "✅ Deploy bem-sucedido!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Deploy retornou código $exitCode" -ForegroundColor Yellow
    Write-Host "Tentando verificar serviço existente..." -ForegroundColor Yellow
    
    # Verificar se o serviço já existe
    gcloud run services list --region $region --project $projectId --format="table(name,status)" 2>&1 | findstr "eventhub"
}

Write-Host ""
Write-Host "✅ Verifique o resultado acima" -ForegroundColor Green
