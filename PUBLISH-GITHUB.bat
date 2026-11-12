@echo off
setlocal
cd /d "%~dp0"
where gh >nul 2>nul
if errorlevel 1 (
  echo Cai GitHub CLI tu https://cli.github.com va dang nhap bang gh auth login.
  pause
  exit /b 1
)
where git >nul 2>nul
if errorlevel 1 (
  echo Can cai Git for Windows.
  pause
  exit /b 1
)
gh auth status
if errorlevel 1 (
  echo Hay dang nhap tren may cua ban: gh auth login
  pause
  exit /b 1
)
if not exist .git (
  git init -b main
  if errorlevel 1 exit /b 1
  git config user.name >nul 2>nul
  if errorlevel 1 git config user.name "Xom Online Live"
  git config user.email >nul 2>nul
  if errorlevel 1 git config user.email "xom-online-live@users.noreply.github.com"
  git add .
  git commit -m "Build Xom Online Live: 3D tavern, DEMO and TikTok bridge"
  if errorlevel 1 exit /b 1
)
node scripts/publish-github.mjs
pause
