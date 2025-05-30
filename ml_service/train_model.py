import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import json

# Load and preprocess the data
def prepare_data():
    # Load the dataset
    df = pd.read_csv('data/crop_recommendation.csv')
    
    # Separate features and target
    X = df.drop('label', axis=1)
    y = df['label']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler

def train_model():
    # Prepare the data
    X_train_scaled, X_test_scaled, y_train, y_test, scaler = prepare_data()
    
    # Train the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Save the model and scaler
    joblib.dump(model, 'data/crop_model.joblib')
    joblib.dump(scaler, 'data/scaler.joblib')
    
    # Calculate and print accuracy
    train_accuracy = model.score(X_train_scaled, y_train)
    test_accuracy = model.score(X_test_scaled, y_test)
    
    print(f"Training Accuracy: {train_accuracy:.4f}")
    print(f"Testing Accuracy: {test_accuracy:.4f}")
    
    # Create and save feature ranges for validation
    df = pd.read_csv('data/crop_recommendation.csv')
    feature_ranges = {
        'N': {'min': float(df['N'].min()), 'max': float(df['N'].max())},
        'P': {'min': float(df['P'].min()), 'max': float(df['P'].max())},
        'K': {'min': float(df['K'].min()), 'max': float(df['K'].max())},
        'temperature': {'min': float(df['temperature'].min()), 'max': float(df['temperature'].max())},
        'humidity': {'min': float(df['humidity'].min()), 'max': float(df['humidity'].max())},
        'ph': {'min': float(df['ph'].min()), 'max': float(df['ph'].max())},
        'rainfall': {'min': float(df['rainfall'].min()), 'max': float(df['rainfall'].max())}
    }
    
    with open('data/feature_ranges.json', 'w') as f:
        json.dump(feature_ranges, f, indent=4)
    
    print("Model, scaler, and feature ranges saved successfully!")

if __name__ == "__main__":
    train_model()
