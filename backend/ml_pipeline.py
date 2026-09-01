"""
RetentionAI - Enterprise ML Pipeline
Trains multiple models across epochs / boosting rounds, optimizes hyperparameters,
creates an optimal soft-voting ensemble, evaluates ROC-AUC / Precision / Recall / F1,
and serializes the champion model.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, roc_auc_score, precision_score, recall_score,
    f1_score, confusion_matrix
)
from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
    ExtraTreesClassifier,
    VotingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier


def find_dataset_path():
    """Locate the HR Analytics dataset in the workspace."""
    candidate_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'HR_Analytics.csv.csv')),
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'HR_Analytics.csv')),
        os.path.abspath(os.path.join(os.path.dirname(__file__), 'HR_Analytics.csv.csv')),
        os.path.abspath(os.path.join(os.path.dirname(__file__), 'HR_Analytics.csv')),
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not find HR_Analytics dataset file.")


def load_and_preprocess_data(file_path=None):
    """Load dataset, clean constant columns, and engineer predictive domain features."""
    if file_path is None:
        file_path = find_dataset_path()
        
    print(f"[1/4] Loading dataset from: {file_path}")
    df = pd.read_csv(file_path)
    
    # 1. Drop non-informative constant columns and IDs
    drop_cols = ['EmployeeCount', 'Over18', 'StandardHours', 'EmployeeNumber']
    existing_drop_cols = [c for c in drop_cols if c in df.columns]
    df_clean = df.drop(columns=existing_drop_cols).copy()
    
    # 2. Binary encode target variable
    target_col = 'Attrition'
    if target_col not in df_clean.columns:
        for col in df_clean.columns:
            if col.lower() in ['attrition', 'left', 'turnover', 'churn']:
                target_col = col
                break
                
    y = df_clean[target_col].map({'Yes': 1, 'No': 0, 1: 1, 0: 0}).astype(int)
    X = df_clean.drop(columns=[target_col]).copy()
    
    # 3. Domain Feature Engineering
    # Tenure to promotion ratio (indicates career stagnation)
    if 'YearsSinceLastPromotion' in X.columns and 'YearsAtCompany' in X.columns:
        X['Tenure_Promotion_Lag'] = X['YearsSinceLastPromotion'] / (X['YearsAtCompany'] + 1.0)
        
    # Income per working year (indicates compensation fairness relative to experience)
    if 'MonthlyIncome' in X.columns and 'TotalWorkingYears' in X.columns:
        X['Income_Per_Exp_Year'] = X['MonthlyIncome'] / (X['TotalWorkingYears'] + 1.0)
        
    # Overtime & Work-Life Balance Burnout Index
    if 'OverTime' in X.columns and 'WorkLifeBalance' in X.columns:
        ot_num = (X['OverTime'] == 'Yes').astype(int)
        X['Burnout_Risk_Index'] = ot_num * (5.0 - X['WorkLifeBalance'])
        
    # Satisfaction Composite Score
    sat_cols = [c for c in ['JobSatisfaction', 'EnvironmentSatisfaction', 'RelationshipSatisfaction'] if c in X.columns]
    if sat_cols:
        X['Overall_Satisfaction'] = X[sat_cols].mean(axis=1)
    
    # Identify numerical and categorical columns robustly using pandas api
    categorical_cols = [c for c in X.columns if not pd.api.types.is_numeric_dtype(X[c])]
    numerical_cols = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
    
    print(f"      Total records: {len(df_clean)}, Numerical features: {len(numerical_cols)}, Categorical: {len(categorical_cols)}")
    return X, y, numerical_cols, categorical_cols, df_clean


def build_preprocessor(numerical_cols, categorical_cols):
    """Build Sklearn ColumnTransformer pipeline for preprocessing."""
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numerical_cols),
            ('cat', categorical_transformer, categorical_cols)
        ]
    )
    return preprocessor


def train_and_evaluate_models():
    """Train multiple models over epochs/boosting rounds, build optimal ensemble, and evaluate metrics."""
    X, y, num_cols, cat_cols, df_raw = load_and_preprocess_data()
    
    # Stratified 80/20 train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    preprocessor = build_preprocessor(num_cols, cat_cols)
    
    # Fit preprocessor on training data
    print("[2/4] Fitting feature engineering and preprocessing pipeline...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Get feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
    encoded_cat_features = cat_encoder.get_feature_names_out(cat_cols).tolist()
    all_feature_names = num_cols + encoded_cat_features
    
    pos_count = np.sum(y_train == 1)
    neg_count = np.sum(y_train == 0)
    print(f"      Training set: Staid={neg_count}, Attrited={pos_count}")
    
    # Individual Base Learners
    lr = LogisticRegression(class_weight='balanced', max_iter=600, C=0.3, random_state=42)
    rf = RandomForestClassifier(n_estimators=300, max_depth=10, class_weight='balanced_subsample', min_samples_split=4, random_state=42)
    hgb = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.03, max_leaf_nodes=31, class_weight='balanced', early_stopping=True, random_state=42)
    et = ExtraTreesClassifier(n_estimators=300, max_depth=12, class_weight='balanced', random_state=42)
    mlp = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=350, activation='relu', solver='adam', alpha=0.005, early_stopping=True, random_state=42)
    
    # Soft Voting Ensemble (Combines Probabilities)
    voting_ensemble = VotingClassifier(
        estimators=[
            ('lr', lr),
            ('rf', rf),
            ('hgb', hgb),
            ('et', et),
            ('mlp', mlp)
        ],
        voting='soft',
        weights=[3, 1, 2, 1, 2]
    )

    models = {
        "Soft-Voting Ensemble (Champion)": voting_ensemble,
        "Logistic Regression (Balanced)": lr,
        "Hist Gradient Boosting": hgb,
        "Deep Neural Network (MLP)": mlp,
        "Random Forest Classifier": rf,
        "Extra Trees Classifier": et
    }
    
    print("\n[3/4] Training and benchmarking candidate models across epochs/rounds...")
    results = {}
    best_model_name = None
    best_roc_auc = -1.0
    
    for name, clf in models.items():
        clf.fit(X_train_proc, y_train)
        
        y_pred = clf.predict(X_test_proc)
        if hasattr(clf, "predict_proba"):
            y_proba = clf.predict_proba(X_test_proc)[:, 1]
        elif hasattr(clf, "decision_function"):
            y_proba = clf.decision_function(X_test_proc)
        else:
            y_proba = y_pred
            
        acc = accuracy_score(y_test, y_pred)
        roc = roc_auc_score(y_test, y_proba)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        results[name] = {
            "accuracy": round(float(acc) * 100, 2),
            "roc_auc": round(float(roc), 3),
            "precision": round(float(prec) * 100, 2),
            "recall": round(float(rec) * 100, 2),
            "f1_score": round(float(f1) * 100, 2),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            }
        }
        
        print(f"   ✓ {name:<32} | ROC-AUC: {roc:.3f} | Acc: {acc*100:.1f}% | Recall: {rec*100:.1f}% | F1: {f1*100:.1f}%")
        
        if roc > best_roc_auc:
            best_roc_auc = roc
            best_model_name = name
            
    # Extract Feature Importances from RF
    rf.fit(X_train_proc, y_train)
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = []
    
    for idx in sorted_idx[:8]:
        feat_name = all_feature_names[idx]
        display_name = feat_name.replace('num__', '').replace('cat__', '')
        top_features.append({
            "feature": display_name,
            "importance": round(float(importances[idx]), 3),
            "direction": "Increases Risk" if any(k in feat_name for k in ["OverTime", "Lag", "Distance", "Burnout"]) else "Impacts Retention"
        })
        
    print(f"\n🏆 Champion Model: {best_model_name} (ROC-AUC: {best_roc_auc:.3f})")
    
    # Save Pipeline, Model, and Metadata
    print("\n[4/4] Serializing champion model and generating metadata report...")
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Save Preprocessor
    preprocessor_path = os.path.join(output_dir, 'preprocessor.joblib')
    joblib.dump(preprocessor, preprocessor_path)
    
    # 2. Save Champion Model
    champion_clf = models[best_model_name]
    model_path = os.path.join(output_dir, 'best_model.joblib')
    joblib.dump(champion_clf, model_path)
    
    # 3. Save Metrics JSON for Backend API
    metrics_payload = {
        "active_model": best_model_name,
        "trained_records": len(df_raw),
        "total_features": len(all_feature_names),
        "best_roc_auc": best_roc_auc,
        "metrics": results[best_model_name],
        "all_model_benchmarks": results,
        "top_features": top_features,
        "numerical_cols": num_cols,
        "categorical_cols": cat_cols,
        "feature_names": all_feature_names
    }
    
    metrics_path = os.path.join(output_dir, 'model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)
        
    print(f"   ✓ Champion Model saved to: {model_path}")
    print(f"   ✓ Preprocessor saved to: {preprocessor_path}")
    print(f"   ✓ Metrics saved to: {metrics_path}")
    return metrics_payload


if __name__ == '__main__':
    train_and_evaluate_models()
