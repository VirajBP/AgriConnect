const express = require('express');
const router = express.Router();
const axios = require('axios');

// ML service URL
const ML_SERVICE_URL = 'http://localhost:8000';

// Default soil parameters based on moderate conditions
const getDefaultSoilParams = (weather = null) => {
    // Base parameters
    const params = {
        N: 90,  // Nitrogen content
        P: 42,  // Phosphorus content
        K: 43,  // Potassium content
        temperature: 25,
        humidity: 80,
        ph: 6.5,
        rainfall: 200
    };

    // Adjust based on weather if available
    if (weather) {
        params.temperature = weather.temperature;
        params.humidity = weather.humidity;
        params.rainfall = weather.rainfall * 100; // Convert mm to cm
    }

    return params;
};

// Get season based on month and hemisphere
const getSeason = (month, latitude) => {
    const isNorthernHemisphere = latitude >= 0;
    
    if (isNorthernHemisphere) {
        if (month >= 3 && month <= 5) return 'Spring';
        if (month >= 6 && month <= 8) return 'Summer';
        if (month >= 9 && month <= 11) return 'Fall';
        return 'Winter';
    } else {
        if (month >= 3 && month <= 5) return 'Fall';
        if (month >= 6 && month <= 8) return 'Winter';
        if (month >= 9 && month <= 11) return 'Spring';
        return 'Summer';
    }
};

// Get climate zone based on temperature
const getClimate = (temperature) => {
    if (temperature >= 30) return 'hot';
    if (temperature <= 15) return 'cool';
    return 'moderate';
};

router.post('/', async (req, res) => {
    try {
        console.log('Received chatbot request:', req.body);
        const { message, location, weather } = req.body;

        if (!message) {
            return res.status(400).json({
                message: 'Message is required'
            });
        }

        // Get current season and climate if location is available
        let seasonContext = '';
        if (location) {
            const currentMonth = new Date().getMonth() + 1;
            const season = getSeason(currentMonth, location.latitude);
            const climate = weather ? getClimate(weather.temperature) : 'moderate';
            seasonContext = `Based on your location near ${location.name}, it's currently ${season} with ${climate} conditions. `;
        }

        // First try to get a response from the chat endpoint
        try {
            const chatResponse = await axios.post(`${ML_SERVICE_URL}/chat`, {
                message: message,
                location: location,
                weather: weather
            });

            console.log('Received chat response:', chatResponse.data);

            // If we got a valid chat response that's not a fallback, return it with context
            if (chatResponse.data.message && 
                !chatResponse.data.message.includes("I'm sorry") && 
                !chatResponse.data.message.includes("Would you like to know about crop recommendations")) {
                return res.json({
                    message: seasonContext + chatResponse.data.message
                });
            }
        } catch (chatError) {
            console.log('Chat endpoint error (trying prediction next):', chatError.message);
        }

        // If chat fails or returns a fallback message, try prediction
        console.log('Trying prediction endpoint...');
        
        // Prepare prediction parameters with weather data
        const predictionParams = getDefaultSoilParams(weather);

        console.log('Sending request to ML prediction service:', predictionParams);

        // Get crop predictions from ML service
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, predictionParams, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Received ML prediction response:', mlResponse.data);

        // Format the response with location context
        const response = {
            message: seasonContext + mlResponse.data.message,
            recommendations: mlResponse.data.recommendations
        };

        res.json(response);
    } catch (error) {
        console.error('Detailed chatbot error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        // Send a more detailed error response
        res.status(500).json({ 
            message: 'An error occurred while processing your request.',
            error: error.response?.data?.detail || error.message,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                response: error.response?.data
            } : undefined
        });
    }
});

module.exports = router;
