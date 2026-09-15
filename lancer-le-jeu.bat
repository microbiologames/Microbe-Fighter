@echo off
cd /d "%~dp0"
echo Demarrage du serveur du jeu...
start "Serveur - Microbe Fighter (ne pas fermer pendant que vous jouez)" cmd /k node server.js
timeout /t 2 /nobreak >nul
start "" http://localhost:8080
