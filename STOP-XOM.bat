@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title XOM ONLINE LIVE - Dung dich vu
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay Node.js. Khong tat bat ky tien trinh nao.
  goto :failed
)
node "scripts\launcher.mjs" stop
if errorlevel 1 goto :failed
if not "%XOM_NO_PAUSE%"=="1" pause
exit /b 0
:failed
echo [LOI] Chua the dung an toan. Xem thong bao tren va cua so START.
if not "%XOM_NO_PAUSE%"=="1" pause
exit /b 1
