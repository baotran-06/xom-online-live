@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title XOM ONLINE LIVE - Khoi dong
where node >nul 2>nul
if errorlevel 1 goto :missing_node
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto :missing_node
if not exist "scripts\launcher.mjs" (
  echo [LOI] Thieu scripts\launcher.mjs. Hay giai nen TOAN BO du an truoc.
  goto :failed
)
node "scripts\launcher.mjs" start
if errorlevel 1 goto :failed
exit /b 0
:missing_node
echo [LOI] Can cai Node.js 22 LTS hoac moi hon, bao gom npm.
echo Tai tu https://nodejs.org/en/download roi nhan START-XOM.bat lai.
:failed
echo [LOI] Chua khoi dong thanh cong. Xem thong bao tren va .runtime\logs\latest.log
if not "%XOM_NO_PAUSE%"=="1" pause
exit /b 1
