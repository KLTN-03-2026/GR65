@echo off
chcp 65001 >nul
title AI Recruit - Dung tat ca dich vu
echo ============================================
echo    AI Recruit - Dung tat ca dich vu
echo ============================================
echo.

:: Tat cac process Node.js (backend + frontend)
echo [1/3] Dung Node.js processes...
taskkill /F /FI "WINDOWTITLE eq Backend API - Port 5000" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend - Port 5173" >nul 2>&1
:: Tat cac node process lien quan
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST ^| findstr "PID"') do (
    echo     Dang tat node PID: %%a
)
echo     Node.js processes da dung.
echo.

:: Tat Python (AI Service)
echo [2/3] Dung AI Service (Python)...
taskkill /F /FI "WINDOWTITLE eq AI Service - Port 8000" >nul 2>&1
echo     AI Service da dung.
echo.

:: Tat cac cua so cmd phu
echo [3/3] Dong cac cua so terminal phu...
taskkill /F /FI "WINDOWTITLE eq AI-Service" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend" >nul 2>&1
echo     Da dong.
echo.

echo ============================================
echo    TAT CA DICH VU DA DUNG THANH CONG!
echo ============================================
echo.
timeout /t 3
