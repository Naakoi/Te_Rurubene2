#!/bin/bash

echo "🚀 Starting Rurubene2 Services on Network IP: 10.1.11.188..."

# 1. Start MinIO Storage
if [ -f "./minio" ]; then
    echo "📦 Starting MinIO Server..."
    ./minio server ~/minio-data --console-address ":9001" > minio.log 2>&1 &
    MINIO_PID=$!
    echo "   MinIO PID: $MINIO_PID"
else
    echo "📦 MinIO not found in root. Running setup_minio.sh..."
    chmod +x setup_minio.sh
    ./setup_minio.sh
    MINIO_PID=$(pgrep -f "minio server")
fi

# 2. Start Laravel Backend
echo "⚙️ Starting Laravel Backend..."
cd backend
php artisan serve --host=0.0.0.0 --port=8000 > laravel.log 2>&1 &
LARAVEL_PID=$!
cd ..
echo "   Laravel PID: $LARAVEL_PID"

# 3. Start Next.js Frontend
echo "💻 Starting Next.js Frontend..."
cd frontend
npm run dev -- -H 0.0.0.0 > nextjs.log 2>&1 &
NEXTJS_PID=$!
cd ..
echo "   Next.js PID: $NEXTJS_PID"

echo "=================================================="
echo "🎉 All services are starting up in the background!"
echo "=================================================="
echo "🔗 Web Client (Next.js): http://10.1.11.188:3000"
echo "🔗 API Backend (Laravel): http://10.1.11.188:8000"
echo "🔗 MinIO Console:         http://10.1.11.188:9001"
echo "=================================================="
echo "📝 Logs are being saved to:"
echo "   - MinIO:  minio.log"
echo "   - Backend: backend/laravel.log"
echo "   - Frontend: frontend/nextjs.log"
echo "=================================================="
echo "🛑 To stop all servers, run:"
echo "   kill $MINIO_PID $LARAVEL_PID $NEXTJS_PID"
echo "=================================================="

# Wait for background processes
wait
