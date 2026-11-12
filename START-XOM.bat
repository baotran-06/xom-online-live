@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js 22 LTS hoac moi hon tu https://nodejs.org
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 (
  echo Node.js qua cu. Hay cai Node.js 22 LTS hoac moi hon.
  pause
  exit /b 1
)
if not exist node_modules\three\package.json (
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto :failed
)
call npm run build
if errorlevel 1 goto :failed
start "" http://127.0.0.1:3210/admin
node bridge/server.js
pause
exit /b
:failed
echo Khong cai duoc thu vien hoac build. Kiem tra mang va thu lai.
pause
exit /b 1
