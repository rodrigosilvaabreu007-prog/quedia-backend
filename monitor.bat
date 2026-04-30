@echo off
REM Monitor de Integridade dos Dados - Quedia
REM Executa verificações periódicas para garantir que os eventos não foram perdidos

echo ================================================
echo 🛡️ MONITOR DE INTEGRIDADE - QUEDIA
echo ================================================
echo.

echo %date% %time% - 🔍 Verificando integridade dos dados...

python backup_eventos.py
if %errorlevel% equ 0 (
    echo ✅ Integridade verificada com sucesso
) else (
    echo ❌ Problema detectado na integridade dos dados!
    echo 🚨 ALERTA: Possível perda de dados detectada!
    echo Verifique os logs e execute restauração se necessário.
    exit /b 1
)

echo.
echo ✅ Monitoramento concluído
pause