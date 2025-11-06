"""
Data Generator for Sanity Orb ML Model
Generates synthetic training data for XGBoost models
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

class SanityDataGenerator:
    def __init__(self, num_samples=5000):
        self.num_samples = num_samples
        np.random.seed(42)
        
    def generate_session_data(self):
        """Generate realistic sanity session data"""
        data = []
        
        for i in range(self.num_samples):
            # Time-based features
            timestamp = datetime.now() - timedelta(days=np.random.randint(0, 365))
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Session features
            session_duration = np.random.exponential(15) + 5  # minutes
            interactions = np.random.poisson(10)
            
            # Previous sanity levels (simulating history)
            prev_sanity_1 = np.random.normal(50, 20)
            prev_sanity_2 = np.random.normal(50, 20)
            prev_sanity_3 = np.random.normal(50, 20)
            
            # Calculate average of previous sessions
            avg_prev_sanity = (prev_sanity_1 + prev_sanity_2 + prev_sanity_3) / 3
            
            # Environmental factors
            stress_level = np.random.uniform(0, 100)
            mood_factor = np.random.uniform(-20, 20)
            
            # Calculate current sanity with realistic patterns
            base_sanity = avg_prev_sanity * 0.6 + 40 * 0.4
            
            # Time-based adjustments
            if hour >= 22 or hour <= 6:
                base_sanity -= 10  # Late night reduction
            if day_of_week >= 5:
                base_sanity += 5  # Weekend boost
                
            # Stress impact
            base_sanity -= stress_level * 0.2
            
            # Mood impact
            base_sanity += mood_factor
            
            # Session quality impact
            if session_duration > 20:
                base_sanity += 5
            if interactions > 15:
                base_sanity += 3
                
            # Add noise
            current_sanity = base_sanity + np.random.normal(0, 5)
            
            # Clip to valid range
            current_sanity = np.clip(current_sanity, 0, 100)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'hour': hour,
                'day_of_week': day_of_week,
                'session_duration': session_duration,
                'interactions': interactions,
                'prev_sanity_1': prev_sanity_1,
                'prev_sanity_2': prev_sanity_2,
                'prev_sanity_3': prev_sanity_3,
                'avg_prev_sanity': avg_prev_sanity,
                'stress_level': stress_level,
                'mood_factor': mood_factor,
                'current_sanity': current_sanity
            })
            
        return pd.DataFrame(data)
    
    def generate_trend_data(self):
        """Generate data for trend prediction"""
        data = []
        
        for i in range(self.num_samples):
            # Time series features
            time_index = np.arange(10)
            
            # Generate a sequence with trend
            trend = np.random.choice(['increasing', 'decreasing', 'stable'])
            
            if trend == 'increasing':
                slope = np.random.uniform(0.5, 3)
                base_values = 40 + time_index * slope
            elif trend == 'decreasing':
                slope = np.random.uniform(-3, -0.5)
                base_values = 60 + time_index * slope
            else:
                slope = np.random.uniform(-0.5, 0.5)
                base_values = 50 + time_index * slope
            
            # Add noise
            sequence = base_values + np.random.normal(0, 3, 10)
            sequence = np.clip(sequence, 0, 100)
            
            # Calculate features
            mean_val = np.mean(sequence)
            std_val = np.std(sequence)
            min_val = np.min(sequence)
            max_val = np.max(sequence)
            range_val = max_val - min_val
            
            # Calculate actual slope with linear regression
            x = np.arange(len(sequence))
            actual_slope = np.polyfit(x, sequence, 1)[0]
            
            # Predict next value
            next_value = sequence[-1] + actual_slope
            next_value = np.clip(next_value, 0, 100)
            
            # Trend confidence based on std deviation
            confidence = 100 - (std_val * 2)
            confidence = np.clip(confidence, 50, 98)
            
            data.append({
                'mean': mean_val,
                'std': std_val,
                'min': min_val,
                'max': max_val,
                'range': range_val,
                'slope': actual_slope,
                'last_3_avg': np.mean(sequence[-3:]),
                'first_3_avg': np.mean(sequence[:3]),
                'volatility': np.std(np.diff(sequence)),
                'next_value': next_value,
                'confidence': confidence
            })
            
        return pd.DataFrame(data)
    
    def generate_classification_data(self):
        """Generate data for sanity level classification"""
        data = []
        
        for i in range(self.num_samples):
            # Features
            current_sanity = np.random.uniform(0, 100)
            session_count = np.random.poisson(50)
            avg_duration = np.random.exponential(15) + 5
            interaction_rate = np.random.uniform(0, 2)
            consistency = np.random.uniform(0, 100)
            
            # Determine category
            if current_sanity < 25:
                category = 0  # Critical
            elif current_sanity < 50:
                category = 1  # Unstable
            elif current_sanity < 75:
                category = 2  # Stable
            else:
                category = 3  # Optimal
                
            data.append({
                'current_sanity': current_sanity,
                'session_count': session_count,
                'avg_duration': avg_duration,
                'interaction_rate': interaction_rate,
                'consistency': consistency,
                'category': category
            })
            
        return pd.DataFrame(data)
    
    def save_all_datasets(self):
        """Generate and save all datasets"""
        print("Generating session prediction data...")
        session_df = self.generate_session_data()
        session_df.to_csv('ml-model/data/session_data.csv', index=False)
        print(f"✓ Saved {len(session_df)} session records")
        
        print("\nGenerating trend prediction data...")
        trend_df = self.generate_trend_data()
        trend_df.to_csv('ml-model/data/trend_data.csv', index=False)
        print(f"✓ Saved {len(trend_df)} trend records")
        
        print("\nGenerating classification data...")
        classification_df = self.generate_classification_data()
        classification_df.to_csv('ml-model/data/classification_data.csv', index=False)
        print(f"✓ Saved {len(classification_df)} classification records")
        
        # Generate summary statistics
        stats = {
            'generation_date': datetime.now().isoformat(),
            'total_samples': self.num_samples,
            'session_data': {
                'samples': len(session_df),
                'features': list(session_df.columns),
                'sanity_range': [float(session_df['current_sanity'].min()), 
                                float(session_df['current_sanity'].max())],
                'avg_sanity': float(session_df['current_sanity'].mean())
            },
            'trend_data': {
                'samples': len(trend_df),
                'features': list(trend_df.columns),
                'avg_confidence': float(trend_df['confidence'].mean())
            },
            'classification_data': {
                'samples': len(classification_df),
                'features': list(classification_df.columns),
                'category_distribution': classification_df['category'].value_counts().to_dict()
            }
        }
        
        with open('ml-model/data/data_stats.json', 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n✓ Data generation complete!")
        print(f"✓ Summary saved to data_stats.json")
        
        return session_df, trend_df, classification_df

if __name__ == '__main__':
    # Create data directory
    import os
    os.makedirs('ml-model/data', exist_ok=True)
    
    # Generate data
    generator = SanityDataGenerator(num_samples=5000)
    generator.save_all_datasets()
