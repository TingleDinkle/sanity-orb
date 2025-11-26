"""
Flask API Server for XGBoost ML Models
Provides REST endpoints for sanity predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import xgboost as xgb
import numpy as np
import pandas as pd
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global models
models = {
    'session': None,
    'trend_value': None,
    'trend_confidence': None,
    'classifier': None
}

def load_models():
    """Load all trained XGBoost models"""
    import os
    # Handle both running from root and from ml-model directory
    if os.path.exists('ml-model/trained_models'):
        models_dir = 'ml-model/trained_models'
    else:
        models_dir = 'trained_models'
    
    try:
        # Load session predictor
        session_path = os.path.join(models_dir, 'session_predictor.json')
        if os.path.exists(session_path):
            models['session'] = xgb.XGBRegressor()
            models['session'].load_model(session_path)
            print("✓ Session predictor loaded")
        
        # Load trend predictors
        value_path = os.path.join(models_dir, 'trend_value_predictor.json')
        conf_path = os.path.join(models_dir, 'trend_confidence_predictor.json')
        if os.path.exists(value_path) and os.path.exists(conf_path):
            models['trend_value'] = xgb.XGBRegressor()
            models['trend_value'].load_model(value_path)
            models['trend_confidence'] = xgb.XGBRegressor()
            models['trend_confidence'].load_model(conf_path)
            print("✓ Trend predictors loaded")
        
        # Load classifier
        classifier_path = os.path.join(models_dir, 'sanity_classifier.json')
        if os.path.exists(classifier_path):
            models['classifier'] = xgb.XGBClassifier()
            models['classifier'].load_model(classifier_path)
            print("✓ Sanity classifier loaded")
        
        print("\n✓ All ML models loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    models_loaded = all(model is not None for model in models.values())
    return jsonify({
        'status': 'healthy' if models_loaded else 'degraded',
        'models_loaded': models_loaded,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict/session', methods=['POST'])
def predict_session():
    """
    Predict next sanity level based on session data
    
    Expected input:
    {
        "hour": 14,
        "day_of_week": 3,
        "session_duration": 15.5,
        "interactions": 12,
        "prev_sanity_1": 65.0,
        "prev_sanity_2": 70.0,
        "prev_sanity_3": 68.0,
        "stress_level": 45.0,
        "mood_factor": 5.0
    }
    """
    try:
        data = request.json
        
        # --- Input Validation ---
        required_keys = [
            "hour", "day_of_week", "session_duration", "interactions",
            "prev_sanity_1", "prev_sanity_2", "prev_sanity_3",
            "stress_level", "mood_factor"
        ]
        if not data or any(key not in data for key in required_keys):
            missing = [key for key in required_keys if key not in (data or {})]
            return jsonify({'success': False, 'error': f'Missing required keys: {missing}'}), 400
        
        if not all(isinstance(data[key], (int, float)) for key in required_keys):
            return jsonify({'success': False, 'error': 'All input values must be numeric'}), 400
        # --- End Validation ---
        
        # Calculate avg_prev_sanity
        avg_prev_sanity = (
            data['prev_sanity_1'] + 
            data['prev_sanity_2'] + 
            data['prev_sanity_3']
        ) / 3
        
        # Prepare features
        features = pd.DataFrame([{
            'hour': data['hour'],
            'day_of_week': data['day_of_week'],
            'session_duration': data['session_duration'],
            'interactions': data['interactions'],
            'prev_sanity_1': data['prev_sanity_1'],
            'prev_sanity_2': data['prev_sanity_2'],
            'prev_sanity_3': data['prev_sanity_3'],
            'avg_prev_sanity': avg_prev_sanity,
            'stress_level': data['stress_level'],
            'mood_factor': data['mood_factor']
        }])
        
        # Predict
        prediction = models['session'].predict(features)[0]
        prediction = float(np.clip(prediction, 0, 100))
        
        # TODO: Implement a proper confidence model. 
        # The previous random calculation was misleading.
        confidence = -1.0
        
        return jsonify({
            'success': True,
            'prediction': round(prediction, 2),
            'confidence': confidence,
            'model': 'XGBoost Regressor',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/predict/trend', methods=['POST'])
def predict_trend():
    """
    Predict future trend based on historical data
    
    Expected input:
    {
        "history": [45.0, 47.0, 50.0, 48.0, 52.0, 55.0, 53.0, 56.0, 58.0, 60.0]
    }
    """
    try:
        data = request.json
        
        # --- Input Validation ---
        if not data or 'history' not in data:
            return jsonify({'success': False, 'error': 'Missing "history" in request body'}), 400
        
        history = data['history']
        
        if not isinstance(history, list) or len(history) < 5:
            return jsonify({
                'success': False,
                'error': '"history" must be a list of at least 5 numbers'
            }), 400
        # --- End Validation ---

        history = np.array(history)
        
        # Calculate features
        mean_val = np.mean(history)
        std_val = np.std(history)
        min_val = np.min(history)
        max_val = np.max(history)
        range_val = max_val - min_val
        
        # Calculate slope
        x = np.arange(len(history))
        slope = np.polyfit(x, history, 1)[0]
        
        last_3_avg = np.mean(history[-3:])
        first_3_avg = np.mean(history[:3])
        volatility = np.std(np.diff(history))
        
        features = pd.DataFrame([{
            'mean': mean_val,
            'std': std_val,
            'min': min_val,
            'max': max_val,
            'range': range_val,
            'slope': slope,
            'last_3_avg': last_3_avg,
            'first_3_avg': first_3_avg,
            'volatility': volatility
        }])
        
        # Predict
        next_value = models['trend_value'].predict(features)[0]
        confidence = models['trend_confidence'].predict(features)[0]
        
        next_value = float(np.clip(next_value, 0, 100))
        confidence = float(np.clip(confidence, 50, 98))
        
        # Determine trend
        if slope > 0.5:
            trend = 'improving'
        elif slope < -0.5:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return jsonify({
            'success': True,
            'next_value': round(next_value, 2),
            'confidence': round(confidence, 2),
            'trend': trend,
            'slope': round(float(slope), 4),
            'volatility': round(float(volatility), 2),
            'model': 'XGBoost Regressor',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/predict/classify', methods=['POST'])
def classify_sanity():
    """
    Classify sanity level category
    
    Expected input:
    {
        "current_sanity": 65.0,
        "session_count": 45,
        "avg_duration": 18.5,
        "interaction_rate": 1.2,
        "consistency": 75.0
    }
    """
    try:
        data = request.json

        # --- Input Validation ---
        required_keys = [
            "current_sanity", "session_count", "avg_duration", 
            "interaction_rate", "consistency"
        ]
        if not data or any(key not in data for key in required_keys):
            missing = [key for key in required_keys if key not in (data or {})]
            return jsonify({'success': False, 'error': f'Missing required keys: {missing}'}), 400

        if not all(isinstance(data[key], (int, float)) for key in required_keys):
            return jsonify({'success': False, 'error': 'All input values must be numeric'}), 400
        # --- End Validation ---
        
        features = pd.DataFrame([{
            'current_sanity': data['current_sanity'],
            'session_count': data['session_count'],
            'avg_duration': data['avg_duration'],
            'interaction_rate': data['interaction_rate'],
            'consistency': data['consistency']
        }])
        
        # Predict
        category_id = models['classifier'].predict(features)[0]
        probabilities = models['classifier'].predict_proba(features)[0]
        
        categories = ['Critical', 'Unstable', 'Stable', 'Optimal']
        category_name = categories[int(category_id)]
        
        # Get probability distribution
        category_probs = {
            categories[i]: round(float(prob) * 100, 2)
            for i, prob in enumerate(probabilities)
        }
        
        return jsonify({
            'success': True,
            'category': category_name,
            'category_id': int(category_id),
            'probabilities': category_probs,
            'confidence': round(float(max(probabilities)) * 100, 2),
            'model': 'XGBoost Classifier',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/predict/advanced', methods=['POST'])
def advanced_prediction():
    """
    Advanced prediction combining all models
    
    Expected input:
    {
        "current_sanity": 65.0,
        "history": [60.0, 62.0, 64.0, 63.0, 65.0],
        "session_data": {
            "hour": 14,
            "day_of_week": 3,
            "session_duration": 15.5,
            "interactions": 12,
            "stress_level": 45.0,
            "mood_factor": 5.0
        },
        "user_stats": {
            "session_count": 45,
            "avg_duration": 18.5,
            "interaction_rate": 1.2,
            "consistency": 75.0
        }
    }
    """
    try:
        data = request.json
        
        # --- Input Validation ---
        if not data:
            return jsonify({'success': False, 'error': 'Request body cannot be empty'}), 400

        if 'current_sanity' not in data or not isinstance(data['current_sanity'], (int, float)):
             return jsonify({'success': False, 'error': 'Missing or invalid "current_sanity"'}), 400

        if 'history' not in data or not isinstance(data['history'], list):
             return jsonify({'success': False, 'error': 'Missing or invalid "history"'}), 400
        
        if 'session_data' not in data or not isinstance(data['session_data'], dict):
             return jsonify({'success': False, 'error': 'Missing or invalid "session_data"'}), 400

        if 'user_stats' not in data or not isinstance(data['user_stats'], dict):
             return jsonify({'success': False, 'error': 'Missing or invalid "user_stats"'}), 400
        # --- End Validation ---

        # Get predictions from all models
        results = {}
        
        # Session prediction
        if 'session_data' in data and len(data['history']) >= 3:
            session_data = data['session_data']
            session_data['prev_sanity_1'] = data['history'][-1]
            session_data['prev_sanity_2'] = data['history'][-2]
            session_data['prev_sanity_3'] = data['history'][-3]
            
            avg_prev = (
                session_data['prev_sanity_1'] +
                session_data['prev_sanity_2'] +
                session_data['prev_sanity_3']
            ) / 3
            
            session_features = pd.DataFrame([{
                'hour': session_data['hour'],
                'day_of_week': session_data['day_of_week'],
                'session_duration': session_data['session_duration'],
                'interactions': session_data['interactions'],
                'prev_sanity_1': session_data['prev_sanity_1'],
                'prev_sanity_2': session_data['prev_sanity_2'],
                'prev_sanity_3': session_data['prev_sanity_3'],
                'avg_prev_sanity': avg_prev,
                'stress_level': session_data['stress_level'],
                'mood_factor': session_data['mood_factor']
            }])
            
            session_pred = models['session'].predict(session_features)[0]
            results['session_prediction'] = float(np.clip(session_pred, 0, 100))
        
        # Trend prediction
        if 'history' in data and len(data['history']) >= 5:
            history = np.array(data['history'])
            mean_val = np.mean(history)
            std_val = np.std(history)
            x = np.arange(len(history))
            slope = np.polyfit(x, history, 1)[0]
            
            trend_features = pd.DataFrame([{
                'mean': mean_val,
                'std': std_val,
                'min': np.min(history),
                'max': np.max(history),
                'range': np.max(history) - np.min(history),
                'slope': slope,
                'last_3_avg': np.mean(history[-3:]),
                'first_3_avg': np.mean(history[:3]),
                'volatility': np.std(np.diff(history))
            }])
            
            trend_value = models['trend_value'].predict(trend_features)[0]
            trend_conf = models['trend_confidence'].predict(trend_features)[0]
            
            results['trend_prediction'] = {
                'next_value': float(np.clip(trend_value, 0, 100)),
                'confidence': float(np.clip(trend_conf, 50, 98)),
                'trend': 'improving' if slope > 0.5 else 'declining' if slope < -0.5 else 'stable',
                'slope': float(slope)
            }
        
        # Classification
        if 'user_stats' in data:
            stats = data['user_stats']
            class_features = pd.DataFrame([{
                'current_sanity': data['current_sanity'],
                'session_count': stats['session_count'],
                'avg_duration': stats['avg_duration'],
                'interaction_rate': stats['interaction_rate'],
                'consistency': stats['consistency']
            }])
            
            category_id = models['classifier'].predict(class_features)[0]
            probabilities = models['classifier'].predict_proba(class_features)[0]
            
            categories = ['Critical', 'Unstable', 'Stable', 'Optimal']
            
            results['classification'] = {
                'category': categories[int(category_id)],
                'confidence': float(max(probabilities)) * 100
            }
        
        # Generate recommendations
        recommendations = generate_recommendations(results, data)
        
        return jsonify({
            'success': True,
            'results': results,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def generate_recommendations(results, data):
    """Generate AI recommendations based on predictions"""
    recommendations = []
    
    if 'trend_prediction' in results:
        trend = results['trend_prediction']['trend']
        if trend == 'declining':
            recommendations.append({
                'type': 'warning',
                'message': '⚠️ Declining trend detected - Consider taking a break',
                'priority': 'high'
            })
        elif trend == 'improving':
            recommendations.append({
                'type': 'success',
                'message': '✅ Great! Your sanity levels are improving',
                'priority': 'low'
            })
    
    if 'classification' in results:
        category = results['classification']['category']
        if category == 'Critical':
            recommendations.append({
                'type': 'alert',
                'message': '🚨 Critical level - Immediate action recommended',
                'priority': 'critical'
            })
        elif category == 'Optimal':
            recommendations.append({
                'type': 'info',
                'message': '🎯 Optimal level - Keep up the good work!',
                'priority': 'low'
            })
    
    if data.get('current_sanity', 50) < 30:
        recommendations.append({
            'type': 'action',
            'message': '💡 Reset to optimal levels recommended',
            'priority': 'high'
        })
    
    return recommendations

@app.route('/api/models/info', methods=['GET'])
def models_info():
    """Get information about loaded models"""
    try:
        info = {}
        
        # Load metadata files
        models_dir = 'trained_models'
        metadata_files = [
            'session_predictor_metadata.json',
            'trend_predictor_metadata.json',
            'sanity_classifier_metadata.json',
            'training_summary.json'
        ]
        
        for filename in metadata_files:
            filepath = os.path.join(models_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    key = filename.replace('_metadata.json', '').replace('.json', '')
                    info[key] = json.load(f)
        
        return jsonify({
            'success': True,
            'info': info,
            'models_loaded': {
                'session': models['session'] is not None,
                'trend_value': models['trend_value'] is not None,
                'trend_confidence': models['trend_confidence'] is not None,
                'classifier': models['classifier'] is not None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    print("\n" + "="*70)
    print("SANITY ORB - ML API SERVER")
    print("="*70)
    print("\nLoading XGBoost models...")
    
    if load_models():
        print("\n✓ Server ready!")
        print("  API endpoint: http://localhost:5001")
        print("\nAvailable endpoints:")
        print("  • POST /api/predict/session")
        print("  • POST /api/predict/trend")
        print("  • POST /api/predict/classify")
        print("  • POST /api/predict/advanced")
        print("  • GET  /api/models/info")
        print("  • GET  /api/health")
        print("\n" + "="*70 + "\n")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("\n❌ Failed to load models. Please train models first.")
        print("   Run: python data_generator.py")
        print("   Then: python xgboost_models.py")
