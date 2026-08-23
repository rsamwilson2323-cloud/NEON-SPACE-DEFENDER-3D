@echo off
setlocal EnableExtensions
title NEON SPACE DEFENDER 3D - Local Server
cd /d "%~dp0"

echo.
echo ==========================================
echo     NEON SPACE DEFENDER 3D
echo        LOCAL SERVER RUNNER
echo ==========================================
echo.

:: ==========================================
:: CHECK NODE.JS
:: ==========================================
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Install Node.js 20+ from:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js %NODE_VERSION%

:: ==========================================
:: CHECK NPM
:: ==========================================
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available.
    echo Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo [OK] npm %NPM_VERSION%
echo.

:: ==========================================
:: CHECK PACKAGE.JSON
:: ==========================================
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo.
    echo Make sure this BAT file is inside
    echo the Neon Space Defender project folder.
    echo.
    pause
    exit /b 1
)

echo [OK] package.json found.
echo.

:: ==========================================
:: INSTALL / REPAIR DEPENDENCIES
:: ==========================================
if not exist "node_modules" (
    echo ==========================================
    echo Installing dependencies...
    echo ==========================================
    echo.
    
    call npm install
    
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        echo.
        echo Try running:
        echo npm install
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Dependencies installed successfully.
) else (
    echo [OK] node_modules already exists.
    echo Checking dependencies...
    echo.
    
    call npm install
    
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed.
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Dependencies are ready.
)

echo.

:: ==========================================
:: CHECK VITE
:: ==========================================
if not exist "node_modules\.bin\vite.cmd" (
    echo [WARNING] Vite was not found.
    echo Installing Vite...
    echo.
    
    call npm install vite
    
    if errorlevel 1 (
        echo.
        echo [ERROR] Could not install Vite.
        pause
        exit /b 1
    )
)

echo [OK] Vite found.
echo.

:: ==========================================
:: GET LOCAL IP
:: ==========================================
set "LOCAL_IP="

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"IPv4"') do (
    if not defined LOCAL_IP (
        set "LOCAL_IP=%%a"
    )
)

set "LOCAL_IP=%LOCAL_IP: =%"

:: ==========================================
:: START SERVER
:: ==========================================
echo ==========================================
echo     STARTING NEON SPACE DEFENDER 3D
echo ==========================================
echo.
echo Local:   http://localhost:5173

if defined LOCAL_IP (
    echo Network: http://%LOCAL_IP%:5173
)

echo.
echo Opening browser...
echo.
echo Press CTRL+C to stop the server.
echo ==========================================
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: ==========================================
:: START VITE
:: ==========================================
call npm run dev -- --host 0.0.0.0 --port 5173

echo.
echo ==========================================
echo Server stopped.
echo ==========================================
pause