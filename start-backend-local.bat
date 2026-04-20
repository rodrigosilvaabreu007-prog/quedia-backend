@echo off
REM Script para iniciar backend localmente na porta 8081

setlocal enabledelayedexpansion

cd /d "C:\Users\tidia\Downloads\quedia.com.br\backend"

echo.
echo ======================================
echo Iniciando Backend QueDia Localmente
echo ======================================
echo.

REM Verificar se Node.js está disponível
where node >nul 2>nul
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado no PATH
    echo Instale Node.js em https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependências se necessário
if not exist node_modules (
    echo Instalando dependencias npm...
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor na porta 8081...
echo Pressione Ctrl+C para parar
echo.

set PORT=8081
set NODE_ENV=development

call node src\server.js

pause
