@echo off
title Bose Data Studio v1.0
echo ========================================================
echo   Launching Bose Data Studio (Powered by BoseLang)
echo   Opening: http://localhost:7474
echo ========================================================
start http://localhost:7474
bose.exe server.bose
pause
