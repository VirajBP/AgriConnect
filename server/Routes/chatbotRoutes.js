const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../Middleware/auth');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');

// ML service URL
const ML_SERVICE_URL = 'http://localhost:8000';

// Default soil parameters based on moderate conditions
const getDefaultSoilParams = (weather = null) => {
  // Base parameters
  const params = {
    N: 90, // Nitrogen content
    P: 42, // Phosphorus content
    K: 43, // Potassium content
    temperature: 25,
    humidity: 80,
    ph: 6.5,
    rainfall: 200,
  };

  // Adjust based on weather if available
  if (weather) {
    params.temperature = weather.temperature;
    params.humidity = weather.humidity;
    params.rainfall = weather.rainfall * 100; // Convert mm to cm
  }

  return params;
};

// Get Indian season based on month
const getIndianSeason = month => {
  if (month >= 6 && month <= 9) return 'Kharif'; // Monsoon season
  if (month >= 10 && month <= 3) return 'Rabi'; // Winter season
  return 'Zaid'; // Summer season (April-May)
};

// Get crop recommendations based on Indian agricultural patterns
const getIndianCropRecommendations = (
  month,
  temperature,
  rainfall,
  humidity,
  location
) => {
  const season = getIndianSeason(month);
  const isNorthIndia = location && location.latitude > 23.5; // Above Tropic of Cancer

  let crops = [];
  let seasonInfo = '';

  if (season === 'Kharif') {
    seasonInfo = 'Kharif season (June-September) - Monsoon crops';
    if (temperature > 28 && rainfall > 100) {
      crops = [
        'Rice',
        'Cotton',
        'Sugarcane',
        'Maize',
        'Jowar',
        'Bajra',
        'Tur (Arhar)',
        'Moong',
        'Urad',
        'Groundnut',
      ];
    } else if (temperature > 25) {
      crops = [
        'Maize',
        'Jowar',
        'Bajra',
        'Cotton',
        'Tur (Arhar)',
        'Moong',
        'Sesame',
      ];
    } else {
      crops = ['Maize', 'Jowar', 'Moong', 'Urad', 'Vegetables (Okra, Brinjal)'];
    }
  } else if (season === 'Rabi') {
    seasonInfo = 'Rabi season (October-March) - Winter crops';
    if (isNorthIndia) {
      crops = [
        'Wheat',
        'Barley',
        'Gram (Chana)',
        'Peas',
        'Lentil (Masoor)',
        'Mustard',
        'Potato',
        'Onion',
      ];
    } else {
      crops = [
        'Wheat',
        'Jowar',
        'Bajra',
        'Gram (Chana)',
        'Sunflower',
        'Coriander',
        'Cumin',
        'Fenugreek',
      ];
    }
    if (temperature < 20) {
      crops.push('Cabbage', 'Cauliflower', 'Carrot', 'Radish');
    }
  } else {
    // Zaid
    seasonInfo = 'Zaid season (April-May) - Summer crops';
    if (temperature > 35) {
      crops = [
        'Watermelon',
        'Muskmelon',
        'Cucumber',
        'Fodder crops (Jowar, Maize)',
      ];
    } else {
      crops = [
        'Maize',
        'Jowar',
        'Bajra',
        'Moong',
        'Urad',
        'Sunflower',
        'Sesame',
      ];
    }
    if (rainfall > 50) {
      crops.push('Rice (with irrigation)', 'Sugarcane');
    }
  }

  return { crops, seasonInfo };
};

// Get generic climate data based on month and Indian region
const getGenericClimateData = (month, state) => {
  // Default values for India
  let temperature = 25;
  let rainfall = 50;
  let humidity = 65;

  // Seasonal adjustments
  if (month >= 6 && month <= 9) {
    // Monsoon
    temperature = 28;
    rainfall = 150;
    humidity = 85;
  } else if (month >= 10 && month <= 2) {
    // Winter
    temperature = 20;
    rainfall = 20;
    humidity = 60;
  } else {
    // Summer
    temperature = 35;
    rainfall = 10;
    humidity = 45;
  }

  // Regional adjustments for major states
  if (state) {
    const stateLower = state.toLowerCase();
    if (stateLower.includes('rajasthan') || stateLower.includes('gujarat')) {
      temperature += 3; // Hotter
      rainfall -= 20; // Less rain
    } else if (
      stateLower.includes('kerala') ||
      stateLower.includes('karnataka')
    ) {
      temperature -= 2; // Cooler
      rainfall += 30; // More rain
      humidity += 10;
    } else if (
      stateLower.includes('punjab') ||
      stateLower.includes('haryana')
    ) {
      if (month >= 11 && month <= 2) temperature -= 5; // Colder winters
    }
  }

  return { temperature, rainfall, humidity };
};

// Rule-based responses for common farming questions
const getRuleBasedResponse = (message, location, weather) => {
  const msg = message.toLowerCase();

  // Season and climate context
  let seasonContext = '';
  if (location) {
    const currentMonth = new Date().getMonth() + 1;
    const season = getSeason(currentMonth, location.latitude);
    const climate = weather ? getClimate(weather.temperature) : 'moderate';
    seasonContext = `Based on your location near ${location.name}, it's currently ${season} with ${climate} conditions. `;
  }

  // Crop recommendations
  if (
    msg.includes('crop') ||
    msg.includes('grow') ||
    msg.includes('plant') ||
    msg.includes('season')
  ) {
    const currentMonth = new Date().getMonth() + 1;
    const temp = weather ? weather.temperature : 25;
    const rainfall = weather ? weather.rainfall : 100;
    const humidity = weather ? weather.humidity : 70;

    const { crops, seasonInfo } = getIndianCropRecommendations(
      currentMonth,
      temp,
      rainfall,
      humidity,
      location
    );

    let response = seasonContext + `${seasonInfo}. `;
    response += `Based on current conditions (${temp}°C, ${rainfall}mm rainfall, ${humidity}% humidity), I recommend: `;
    response += `${crops.slice(0, 5).join(', ')}`;

    if (crops.length > 5) {
      response += ` and ${crops.length - 5} other suitable crops`;
    }

    response +=
      '. Consider local soil conditions, water availability, and market demand when making final decisions.';
    return response;
  }

  // Soil quality
  if (
    msg.includes('soil') ||
    msg.includes('quality') ||
    msg.includes('fertility')
  ) {
    return (
      seasonContext +
      'To improve soil quality: 1) Add organic compost regularly, 2) Practice crop rotation, 3) Test soil pH (ideal range 6.0-7.0), 4) Use cover crops, 5) Avoid over-tilling. Regular soil testing helps monitor nutrient levels.'
    );
  }

  // Irrigation
  if (
    msg.includes('irrigation') ||
    msg.includes('water') ||
    msg.includes('watering')
  ) {
    return (
      seasonContext +
      'Best irrigation practices: 1) Water early morning or evening, 2) Use drip irrigation for efficiency, 3) Monitor soil moisture, 4) Mulch to retain moisture, 5) Adjust watering based on weather and crop stage.'
    );
  }

  // Pest control
  if (
    msg.includes('pest') ||
    msg.includes('insect') ||
    msg.includes('bug') ||
    msg.includes('disease')
  ) {
    return (
      seasonContext +
      'Pest management tips: 1) Use integrated pest management (IPM), 2) Encourage beneficial insects, 3) Rotate crops annually, 4) Remove infected plants promptly, 5) Use organic pesticides when necessary, 6) Monitor crops regularly.'
    );
  }

  // Fertilizers
  if (
    msg.includes('fertilizer') ||
    msg.includes('nutrient') ||
    msg.includes('nitrogen') ||
    msg.includes('phosphorus')
  ) {
    return (
      seasonContext +
      'Fertilizer recommendations: 1) Test soil first, 2) Use balanced NPK fertilizers, 3) Apply organic compost, 4) Consider slow-release fertilizers, 5) Follow crop-specific nutrient requirements, 6) Avoid over-fertilization.'
    );
  }

  // Weather-related
  if (
    msg.includes('weather') ||
    msg.includes('rain') ||
    msg.includes('temperature')
  ) {
    const weatherInfo = weather
      ? `Current conditions: ${Math.round(weather.temperature)}°C, ${weather.humidity}% humidity, ${weather.description}. `
      : '';
    return (
      seasonContext +
      weatherInfo +
      'Monitor weather forecasts for farming decisions. Protect crops from extreme weather, adjust irrigation based on rainfall, and plan planting/harvesting around weather patterns.'
    );
  }

  // Default response
  return (
    seasonContext +
    'I can help you with crop recommendations, soil management, irrigation, pest control, fertilizers, and weather-related farming advice. What specific farming topic would you like to know about?'
  );
};

router.post('/', auth, async (req, res) => {
  try {
    // console.log('Received chatbot request:', req.body);
    const { message, location, weather } = req.body;

    if (!message) {
      return res.status(400).json({
        message: 'Message is required',
      });
    }

    // Get current season and climate if location is available
    let seasonContext = '';
    if (location) {
      const currentMonth = new Date().getMonth() + 1;
      const season = getIndianSeason(currentMonth);
      const climate = weather ? getClimate(weather.temperature) : 'moderate';
      seasonContext = `Based on your location near ${location.name}, it's currently ${season} season with ${climate} conditions. `;
    }

    // Try ML service first, but always fall back to rule-based responses
    let mlResponse = null;
    try {
      // First try to get a response from the chat endpoint
      const chatResponse = await axios.post(
        `${ML_SERVICE_URL}/chat`,
        {
          message,
          location,
          weather,
        },
        { timeout: 3000 }
      ); // 3 second timeout

      if (
        chatResponse.data.message &&
        !chatResponse.data.message.includes('I\'m sorry') &&
        !chatResponse.data.message.includes(
          'Would you like to know about crop recommendations'
        )
      ) {
        mlResponse = chatResponse.data;
      }
    } catch (chatError) {
      // Try prediction endpoint as backup
      try {
        const predictionParams = getDefaultSoilParams(weather);
        const predResponse = await axios.post(
          `${ML_SERVICE_URL}/predict`,
          predictionParams,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 3000,
          }
        );
        mlResponse = predResponse.data;
      } catch (predError) {
        // ML service unavailable, will use rule-based response
      }
    }

    // Use ML response if available, otherwise use rule-based response
    if (mlResponse && mlResponse.message) {
      return res.json({
        message: seasonContext + mlResponse.message,
        recommendations: mlResponse.recommendations,
      });
    } else {
      // Fall back to rule-based response
      const ruleBasedResponse = await getRuleBasedResponse(
        message,
        req.user?.id,
        req.user?.type
      );
      return res.json({
        message: ruleBasedResponse,
      });
    }
  } catch (error) {
    console.error('Chatbot error:', error.message);

    // Always provide a rule-based fallback response even on error
    try {
      const ruleBasedResponse = await getRuleBasedResponse(
        req.body.message || 'help',
        req.user?.id,
        req.user?.type
      );
      res.json({
        message: ruleBasedResponse,
      });
    } catch (fallbackError) {
      // Final fallback
      res.json({
        message:
          'I\'m here to help with your farming questions! You can ask me about crop recommendations, soil management, irrigation, pest control, fertilizers, and weather-related farming advice.',
      });
    }
  }
});

module.exports = router;
