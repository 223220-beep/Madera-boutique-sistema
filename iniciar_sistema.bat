@echo off
title Iniciando Sistema de Notas - Madera Boutique
color 0E

echo ===================================================
echo     INICIANDO SISTEMA DE NOTAS - MADERA BOUTIQUE
echo ===================================================
echo.
echo Iniciando base de datos y servidor central...
start "Servidor Central (Base de Datos)" cmd /k "npm run server"

echo.
echo Esperando a que el servidor arranque (5 segundos)...
timeout /t 5 /nobreak > nul

echo.
echo Iniciando interfaz de usuario (Frontend)...
start "Interfaz del Sistema" cmd /k "npm run dev -- --host"

echo.
echo Esperando a que la interfaz cargue (5 segundos)...
timeout /t 5 /nobreak > nul

echo ===================================================
echo   SISTEMA INICIADO CORRECTAMENTE.
echo   ABRIENDO NAVEGADOR...
echo ===================================================
start http://localhost:5173

echo.
echo  IMPORTANTE: 
echo  - No cierres las dos ventanas negras que se acaban de abrir.
echo  - Minimizalas y dejalas corriendo mientras el negocio este abierto.
echo  - Al terminar el dia, simplemente cierra las ventanas negras.
echo.
pause
