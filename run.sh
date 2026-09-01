#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT) and exit signals to run cleanup
trap cleanup SIGINT SIGTERM

# 1. Resolve Python Virtual Environment
if [ -d "venv" ]; then
    echo "Found local virtual environment (venv). Activating..."
    source venv/bin/activate
elif [ -d "backend/venv" ]; then
    echo "Found local virtual environment inside backend (backend/venv). Activating..."
    source backend/venv/bin/activate
fi

# 2. Start FastAPI Backend
echo "Starting FastAPI Backend on port 8000..."
cd backend
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed or not in PATH."
    echo "Please install dependencies with: pip install -r requirements.txt"
    exit 1
fi
uvicorn main:app --port 8000 &
BACKEND_PID=$!
cd ..

# 3. Resolve Frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "frontend/node_modules not found. Running 'npm install'..."
    cd frontend
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is not installed. Please install Node.js."
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    npm install
    cd ..
fi

# 4. Start React Frontend
echo "Starting React / Vite Frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "----------------------------------------"
echo "RetentionAI Services are running."
echo "FastAPI Backend: http://localhost:8000"
echo "React Frontend:  http://localhost:5173"
echo "Press Ctrl+C to stop all services."
echo "----------------------------------------"

# Wait for background processes to finish
wait
