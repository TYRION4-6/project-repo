@echo off
title Shipbasket Enterprise Portal Launcher
cd /d "%~dp0"

echo ===================================================
echo     Starting Shipbasket Enterprise Portal...
echo ===================================================
echo.

if not exist "backend\node_modules\" (
    echo [!] Installing dependencies, please wait...
    call npm run install:all
) else if not exist "frontend\node_modules\" (
    echo [!] Installing dependencies, please wait...
    call npm run install:all
)

echo [>] Launching Shipbasket dev servers and opening browser...
echo.
call npm start
