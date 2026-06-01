@echo off
setlocal EnableDelayedExpansion
title NEXUS — Instalacao como Servico Windows

echo =====================================================
echo   NEXUS Backend — Instalacao como Servico Windows
echo =====================================================
echo.

:: Exige execucao como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERRO: Execute como Administrador.
    echo  Clique direito no arquivo ^> "Executar como administrador"
    pause & exit /b 1
)

set "SVC=NexusBackend"
set "DIR=%~dp0"

:: Localizar Python no PATH
for %%i in (python.exe) do set "PY=%%~$PATH:i"
if not defined PY (
    echo  ERRO: Python nao encontrado no PATH.
    echo  Instale Python 3.10+ e adicione ao PATH do sistema.
    pause & exit /b 1
)
echo  [OK] Python: %PY%

:: Verificar NSSM
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: NSSM nao encontrado.
    echo  1. Baixe em: https://nssm.cc/download
    echo  2. Extraia nssm.exe para C:\Windows\System32\
    echo  3. Execute este script novamente.
    pause & exit /b 1
)
echo  [OK] NSSM encontrado

:: Verificar .env
if not exist "%DIR%.env" (
    echo.
    echo  AVISO: .env nao encontrado.
    echo  Copie .env.example para .env e configure as variaveis.
    pause & exit /b 1
)
echo  [OK] .env encontrado

:: Instalar dependencias
echo.
echo  [1/3] Instalando dependencias Python...
"%PY%" -m pip install -r "%DIR%requirements.txt" -q
if %errorlevel% neq 0 (
    echo  ERRO: Falha ao instalar dependencias.
    pause & exit /b 1
)
echo  [OK] Dependencias instaladas

if not exist "%DIR%logs" mkdir "%DIR%logs"

:: Remover servico anterior
sc query "%SVC%" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo  Removendo servico anterior...
    nssm stop %SVC% >nul 2>&1
    nssm remove %SVC% confirm >nul 2>&1
)

:: Instalar servico
echo.
echo  [2/3] Registrando servico Windows...
nssm install  %SVC%  "%PY%"  "%DIR%app.py"
nssm set %SVC% AppDirectory      "%DIR%"
nssm set %SVC% DisplayName       "NEXUS Backend API"
nssm set %SVC% Description       "Servidor de controle remoto NEXUS — por Rodrigo Carvalho Mamede"
nssm set %SVC% Start             SERVICE_AUTO_START
nssm set %SVC% AppStdout         "%DIR%logs\stdout.log"
nssm set %SVC% AppStderr         "%DIR%logs\stderr.log"
nssm set %SVC% AppRotateFiles    1
nssm set %SVC% AppRotateSeconds  86400

:: Iniciar
echo.
echo  [3/3] Iniciando servico...
nssm start %SVC%
if %errorlevel% neq 0 (
    echo  AVISO: Falha ao iniciar automaticamente.
    echo  Tente: nssm start %SVC%
) else (
    echo  [OK] Servico iniciado!
)

echo.
echo =====================================================
echo   Instalacao concluida!
echo.
echo   Servico  : %SVC%
echo   Logs     : %DIR%logs\
echo.
echo   nssm start   %SVC%
echo   nssm stop    %SVC%
echo   nssm restart %SVC%
echo   nssm remove  %SVC% confirm
echo =====================================================
pause
