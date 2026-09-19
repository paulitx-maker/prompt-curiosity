@echo off
setlocal enabledelayedexpansion

set BAT_DIR=%~dp0
set ROOT=%BAT_DIR%..
for %%i in ("%ROOT%") do set ROOT=%%~fi
set NODE_EXE=C:\Program Files\nodejs\node.exe
set PYTHON_EXE=C:\Users\doPaulo\miniconda3\python.exe
set DAILY_CAPTURE=%ROOT%\scripts\notion-MCP\scripts\daily-capture.cjs
set CUSTO_PY=%ROOT%\_kit-ux-meta\execucoes\custo\evidencia\openrouter_cost_sync.py
set LAST_SYNC_FILE=%ROOT%\_kit-ux-meta\execucoes\custo\evidencia\data\.last_sync
set LOG_FILE=%ROOT%\_kit-ux-meta\execucoes\custo\evidencia\data\rotina.log
set TODAY=%date:~6,4%-%date:~3,2%-%date:~0,2%
set TODAY=%TODAY: =0%

REM --- CHECA SE JA RODOU HOJE (cartao ponto) ---
if exist "%LAST_SYNC_FILE%" (
  for /f "usebackq delims=" %%A in ("%LAST_SYNC_FILE%") do set LAST=%%A
  if /i "!LAST!"=="%TODAY%" (
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Rotina diaria ja rodou hoje %TODAY%. SKIP.', 'Orquestrador - Ja executada', 'OK', 'Information')"
    echo [%date% %time%] SKIP %TODAY% >> "%LOG_FILE%"
    exit /b 0
  )
)

REM --- PERGUNTA ANTES com timeout 60s (se nao responder, roda) ---
for /f %%A in ('powershell -Command "$ws=New-Object -ComObject WScript.Shell; $r=$ws.Popup('Rodar rotina diaria agora?`n`n- daily-capture.cjs (Notion -> JSON)`n- openrouter_cost_sync.py (custo IA)`n`nSIM = roda agora`nNAO = cancela hoje',60,'Orquestrador - Rotina Diaria 12:00 / Logon',4+32); Write-Output $r"') do set RESP=%%A

REM RESP: 6=Sim, 7=Nao, -1=Timeout
if "%RESP%"=="7" (
  echo [%date% %time%] CANCELADO pelo usuario >> "%LOG_FILE%"
  powershell -Command "[System.Windows.Forms.MessageBox]::Show('Cancelado. Nao vai rodar hoje.', 'Orquestrador', 'OK', 'Warning')"
  exit /b 0
)

REM Se timeout -1 ou Sim 6, continua
echo [%date% %time%] INICIO confirmado RESP=%RESP% >> "%LOG_FILE%"

cd /d %ROOT%
"%NODE_EXE%" "%DAILY_CAPTURE%" >> "%LOG_FILE%" 2>&1
"%PYTHON_EXE%" "%CUSTO_PY%" >> "%LOG_FILE%" 2>&1
set ERR=!errorlevel!

if !ERR! equ 0 (
  echo %TODAY% > "%LAST_SYNC_FILE%"
  powershell -Command "[System.Windows.Forms.MessageBox]::Show('Rotina concluida!`n`n- daily-snapshot salvo`n- custo_ia atualizado (20 linhas)`n- Ponto batido: %TODAY%', 'Orquestrador - OK', 'OK', 'Information')"
  echo [%date% %time%] PONTO BATIDO %TODAY% >> "%LOG_FILE%"
) else (
  powershell -Command "[System.Windows.Forms.MessageBox]::Show('Rotina falhou! Erro %ERR%. Veja rotina.log', 'Orquestrador - ERRO', 'OK', 'Error')"
  echo [%date% %time%] ERRO %ERR% >> "%LOG_FILE%"
)