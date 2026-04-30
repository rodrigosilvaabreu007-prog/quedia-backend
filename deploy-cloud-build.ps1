#!/usr/bin/env pwsh
# Deploy via Google Cloud Build - sem depender de Docker local
# COM PROTEÇÕES DE DADOS IMPLEMENTADAS

$projectId = "quedia-backend"
$region = "us-central1"

Write-Host "🛡️ SISTEMA DE PROTEÇÃO DE EVENTOS - QUEDIA" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta

Write-Host "🔍 Executando verificações de segurança antes do deploy..." -ForegroundColor Yellow

# Verificar se Python está disponível
$pythonAvailable = $null
try {
    $null = python --version 2>$null
    $pythonAvailable = $true
} catch {
    $pythonAvailable = $false
}

if ($pythonAvailable) {
    Write-Host "✅ Python encontrado - executando verificações..." -ForegroundColor Green

    # Executar backup e verificação
    Write-Host "📊 Fazendo backup dos dados..." -ForegroundColor Cyan
    try {
        & python "$PSScriptRoot\backup_eventos.py"
        if ($LASTEXITCODE -ne 0) {
            throw "Falha no backup"
        }
    } catch {
        Write-Host "❌ Falha no backup dos dados. Abortando deploy para proteger informações." -ForegroundColor Red
        Write-Host "Execute: python backup_eventos.py" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Python não encontrado - pulando verificações automáticas" -ForegroundColor Yellow
    Write-Host "Para proteção máxima, instale Python e execute: python backup_eventos.py" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor Magenta
Write-Host "🚀 Iniciando Deploy via Google Cloud Build..." -ForegroundColor Cyan
Write-Host "Projeto: $projectId" -ForegroundColor Cyan
Write-Host ""

# Navegar para diretório backend
$backendDir = "C:\Users\tidia\Downloads\quedia.com.br\backend"
Set-Location $backendDir

Write-Host "📁 Trabalhando em: $backendDir" -ForegroundColor Yellow
Write-Host ""

# Executar gcloud builds submit
Write-Host "🔨 Executando gcloud builds submit..." -ForegroundColor Yellow
Write-Host ""

gcloud builds submit `
  --tag gcr.io/$projectId/eventhub-api:latest `
  --project $projectId `
  --timeout=3600

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Cloud Build falhou!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para detalhes." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído! Agora fazendo deploy no Cloud Run..." -ForegroundColor Green
Write-Host ""

# Deploy no Cloud Run
gcloud run deploy eventhub-api `
  --image gcr.io/$projectId/eventhub-api:latest `
  --platform managed `
  --region $region `
  --project $projectId `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --timeout 3600

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Cloud Run deploy falhou!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅✅✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API URL: https://quedia-backend-649702844549.us-central1.run.app/api" -ForegroundColor Cyan
Write-Host ""
