@echo off
echo ==========================================
echo       RIZY LAND - Запуск приложения
echo ==========================================
echo.

:: Проверяем наличие Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте и установите Node.js с https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Node.js найден: 
node --version

echo.
echo Установка зависимостей...
call npm install

if errorlevel 1 (
    echo.
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Запуск RIZY LAND на http://localhost:5000
echo ==========================================
echo.
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev