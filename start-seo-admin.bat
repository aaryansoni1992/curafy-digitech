@echo off
title Curafy Digitech - SEO Admin Panel
echo ========================================================
echo   Starting Curafy Digitech SEO Admin Panel...
echo   Opening: http://localhost:3000
echo ========================================================
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
node admin\server.js
pause
