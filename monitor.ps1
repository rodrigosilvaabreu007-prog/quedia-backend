# Script de Monitoramento de Integridade dos Dados
# Executa verificações periódicas para garantir que os eventos não foram perdidos

param(
    [switch]$Continuous,
    [int]$IntervalMinutes = 60
)

Write-Host "🛡️ MONITOR DE INTEGRIDADE - QUEDIA" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Magenta

function Test-DataIntegrity {
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - 🔍 Verificando integridade dos dados..." -ForegroundColor Cyan

    try {
        $result = & python "$PSScriptRoot\backup_eventos.py" 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-Host "✅ Integridade verificada com sucesso" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Problema detectado na integridade dos dados!" -ForegroundColor Red
            Write-Host "🚨 ALERTA: Possível perda de dados detectada!" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao executar verificação: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Start-ContinuousMonitoring {
    Write-Host "🔄 Iniciando monitoramento contínuo (intervalo: $IntervalMinutes minutos)" -ForegroundColor Yellow
    Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
    Write-Host ""

    while ($true) {
        Test-DataIntegrity | Out-Null
        Write-Host ""
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
}

# Executar verificação única ou monitoramento contínuo
if ($Continuous) {
    Start-ContinuousMonitoring
} else {
    $result = Test-DataIntegrity
    if (-not $result) {
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Monitoramento concluído" -ForegroundColor Green