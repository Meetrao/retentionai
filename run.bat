@echo off
echo Starting FastAPI Backend...
start cmd /k "cd backend && uvicorn main:app --port 8000"

echo Starting Streamlit Dashboard...
start cmd /k "cd backend && streamlit run app.py --server.port 8501 --server.headless true"

echo Starting React Frontend...
start cmd /k "cd frontend && npm run dev"

echo Services have been launched.
