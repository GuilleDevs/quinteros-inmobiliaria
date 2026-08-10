@echo off
REM ============================================================
REM  Entorno local de desarrollo — Quinteros Grupo Inmobiliario
REM ------------------------------------------------------------
REM  Levanta MySQL y el servidor PHP para poder usar el panel
REM  en esta computadora. Doble clic y listo.
REM
REM  Requiere XAMPP instalado en C:\xampp
REM  Para cerrar todo: cerrá las dos ventanas negras que se abren.
REM ============================================================

setlocal
set XAMPP=C:\xampp
set PROYECTO=%~dp0
set PUERTO=8080

if not exist "%XAMPP%\php\php.exe" (
  echo.
  echo  ERROR: no se encontro XAMPP en %XAMPP%
  echo  Instalalo desde https://www.apachefriends.org
  echo.
  pause
  exit /b 1
)

echo.
echo  Levantando MySQL...
start "MySQL - Quinteros" /min "%XAMPP%\mysql\bin\mysqld.exe" --defaults-file=%XAMPP%\mysql\bin\my.ini --standalone

echo  Esperando a que MySQL responda...
timeout /t 8 /nobreak >nul

echo  Levantando el servidor web...
start "PHP - Quinteros" /min "%XAMPP%\php\php.exe" -S localhost:%PUERTO% -t "%PROYECTO%."

timeout /t 3 /nobreak >nul

echo.
echo  ============================================
echo    Sitio:  http://localhost:%PUERTO%/
echo    Panel:  http://localhost:%PUERTO%/admin.php
echo  ============================================
echo.
echo  Se abre el navegador...
start http://localhost:%PUERTO%/admin.php

echo.
echo  Para cerrar todo, cerra las dos ventanas minimizadas
echo  llamadas "MySQL - Quinteros" y "PHP - Quinteros".
echo.
pause
