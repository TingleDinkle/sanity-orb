"""
XGBoost Models for Sanity Orb Predictions
Implements multiple XGBoost models for different prediction tasks
"""

import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, accuracy_score, classification_report
import joblib
import json
from datetime import datetime
import os

class SanityXGBoostModels:
    def __init__(self):
        self.session_model = None
        self.trend_model = None
        self.classification_model = None
        self.models_dir = 'ml-model/trained_models'
        os.makedirs(self.models_dir, exist_ok=True)
        
    def train_session_predictor(self, data_path='ml-model/data/session_data.csv'):
        """Train XGBoost model to predict next sanity level"""
        print("\n" + "="*60)
        print("Training Session Prediction Model (XGBoost Regressor)")
        print("="*60)
        
        # Load data
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} training samples")
        
        # Prepare features and target
        feature_columns = [
            'hour', 'day_of_week', 'session_duration', 'interactions',
            'prev_sanity_1', 'prev_sanity_2', 'prev_sanity_3', 
            'avg_prev_sanity', 'stress_level', 'mood_factor'
        ]
        
        X = df[feature_columns]
        y = df['current_sanity']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Train XGBoost model
        print("\nTraining XGBoost model...")
        self.session_model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='reg:squarederror',
            random_state=42,
            n_jobs=-1
        )
        
        self.session_model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Evaluate
        train_pred = self.session_model.predict(X_train)
        test_pred = self.session_model.predict(X_test)
        
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        train_mae = mean_absolute_error(y_train, train_pred)
        test_mae = mean_absolute_error(y_test, test_pred)
        
        print(f"\n✓ Model trained successfully!")
        print(f"  Train RMSE: {train_rmse:.2f}")
        print(f"  Test RMSE: {test_rmse:.2f}")
        print(f"  Train MAE: {train_mae:.2f}")
        print(f"  Test MAE: {test_mae:.2f}")
        
        # Feature importance
        feature_importance = dict(zip(feature_columns, self.session_model.feature_importances_))
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\nTop 5 Most Important Features:")
        for feat, imp in sorted_features[:5]:
            print(f"  {feat}: {imp:.4f}")
        
        # Save model
        model_path = os.path.join(self.models_dir, 'session_predictor.json')
        self.session_model.save_model(model_path)
        print(f"\n✓ Model saved to {model_path}")
        
        # Save metadata
        metadata = {
            'model_type': 'XGBoost Regressor',
            'task': 'Session Sanity Prediction',
            'trained_date': datetime.now().isoformat(),
            'n_samples': len(df),
            'features': feature_columns,
            'metrics': {
                'train_rmse': float(train_rmse),
                'test_rmse': float(test_rmse),
                'train_mae': float(train_mae),
                'test_mae': float(test_mae)
            },
            'feature_importance': {k: float(v) for k, v in sorted_features}
        }
        
        with open(os.path.join(self.models_dir, 'session_predictor_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata
    
    def train_trend_predictor(self, data_path='ml-model/data/trend_data.csv'):
        """Train XGBoost model to predict future trends"""
        print("\n" + "="*60)
        print("Training Trend Prediction Model (XGBoost Regressor)")
        print("="*60)
        
        # Load data
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} training samples")
        
        # Prepare features and targets
        feature_columns = [
            'mean', 'std', 'min', 'max', 'range', 'slope',
            'last_3_avg', 'first_3_avg', 'volatility'
        ]
        
        X = df[feature_columns]
        y_value = df['next_value']
        y_confidence = df['confidence']
        
        # Split data
        X_train, X_test, y_train_val, y_test_val, y_train_conf, y_test_conf = train_test_split(
            X, y_value, y_confidence, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Train next value predictor
        print("\nTraining next value predictor...")
        value_model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='reg:squarederror',
            random_state=42,
            n_jobs=-1
        )
        
        value_model.fit(X_train, y_train_val, verbose=False)
        
        # Train confidence predictor
        print("Training confidence predictor...")
        confidence_model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='reg:squarederror',
            random_state=42,
            n_jobs=-1
        )
        
        confidence_model.fit(X_train, y_train_conf, verbose=False)
        
        # Store both models
        self.trend_model = {
            'value': value_model,
            'confidence': confidence_model
        }
        
        # Evaluate
        value_pred = value_model.predict(X_test)
        conf_pred = confidence_model.predict(X_test)
        
        value_rmse = np.sqrt(mean_squared_error(y_test_val, value_pred))
        conf_rmse = np.sqrt(mean_squared_error(y_test_conf, conf_pred))
        
        print(f"\n✓ Models trained successfully!")
        print(f"  Next Value RMSE: {value_rmse:.2f}")
        print(f"  Confidence RMSE: {conf_rmse:.2f}")
        
        # Save models
        value_model.save_model(os.path.join(self.models_dir, 'trend_value_predictor.json'))
        confidence_model.save_model(os.path.join(self.models_dir, 'trend_confidence_predictor.json'))
        print(f"\n✓ Models saved to {self.models_dir}")
        
        # Save metadata
        metadata = {
            'model_type': 'XGBoost Regressor (Dual)',
            'task': 'Trend Prediction',
            'trained_date': datetime.now().isoformat(),
            'n_samples': len(df),
            'features': feature_columns,
            'metrics': {
                'value_rmse': float(value_rmse),
                'confidence_rmse': float(conf_rmse)
            }
        }
        
        with open(os.path.join(self.models_dir, 'trend_predictor_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata
    
    def train_classifier(self, data_path='ml-model/data/classification_data.csv'):
        """Train XGBoost classifier for sanity level categories"""
        print("\n" + "="*60)
        print("Training Classification Model (XGBoost Classifier)")
        print("="*60)
        
        # Load data
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} training samples")
        
        # Prepare features and target
        feature_columns = [
            'current_sanity', 'session_count', 'avg_duration',
            'interaction_rate', 'consistency'
        ]
        
        X = df[feature_columns]
        y = df['category']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Train XGBoost classifier
        print("\nTraining XGBoost classifier...")
        self.classification_model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='multi:softmax',
            num_class=4,
            random_state=42,
            n_jobs=-1
        )
        
        self.classification_model.fit(X_train, y_train, verbose=False)
        
        # Evaluate
        train_pred = self.classification_model.predict(X_train)
        test_pred = self.classification_model.predict(X_test)
        
        train_acc = accuracy_score(y_train, train_pred)
        test_acc = accuracy_score(y_test, test_pred)
        
        print(f"\n✓ Model trained successfully!")
        print(f"  Train Accuracy: {train_acc*100:.2f}%")
        print(f"  Test Accuracy: {test_acc*100:.2f}%")
        
        print(f"\nClassification Report:")
        class_names = ['Critical', 'Unstable', 'Stable', 'Optimal']
        print(classification_report(y_test, test_pred, target_names=class_names))
        
        # Save model
        model_path = os.path.join(self.models_dir, 'sanity_classifier.json')
        self.classification_model.save_model(model_path)
        print(f"\n✓ Model saved to {model_path}")
        
        # Save metadata
        metadata = {
            'model_type': 'XGBoost Classifier',
            'task': 'Sanity Level Classification',
            'trained_date': datetime.now().isoformat(),
            'n_samples': len(df),
            'features': feature_columns,
            'classes': class_names,
            'metrics': {
                'train_accuracy': float(train_acc),
                'test_accuracy': float(test_acc)
            }
        }
        
        with open(os.path.join(self.models_dir, 'sanity_classifier_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata
    
    def load_models(self):
        """Load all trained models"""
        print("\nLoading trained models...")
        
        # Load session predictor
        session_path = os.path.join(self.models_dir, 'session_predictor.json')
        if os.path.exists(session_path):
            self.session_model = xgb.XGBRegressor()
            self.session_model.load_model(session_path)
            print("✓ Session predictor loaded")
        
        # Load trend predictors
        value_path = os.path.join(self.models_dir, 'trend_value_predictor.json')
        conf_path = os.path.join(self.models_dir, 'trend_confidence_predictor.json')
        if os.path.exists(value_path) and os.path.exists(conf_path):
            value_model = xgb.XGBRegressor()
            value_model.load_model(value_path)
            conf_model = xgb.XGBRegressor()
            conf_model.load_model(conf_path)
            self.trend_model = {
                'value': value_model,
                'confidence': conf_model
            }
            print("✓ Trend predictors loaded")
        
        # Load classifier
        classifier_path = os.path.join(self.models_dir, 'sanity_classifier.json')
        if os.path.exists(classifier_path):
            self.classification_model = xgb.XGBClassifier()
            self.classification_model.load_model(classifier_path)
            print("✓ Sanity classifier loaded")
        
        print("\n✓ All models loaded successfully!")

def train_all_models():
    """Train all XGBoost models"""
    print("\n" + "="*70)
    print("SANITY ORB - XGBoost AI MODEL TRAINING")
    print("="*70)
    
    models = SanityXGBoostModels()
    
    # Train all models
    session_metadata = models.train_session_predictor()
    trend_metadata = models.train_trend_predictor()
    classification_metadata = models.train_classifier()
    
    # Create summary
    summary = {
        'training_date': datetime.now().isoformat(),
        'models_trained': 3,
        'session_predictor': session_metadata,
        'trend_predictor': trend_metadata,
        'classifier': classification_metadata
    }
    
    with open('ml-model/trained_models/training_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n" + "="*70)
    print("✓ ALL MODELS TRAINED SUCCESSFULLY!")
    print("="*70)
    print(f"\nModels saved to: ml-model/trained_models/")
    print("\nSummary:")
    print(f"  • Session Predictor - RMSE: {session_metadata['metrics']['test_rmse']:.2f}")
    print(f"  • Trend Predictor - RMSE: {trend_metadata['metrics']['value_rmse']:.2f}")
    print(f"  • Sanity Classifier - Accuracy: {classification_metadata['metrics']['test_accuracy']*100:.2f}%")
    print("\n")
    
if __name__ == '__main__':
    train_all_models()
