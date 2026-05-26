#!/bin/bash

# Скрипт для запуска локального сервера
# Использование: ./start-server.sh

echo "Запуск локального сервера..."
echo "Откройте браузер и перейдите по адресу: http://localhost:8000"
echo "Для остановки нажмите Ctrl+C"
echo ""

# Проверяем наличие Python 3
if command -v python3 &> /dev/null
then
    python3 -m http.server 8000
# Проверяем наличие Python 2
elif command -v python &> /dev/null
then
    python -m SimpleHTTPServer 8000
else
    echo "Python не найден. Установите Python или используйте другой способ запуска сервера."
    exit 1
fi
