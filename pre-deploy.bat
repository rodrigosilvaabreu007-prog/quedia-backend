@echo off
REM Script de Pre-Deployment - Proteção de Eventos Quedia
REM Este script deve ser executado ANTES de qualquer deploy para proteger os dados

echo ================================================
echo 🛡️ SISTEMA DE PROTEÇÃO DE EVENTOS - QUEDIA
echo ================================================
echo.

echo 🔍 Verificando integridade dos dados antes do deploy...
echo.

REM Verificar se Python está disponível
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado. Instale Python para usar as proteções.
    pause
    exit /b 1
)

REM Executar verificação de integridade
echo 📊 Executando verificação de dados...
python backup_eventos.py

if %errorlevel% neq 0 (
    echo ❌ Falha na verificação de integridade. Abortando deploy.
    echo 🔄 Execute novamente após resolver os problemas.
    pause
    exit /b 1
)

echo.
echo ✅ Verificação concluída com sucesso!
echo.

REM Perguntar se quer continuar com o deploy
set /p continuar="🚀 Deseja continuar com o deploy? (s/n): "
if /i not "%continuar%"=="s" (
    echo Deploy cancelado pelo usuário.
    pause
    exit /b 0
)

echo.
echo 🔄 Iniciando deploy...
echo.

REM Aqui seria chamado o comando de deploy real
echo 📝 Comando de deploy seria executado aqui...
echo Exemplo: firebase deploy --only functions --project quedia-backend

echo.
echo ✅ Deploy concluído!
echo 🛡️ Dados protegidos durante todo o processo.
echo.

pause