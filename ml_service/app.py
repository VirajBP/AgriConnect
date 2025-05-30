from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import json
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import logging
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from typing import Optional, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
nltk.download('punkt')
nltk.download('wordnet')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Location(BaseModel):
    latitude: float
    longitude: float
    name: str

class Weather(BaseModel):
    temperature: float
    humidity: float
    description: str
    rainfall: float

class PredictionRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class ChatRequest(BaseModel):
    message: str
    location: Optional[Location] = None
    weather: Optional[Weather] = None

try:
    logger.info("Loading ML model and data...")
    model = joblib.load("data/crop_model.joblib")
    scaler = joblib.load("data/scaler.joblib")
    
    with open("data/feature_ranges.json", "r") as f:
        feature_ranges = json.load(f)
        
    with open('data/agricultural_qa.json', 'r') as f:
        qa_data = json.load(f)
        
    logger.info("ML model and data loaded successfully")
except Exception as e:
    logger.error(f"Error loading model or data: {str(e)}")
    raise

def validate_input(data: dict):
    logger.info(f"Validating input: {data}")
    for feature, value in data.items():
        if feature in feature_ranges:
            min_val = feature_ranges[feature]['min']
            max_val = feature_ranges[feature]['max']
            if value < min_val or value > max_val:
                error_msg = f"{feature} value {value} is outside the valid range [{min_val}, {max_val}]"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
    logger.info("Input validation successful")

def get_climate_advice(weather: Weather) -> str:
    """Get climate-specific farming advice based on weather conditions"""
    advice = []
    
    # Temperature-based advice
    if weather.temperature > 30:
        advice.append("Due to high temperatures, ensure adequate irrigation and consider shade protection for sensitive crops.")
    elif weather.temperature < 15:
        advice.append("With cooler temperatures, protect crops from frost and consider using row covers.")
    
    # Humidity-based advice
    if weather.humidity > 80:
        advice.append("High humidity may increase disease risk. Ensure good air circulation and monitor for fungal diseases.")
    elif weather.humidity < 40:
        advice.append("Low humidity may stress plants. Consider mulching and regular watering.")
    
    # Rainfall-based advice
    if weather.rainfall > 10:
        advice.append("Recent rainfall is good but monitor drainage to prevent waterlogging.")
    elif weather.rainfall < 1:
        advice.append("Low rainfall means irrigation will be crucial. Consider drip irrigation for water efficiency.")
    
    return " ".join(advice) if advice else ""

def get_qa_response(message: str, location: Optional[Location] = None, weather: Optional[Weather] = None) -> str:
    # Convert message to lowercase and tokenize
    tokens = word_tokenize(message.lower())
    
    # Initialize lemmatizer
    lemmatizer = WordNetLemmatizer()
    
    # Lemmatize tokens
    lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
    message_processed = ' '.join(lemmatized)
    
    # Search through QA data for best match
    best_match_score = 0
    best_response = None
    
    for qa in qa_data['qa_pairs']:
        # Calculate match score based on keyword presence
        match_score = sum(1 for keyword in qa['keywords'] if keyword in message_processed)
        
        if match_score > best_match_score:
            best_match_score = match_score
            best_response = qa['answer']
            
            # Add location-specific advice if available
            if weather and ('irrigation' in qa['keywords'] or 'water' in qa['keywords']):
                climate_advice = get_climate_advice(weather)
                if climate_advice:
                    best_response += f"\n\nSpecific to your current conditions: {climate_advice}"
    
    # If no good match found, use a random fallback response
    if best_match_score == 0:
        import random
        best_response = random.choice(qa_data['fallback_responses'])
    
    return best_response

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request}")
        response = get_qa_response(request.message, request.location, request.weather)
        logger.info(f"Sending response: {response}")
        return {"message": response}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict_crop(request: PredictionRequest):
    try:
        logger.info(f"Received prediction request: {request}")
        
        # Convert input to dictionary
        input_data = request.dict()
        
        # Validate input
        validate_input(input_data)
        
        # Prepare input for prediction
        features = np.array([[
            input_data['N'],
            input_data['P'],
            input_data['K'],
            input_data['temperature'],
            input_data['humidity'],
            input_data['ph'],
            input_data['rainfall']
        ]])
        
        logger.info(f"Prepared features for prediction: {features}")
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)
        probabilities = model.predict_proba(features_scaled)
        
        # Get top 3 predictions with probabilities
        top_3_idx = np.argsort(probabilities[0])[-3:][::-1]
        recommendations = [
            {
                "crop": model.classes_[idx],
                "confidence": float(probabilities[0][idx])
            }
            for idx in top_3_idx
        ]
        
        response = {
            "success": True,
            "recommendations": recommendations,
            "message": f"Based on the soil and weather conditions, I recommend growing {recommendations[0]['crop']} (confidence: {recommendations[0]['confidence']:.2%}). Alternative options include {recommendations[1]['crop']} ({recommendations[1]['confidence']:.2%}) and {recommendations[2]['crop']} ({recommendations[2]['confidence']:.2%})."
        }
        
        logger.info(f"Sending response: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Error in predict_crop: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
