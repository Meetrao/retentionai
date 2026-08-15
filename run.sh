#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID $STREAMLIT_PID 2>/dev/null
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

# Start Backend
echo "Starting FastAPI Backend on port 8000..."
cd backend
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed or not in PATH."
    echo "Please activate your virtual environment or install dependencies with:"
    echo "  pip install -r requirements.txt"
    exit 1
fi
uvicorn main:app --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Resolve Frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "frontend/node_modules not found. Running 'npm install' in frontend directory..."
    cd frontend
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is not installed. Please install Node.js."
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    npm install
    cd ..
fi

# Start Frontend
echo "Starting React Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start Streamlit Dashboard
echo "Starting Streamlit Dashboard on port 8501..."
if ! command -v streamlit &> /dev/null; then
    echo "Warning: streamlit is not installed. Skipping Streamlit dashboard startup."
else
    streamlit run backend/app.py --server.port 8501 --server.headless true &
    STREAMLIT_PID=$!
fi

echo "----------------------------------------"
echo "Services are running."
echo "FastAPI Backend: http://localhost:8000"
echo "React Frontend:  http://localhost:5173"
echo "Streamlit App:   http://localhost:8501"
echo "Press Ctrl+C to stop all services."
echo "----------------------------------------"

# Wait for background processes to finish
wait
