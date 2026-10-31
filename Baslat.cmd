@echo off
setlocal
cd /d "%~dp0"
set "npm_config_cache=%CD%\.npm-cache"
set "ELECTRON_CACHE=%CD%\.electron-cache"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 veya daha yenisini kurduktan sonra tekrar deneyin.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Ilk kurulum: paketler indiriliyor. Internet baglantisi gerekir.
  call npm.cmd install --fetch-retries=1 --fetch-timeout=30000
  if errorlevel 1 (
    echo Kurulum tamamlanamadi. Internet erisimini kontrol edin.
    pause
    exit /b 1
  )
)
call npm.cmd run dev
if errorlevel 1 pause
