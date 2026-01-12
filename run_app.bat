@echo off
echo ===================================================
echo   INICIANDO FLIGHT TRACKER (AWS S3 EDITION)
echo ===================================================
echo.
echo 1. Iniciando Backend (FastAPI)...
echo    (Dejala ventana abierta)
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo.
echo 2. Esperando unos segundos...
timeout /t 5 >nul

echo.
echo 3. Abriendo Frontend...
start frontend/index.html

echo.
echo ===================================================
echo   ¡LISTO! Usa la web para buscar y crear alertas.
echo   Tus datos se guardaran en AWS S3.
echo ===================================================
pause
