@echo off
chcp 65001 >nul
title AI Recruit - Local Development
echo ============================================
echo    AI Recruit - Khoi dong Local Dev
echo ============================================
echo.

:: ---- Kiem tra SQL Server ----
echo [1/4] Kiem tra SQL Server...
sqlcmd -S localhost -U sa -P 123 -Q "SELECT 1" -h -1 >nul 2>&1
if %errorlevel% neq 0 (
    echo [CANH BAO] Khong ket noi duoc SQL Server localhost!
    echo     Dam bao SQL Server dang chay va tai khoan sa/123 hoat dong.
    echo     Nhan Enter de tiep tuc hoac Ctrl+C de huy...
    pause >nul
)
echo     SQL Server OK!
echo.

:: ---- Khoi dong AI Service (Python FastAPI) ----
echo [2/4] Khoi dong AI Service (FastAPI :8000)...
cd /d "%~dp0ai_service"
if exist "venv\Scripts\activate.bat" (
    start "AI-Service" cmd /k "title AI Service - Port 8000 && call venv\Scripts\activate.bat && python main.py"
) else (
    start "AI-Service" cmd /k "title AI Service - Port 8000 && python main.py"
)
echo     AI Service dang khoi dong tai http://localhost:8000
echo.

:: ---- Khoi dong Backend (Node.js Express) ----
echo [3/4] Khoi dong Backend (Express :5000)...
cd /d "%~dp0backend"
start "Backend" cmd /k "title Backend API - Port 5000 && npm run dev"
echo     Backend dang khoi dong tai http://localhost:5000
echo.

:: ---- Khoi dong Frontend (Vite React) ----
echo [4/4] Khoi dong Frontend (Vite :5173)...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "title Frontend - Port 5173 && npm run dev"
echo     Frontend dang khoi dong tai http://localhost:5173
echo.

echo ============================================
echo    TAT CA DICH VU DA KHOI DONG!
echo ============================================
echo.
echo    Frontend:    http://localhost:5173
echo    Backend:     http://localhost:5000
echo    AI Service:  http://localhost:8000
echo    Swagger:     http://localhost:5000/api-docs
echo.
echo    De dung tat ca: chay stop-local.bat
echo    Hoac dong tung cua so terminal
echo ============================================
echo.

:: Tu dong mo trinh duyet
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Nhan phim bat ky de dong cua so nay...
pause >nul
