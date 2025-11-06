"""
Complete Setup and Training Script
Runs the entire ML pipeline: data generation and model training
"""

import os
import sys
import subprocess

def run_command(description, command):
    """Run a command and display progress"""
    print("\n" + "="*70)
    print(f">>> {description}")
    print("="*70)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=False)
        print(f"✓ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during: {description}")
        print(f"   Error: {e}")
        return False

def main():
    """Main setup function"""
    print("\n" + "="*70)
    print("SANITY ORB - ML MODEL SETUP AND TRAINING")
    print("="*70)
    print("\nThis script will:")
    print("  1. Create necessary directories")
    print("  2. Generate synthetic training data (5000 samples)")
    print("  3. Train 3 XGBoost models")
    print("  4. Save all models and metadata")
    print("\n" + "="*70)
    
    input("\nPress Enter to continue...")
    
    # Create directories
    print("\n>>> Creating directories...")
    os.makedirs('ml-model/data', exist_ok=True)
    os.makedirs('ml-model/trained_models', exist_ok=True)
    print("✓ Directories created")
    
    # Generate data
    if not run_command("Generating Training Data", "python ml-model/data_generator.py"):
        print("\n❌ Setup failed at data generation step")
        return False
    
    # Train models
    if not run_command("Training XGBoost Models", "python ml-model/xgboost_models.py"):
        print("\n❌ Setup failed at model training step")
        return False
    
    # Success
    print("\n" + "="*70)
    print("✓✓✓ SETUP COMPLETE! ✓✓✓")
    print("="*70)
    print("\nAll models trained successfully!")
    print("\nGenerated files:")
    print("  • ml-model/data/session_data.csv")
    print("  • ml-model/data/trend_data.csv")
    print("  • ml-model/data/classification_data.csv")
    print("  • ml-model/trained_models/session_predictor.json")
    print("  • ml-model/trained_models/trend_value_predictor.json")
    print("  • ml-model/trained_models/trend_confidence_predictor.json")
    print("  • ml-model/trained_models/sanity_classifier.json")
    print("\nNext steps:")
    print("  1. Run the ML API server: python ml-model/ml_api.py")
    print("  2. Start your main application")
    print("  3. Use the analytics panel to see AI predictions!")
    print("\n" + "="*70 + "\n")
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
