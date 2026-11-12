@echo off
setlocal
cd /d "%~dp0"
call npm ci --prefix bridge --no-audit --no-fund
if errorlevel 1 (
  echo Cai thu vien TikTok that bai. DEMO van hoat dong.
) else (
  echo Da cai thu vien. Chua phai xac nhan ket noi LIVE thanh cong.
)
pause
