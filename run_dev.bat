@echo off
title LunaAstra Developer Mode
echo ======================================================================
echo    LUNA-ASTRA — DEVELOPER MODE (FASTAPI + VITE HMR)
echo ======================================================================
echo.
start cmd /k "python -m backend.main"
cd frontend
npm run dev
