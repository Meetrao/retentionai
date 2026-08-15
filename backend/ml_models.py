import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score

class AttritionAnalyzer:
    def __init__(self):
        self.log_reg = LogisticRegression(max_iter=1000, random_state=42)
        self.tree_clf = DecisionTreeClassifier(max_depth=4, random_state=42)
        self.kmeans = KMeans(n_clusters=3, random_state=42, n_init='auto')
        self.scaler = StandardScaler()
        
        self.features = ['working_hours', 'leave_count', 'performance_rating', 
                         'task_completion', 'transfers']
        self.is_trained = False
        
    def preprocess(self, df):
        X = df[self.features].copy()
        for col in self.features:
            if col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(X[col].mean())
            else:
                X[col] = 0.0 
        return X

    def train(self, df):
        if df.empty or 'attrition' not in df.columns:
            return None
            
        X = self.preprocess(df)
        y = df['attrition'].fillna(0)
        
        if len(y.unique()) < 2:
            return None 
            
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.log_reg.fit(X_train_scaled, y_train)
        self.tree_clf.fit(X_train, y_train) 
        self.kmeans.fit(X_train_scaled)
        
        self.is_trained = True
        
        preds = self.log_reg.predict(X_test_scaled)
        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        
        return {'accuracy': acc, 'precision': prec, 'recall': rec}
        
    def predict_risk(self, data_dict):
        if not self.is_trained:
            return None
            
        df = pd.DataFrame([data_dict])
        X = self.preprocess(df)
        X_scaled = self.scaler.transform(X)
        
        try:
            prob = self.log_reg.predict_proba(X_scaled)[0][1] * 100
        except IndexError:
            prob = self.log_reg.predict(X_scaled)[0] * 100
            
        cluster = self.kmeans.predict(X_scaled)[0]
        
        cluster_labels = {
            0: "Balanced Performer",
            1: "High Performer",
            2: "Burnout Risk Zone"
        }
        
        # Determine actionable factors
        factors = []
        if data_dict.get('working_hours', 0) > 50:
            factors.append("Elevated Working Hours")
        if data_dict.get('performance_rating', 0) < 3.0:
            factors.append("Declining Performance Rating")
        if data_dict.get('leave_count', 0) > 18:
            factors.append("High Leave Frequency (Burnout Indicator)")
        if data_dict.get('task_completion', 0) < 65:
            factors.append("Low Task Completion Efficiency")
            
        return {
            'risk_score': prob,
            'cluster': cluster_labels.get(cluster, f"Group {cluster}"),
            'factors': factors
        }
        
    def predict_batch_risk(self, df):
        if not self.is_trained:
            return np.zeros(len(df))
        X = self.preprocess(df)
        X_scaled = self.scaler.transform(X)
        try:
            probs = self.log_reg.predict_proba(X_scaled)[:, 1] * 100
        except IndexError:
            probs = self.log_reg.predict(X_scaled) * 100
        return probs

    def get_feature_importances(self):
        if not self.is_trained:
            return []
        importances = self.tree_clf.feature_importances_
        fi = list(zip(self.features, importances))
        fi.sort(key=lambda x: x[1], reverse=True)
        return fi
        
    def get_tree_rules(self):
        if not self.is_trained:
            return "Model not trained."
        return export_text(self.tree_clf, feature_names=self.features)
        
    def get_clusters(self, df):
        if not self.is_trained:
            return [0] * len(df)
        X = self.preprocess(df)
        X_scaled = self.scaler.transform(X)
        return self.kmeans.predict(X_scaled)
