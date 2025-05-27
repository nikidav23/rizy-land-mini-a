#!/bin/bash

echo "=========================================="
echo "      RIZY LAND - Запуск приложения"
echo "=========================================="
echo ""

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "ОШИБКА: Node.js не установлен!"
    echo "Скачайте и установите Node.js с https://nodejs.org"
    echo ""
    exit 1
fi

echo "Node.js найден: $(node --version)"
echo ""

echo "Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ОШИБКА: Не удалось установить зависимости!"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Запуск RIZY LAND на http://localhost:5000"
echo "=========================================="
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

npm run dev