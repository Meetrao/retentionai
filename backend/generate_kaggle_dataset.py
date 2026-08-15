import os
import pandas as pd
import numpy as np

def generate_healthcare_attrition_csv(filename=None, num_rows=1676):
    if filename is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        filename = os.path.join(base_dir, 'watson_healthcare_modified.csv')
    np.random.seed(42)
    
    # Generate realistic data
    ages = np.random.normal(38, 10, num_rows).clip(18, 65).astype(int)
    departments = np.random.choice(['Maternity', 'Cardiology', 'Neurology', 'Oncology', 'Emergency'], num_rows, p=[0.2, 0.3, 0.15, 0.15, 0.2])
    roles = []
    incomes = []
    for dept in departments:
        role = np.random.choice(['Nurse', 'Surgeon', 'Therapist', 'Administrator'])
        roles.append(role)
        if role == 'Surgeon': incomes.append(np.random.randint(12000, 25000))
        elif role == 'Nurse': incomes.append(np.random.randint(4000, 8000))
        elif role == 'Therapist': incomes.append(np.random.randint(5000, 9000))
        else: incomes.append(np.random.randint(3000, 6000))
        
    job_satisfaction = np.random.choice([1, 2, 3, 4], num_rows, p=[0.1, 0.2, 0.4, 0.3])
    work_life_balance = np.random.choice([1, 2, 3, 4], num_rows, p=[0.15, 0.25, 0.4, 0.2])
    performance_rating = np.random.choice([1, 2, 3, 4], num_rows, p=[0.05, 0.1, 0.7, 0.15])
    overtime = np.random.choice(['Yes', 'No'], num_rows, p=[0.3, 0.7])
    
    years_at_company = np.random.randint(0, 20, num_rows)
    total_working_years = years_at_company + np.random.randint(0, 10, num_rows)
    
    # Calculate attrition based on proxies (Overtime, JobSat, WLB)
    attrition_probs = np.ones(num_rows) * 0.05
    attrition_probs += (np.array(overtime) == 'Yes') * 0.15
    attrition_probs += (np.array(job_satisfaction) <= 2) * 0.15
    attrition_probs += (np.array(work_life_balance) <= 2) * 0.1
    attrition_probs += (np.array(incomes) < 5000) * 0.05
    
    attrition = np.random.binomial(1, np.clip(attrition_probs, 0, 1))
    attrition_str = np.where(attrition == 1, 'Yes', 'No')
    
    df = pd.DataFrame({
        'EmployeeID': range(1, num_rows + 1),
        'Age': ages,
        'Attrition': attrition_str,
        'BusinessTravel': np.random.choice(['Travel_Rarely', 'Travel_Frequently', 'Non-Travel'], num_rows),
        'DailyRate': np.random.randint(100, 1500, num_rows),
        'Department': departments,
        'DistanceFromHome': np.random.randint(1, 30, num_rows),
        'Education': np.random.randint(1, 6, num_rows),
        'EducationField': np.random.choice(['Medical', 'Life Sciences', 'Other'], num_rows),
        'EmployeeCount': 1,
        'EnvironmentSatisfaction': np.random.randint(1, 5, num_rows),
        'Gender': np.random.choice(['Male', 'Female'], num_rows),
        'HourlyRate': np.random.randint(30, 100, num_rows),
        'JobInvolvement': np.random.randint(1, 5, num_rows),
        'JobLevel': np.random.randint(1, 6, num_rows),
        'JobRole': roles,
        'JobSatisfaction': job_satisfaction,
        'MaritalStatus': np.random.choice(['Single', 'Married', 'Divorced'], num_rows),
        'MonthlyIncome': incomes,
        'MonthlyRate': np.random.randint(2000, 27000, num_rows),
        'NumCompaniesWorked': np.random.randint(0, 10, num_rows),
        'Over18': 'Y',
        'OverTime': overtime,
        'PercentSalaryHike': np.random.randint(11, 26, num_rows),
        'PerformanceRating': performance_rating,
        'RelationshipSatisfaction': np.random.randint(1, 5, num_rows),
        'StandardHours': 80,
        'Shift': np.random.randint(1, 4, num_rows),
        'TotalWorkingYears': total_working_years,
        'TrainingTimesLastYear': np.random.randint(0, 7, num_rows),
        'WorkLifeBalance': work_life_balance,
        'YearsAtCompany': years_at_company,
        'YearsInCurrentRole': np.clip(years_at_company - np.random.randint(0, 3, num_rows), 0, None),
        'YearsSinceLastPromotion': np.clip(years_at_company - np.random.randint(0, 5, num_rows), 0, None),
        'YearsWithCurrManager': np.clip(years_at_company - np.random.randint(0, 4, num_rows), 0, None)
    })
    
    df.to_csv(filename, index=False)
    print(f"Generated {filename} with shape {df.shape}")

if __name__ == '__main__':
    generate_healthcare_attrition_csv()
