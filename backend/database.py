import sqlite3
import pandas as pd
from security import encrypt_data, decrypt_data, hash_password, verify_password

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "employee_data.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT
        )
    ''')
    
    # Employees data table
    c.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            emp_id TEXT PRIMARY KEY,
            name TEXT,
            department TEXT,
            salary_enc TEXT,
            email_enc TEXT,
            joining_date TEXT,
            role TEXT,
            working_hours REAL,
            leave_count INTEGER,
            task_completion INTEGER,
            performance_rating REAL,
            transfers INTEGER,
            attrition INTEGER
        )
    ''')
    
    # Seed default users if none exists
    c.execute("SELECT * FROM users WHERE username='admin'")
    if not c.fetchone():
        pwd = hash_password("admin")
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ("admin", pwd, "HR Manager"))
        
        pwd2 = hash_password("lead")
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ("lead", pwd2, "Team Lead"))
                  
        pwd3 = hash_password("analyst")
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ("analyst", pwd3, "Data Analyst"))

    conn.commit()
    conn.close()

def get_employee_data(anonymize=False, department=None):
    conn = get_db_connection()
    query = "SELECT * FROM employees"
    if department:
        query += f" WHERE department = '{department}'"
        
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if df.empty:
        return df

    # Decrypt attributes
    df['salary'] = df['salary_enc'].apply(lambda x: float(decrypt_data(x)) if pd.notnull(x) and x else 0)
    df['email'] = df['email_enc'].apply(lambda x: decrypt_data(x) if pd.notnull(x) and x else "Unknown")
    
    if anonymize:
        df = df.drop(columns=['name', 'email', 'salary_enc', 'email_enc', 'salary'])
    else:
        df = df.drop(columns=['salary_enc', 'email_enc'])
        
    return df

def insert_employee(data):
    conn = get_db_connection()
    c = conn.cursor()
    
    salary_enc = encrypt_data(str(data.get('salary', 0)))
    email_enc = encrypt_data(data.get('email', ''))
    
    c.execute('''
        INSERT INTO employees (
            emp_id, name, department, salary_enc, email_enc, joining_date, role,
            working_hours, leave_count, task_completion, performance_rating, transfers, attrition
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['emp_id'], data['name'], data['department'], salary_enc, email_enc,
        data['joining_date'], data['role'], data['working_hours'], data['leave_count'],
        data['task_completion'], data['performance_rating'], data['transfers'], data['attrition']
    ))
    conn.commit()
    conn.close()

def authenticate(username, password):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    user = c.fetchone()
    conn.close()
    if user and verify_password(password, user['password_hash']):
        return dict(user)
    return None

def update_employee_metrics(emp_id, working_hours, performance_rating, leave_count, task_completion, transfers):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        UPDATE employees
        SET working_hours = ?, performance_rating = ?, leave_count = ?, task_completion = ?, transfers = ?
        WHERE emp_id = ?
    ''', (working_hours, performance_rating, leave_count, task_completion, transfers, emp_id))
    conn.commit()
    conn.close()
