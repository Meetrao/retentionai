import pandas as pd
import numpy as np
import random
from database import init_db, insert_employee, get_db_connection

def generate_mock_data(n=200):
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM employees")
    count = cursor.fetchone()[0]
    conn.close()
    
    if count > 0:
        return # Avoid duplicates
        
    np.random.seed(42)
    departments = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance']
    roles = ['Junior', 'Mid', 'Senior', 'Lead']
    
    for i in range(1, n+1):
        dept = random.choice(departments)
        role = random.choice(roles)
        
        working_hours = np.random.normal(loc=40, scale=8)
        if working_hours < 20: working_hours = 20
        if working_hours > 70: working_hours = 70
            
        leave_count = np.random.randint(0, 30)
        task_completion = np.random.randint(50, 100)
        perf_rating = np.random.uniform(1.0, 5.0)
        
        attrition_prob = 0.05
        if working_hours > 55:
            attrition_prob += 0.3
        if perf_rating < 2.5:
            attrition_prob += 0.4
        if leave_count > 20:
            attrition_prob += 0.2
        if task_completion < 60:
            attrition_prob += 0.3
            
        attrition = 1 if np.random.rand() < attrition_prob else 0
        
        data = {
            'emp_id': f"EMP{i:04d}",
            'name': f"Employee {i}",
            'department': dept,
            'salary': np.random.randint(40000, 150000),
            'email': f"emp{i}@company.com",
            'joining_date': f"202{np.random.randint(0,4)}-{np.random.randint(1,13):02d}-01",
            'role': role,
            'working_hours': round(working_hours, 1),
            'leave_count': leave_count,
            'task_completion': task_completion,
            'performance_rating': round(perf_rating, 1),
            'transfers': np.random.randint(0, 3),
            'attrition': attrition
        }
        insert_employee(data)

if __name__ == "__main__":
    generate_mock_data()
    print("Mock data generated successfully.")
