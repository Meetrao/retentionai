import pandas as pd
import sqlite3
from database import get_db_connection, insert_employee
import os

def import_csv_to_db(filename=None):
    if filename is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        filename = os.path.join(base_dir, 'watson_healthcare_modified.csv')
    df = pd.read_csv(filename)
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM employees") # Clear old mocked data
    conn.commit()
    conn.close()
    
    for _, row in df.iterrows():
        # Proxy mapping from IBM HR Dataset
        working_hours = 50.0 if row['OverTime'] == 'Yes' else 40.0
        # Job satisfaction (1-4) mapped to task completion (25-100)
        task_completion = row['JobSatisfaction'] * 25
        # Work-Life Balance (1-4) mapped inversely to leave count
        leave_count = (5 - row['WorkLifeBalance']) * 5
        
        attrition = 1 if row['Attrition'] == 'Yes' else 0
        
        data = {
            'emp_id': f"EMP_{row['EmployeeID']:04d}",
            'name': f"Healthcare Worker {row['EmployeeID']}",
            'department': row['Department'],
            'salary': row['MonthlyIncome'],
            'email': f"emp{row['EmployeeID']}@hospital.org",
            'joining_date': f"2023-01-01",  # Placeholder
            'role': row['JobRole'],
            'working_hours': working_hours,
            'leave_count': leave_count,
            'task_completion': task_completion,
            'performance_rating': float(row['PerformanceRating']),
            'transfers': 0,
            'attrition': attrition
        }
        insert_employee(data)
        
    print("Successfully imported Kaggle dataset into Database using proxy variables!")

if __name__ == "__main__":
    import_csv_to_db()
