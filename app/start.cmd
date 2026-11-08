@echo off
REM The Quiet Archive - app launcher (Windows).
REM
REM   start.cmd                          : bundled demo catalogue
REM   start.cmd --project ..\my-site     : your project
REM   start.cmd --url owner/repo         : clone, then run
REM
REM Needs Node 20+ (https://nodejs.org). Nothing else.

setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed, or not on PATH.
  echo.
  echo   Install the LTS from https://nodejs.org, then run this file again.
  echo   The app needs nothing else for the checks, the sitemap and citations.
  exit /b 1
)

for /f "delims=" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (
  echo Node is too old for this app; it needs 20 or newer.
  exit /b 1
)

if not exist node_modules (
  where npm >nul 2>nul
  if not errorlevel 1 (
    echo Installing the optional social-card renderer...
    call npm install --no-audit --no-fund --loglevel=error
  )
)

node bin\quiet-archive.mjs %*
endlocal
