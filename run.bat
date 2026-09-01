@echo off
echo Starting RetentionAI Services...

echo Starting FastAPI Backend on port 8000...
start cmd /k "cd backend && uvicorn main:app --port 8000"

echo Starting React / Vite Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

echo Services have been launched.
echo FastAPI Backend: http://localhost:8000
echo React Frontend:  http://localhost:5173
