from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import authenticate, get_employee_data, init_db, update_employee_metrics
from ml_models import AttritionAnalyzer
import pandas as pd
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB if missing
init_db()
analyzer = AttritionAnalyzer()

# Train Model
train_df = get_employee_data(anonymize=True)
if not train_df.empty:
    analyzer.train(train_df)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(req: LoginRequest):
    user = authenticate(req.username, req.password)
    if user:
        return {"username": user['username'], "role": user['role']}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/dashboard")
def get_dashboard_data(role: str, department: str = None):
    # Enforce RBAC
    anonymize = (role == "Data Analyst")
    dept_filter = "Engineering" if role == "Team Lead" else department
    if dept_filter == "All" or dept_filter == "":
        dept_filter = None
        
    df = get_employee_data(anonymize=anonymize, department=dept_filter)
    if df.empty:
        return {"data": [], "kpis": {}}
        
    df['predicted_risk'] = analyzer.predict_batch_risk(df)
    
    # Calculate KPIs
    total = len(df)
    left = df['attrition'].sum()
    rates = (left / total * 100) if total else 0
    avg_hrs = df['working_hours'].mean() if total else 0
    avg_perf = df['performance_rating'].mean() if total else 0
    
    # Calculate a proxy burnout score (derived feature).
    # Assumes working hours > 40 increases burnout, performance < 3 correlates with low engagement.
    burnout_index = min(((avg_hrs / 40) * 50 + (5 - avg_perf) * 12.5), 100) if total else 0
    
    # Generate Recommended Actions based on features
    recommendations = []
    if avg_hrs > 45:
        recommendations.append({
            "issue": "High Workload (Proxy: Overtime/Hours > 45)",
            "action": "Immediate workload redistribution and mandatory time-off policies.",
            "urgency": "High",
            "color": "var(--accent-orange)"
        })
    if avg_perf < 3.0:
        recommendations.append({
            "issue": "Low Engagement (Proxy: Satisfaction/Perf < 3.0)",
            "action": "Schedule 1-on-1 discussions for at-risk groups.",
            "urgency": "Medium",
            "color": "var(--accent-red)"
        })
    if not recommendations:
        recommendations.append({
            "issue": "Stable Operating Parameters",
            "action": "Continue monitoring proxy variables. Maintain current retention strategies.",
            "urgency": "Low",
            "color": "var(--accent-emerald)"
        })
    
    # Handle NaNs for JSON
    df = df.fillna(0)
    
    return {
        "kpis": {
            "total_headcount": int(total),
            "attrition_rate": round(float(rates), 1),
            "avg_weekly_hours": round(float(avg_hrs), 1),
            "burnout_index": round(float(burnout_index), 1)
        },
        "recommendations": recommendations,
        "proxy_justification": "Note: Due to constraints in the IBM HR dataset (lack of real-time behavioral data), variables such as working_hours and performance are used as proxies for workload and engagement respectively.",
        "data": df.to_dict(orient="records")
    }

class PredictRequest(BaseModel):
    working_hours: float
    leave_count: int
    performance_rating: float
    task_completion: float
    transfers: int

@app.post("/api/predict")
def predict_risk(req: PredictRequest):
    res = analyzer.predict_risk(req.dict())
    if not res:
        raise HTTPException(status_code=500, detail="Model uninitialized")
    # Pydantic json compatibility
    res['risk_score'] = float(res['risk_score'])
    return res

@app.get("/api/metrics")
def get_metrics():
    train_df = get_employee_data(anonymize=True)
    if train_df.empty:
        raise HTTPException(status_code=500, detail="No Data")
    m = analyzer.train(train_df)
    fi = analyzer.get_feature_importances()
    
    return {
        "accuracy": m['accuracy'] * 100,
        "precision": m['precision'] * 100,
        "recall": m['recall'] * 100,
        "features": [{"name": f[0].replace('_', ' ').title(), "importance": float(f[1])} for f in fi]
    }

class UpdateEmployeeRequest(BaseModel):
    working_hours: float
    performance_rating: float
    leave_count: int
    task_completion: float
    transfers: int

@app.post("/api/employees/{emp_id}/update")
def update_employee(emp_id: str, req: UpdateEmployeeRequest):
    try:
        update_employee_metrics(
            emp_id, req.working_hours, req.performance_rating,
            req.leave_count, req.task_completion, req.transfers
        )
        return {"status": "success", "message": "Employee metrics updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
