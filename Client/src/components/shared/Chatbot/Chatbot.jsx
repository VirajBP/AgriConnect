import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import axios from 'axios';

const commonQuestions = [
  {
    text: "What crops should I grow this season?",
    category: "crop"
  },
  {
    text: "How can I improve my soil quality?",
    category: "soil"
  },
  {
    text: "What are the best practices for irrigation?",
    category: "irrigation"
  },
  {
    text: "How to protect crops from pests?",
    category: "pest"
  },
  {
    text: "What fertilizers should I use?",
    category: "fertilizer"
  }
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get user's location when component mounts
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        try {
          // Get weather data using OpenWeatherMap API
          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}&units=metric`
          );
          setWeatherData(weatherResponse.data);
          
          // Add welcome message with location context
          setMessages([
            {
              type: 'bot',
              content: `Hello! I'm your farming assistant. I see you're located near ${weatherResponse.data.name}. I'll provide recommendations based on your local conditions. Here are some questions you might want to ask:`
            },
            {
              type: 'suggestions',
              content: commonQuestions
            }
          ]);
        } catch (error) {
          console.error('Error fetching weather:', error);
          // Fallback welcome message
          setMessages([
            {
              type: 'bot',
              content: 'Hello! I\'m your farming assistant. I can help you with crop recommendations and farming advice. Here are some questions you might want to ask:'
            },
            {
              type: 'suggestions',
              content: commonQuestions
            }
          ]);
        }
      }, (error) => {
        console.error('Error getting location:', error);
        // Fallback welcome message
        setMessages([
          {
            type: 'bot',
            content: 'Hello! I\'m your farming assistant. I can help you with crop recommendations and farming advice. Here are some questions you might want to ask:'
          },
          {
            type: 'suggestions',
            content: commonQuestions
          }
        ]);
      });
    }
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatRecommendations = (recommendations) => {
    if (!recommendations || recommendations.length === 0) return '';
    
    const mainRec = recommendations[0];
    const alternatives = recommendations.slice(1);
    
    let text = `I recommend growing ${mainRec.crop} (${(mainRec.confidence * 100).toFixed(1)}% confidence).\n\n`;
    if (alternatives.length > 0) {
      text += 'Alternative options:\n';
      alternatives.forEach(rec => {
        text += `• ${rec.crop} (${(rec.confidence * 100).toFixed(1)}% confidence)\n`;
      });
    }
    return text;
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(null, question);
  };

  const handleSendMessage = async (e, suggestedQuestion = null) => {
    if (e) e.preventDefault();
    
    const messageToSend = suggestedQuestion || inputMessage;
    if (!messageToSend.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: messageToSend
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare request with location and weather data
      const requestData = {
        message: messageToSend,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          name: weatherData?.name || 'Unknown'
        } : null,
        weather: weatherData ? {
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          description: weatherData.weather[0].description,
          rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0
        } : null
      };

      // Send message to backend
      const response = await axios.post('/api/chatbot', requestData);

      // Add bot response
      const botMessage = {
        type: 'bot',
        content: response.data.message
      };

      // If we have recommendations, add them as a separate message
      if (response.data.recommendations) {
        const recommendationsMessage = {
          type: 'bot',
          content: formatRecommendations(response.data.recommendations)
        };
        setMessages(prev => [...prev, botMessage, recommendationsMessage]);
      } else {
        setMessages(prev => [...prev, botMessage]);
      }

      // Add follow-up suggestions after bot response
      const followUpSuggestions = {
        type: 'suggestions',
        content: commonQuestions.filter(q => q.category !== 'crop')
      };
      setMessages(prev => [...prev, followUpSuggestions]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-container">
      <button 
        className={`chat-button ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
      >
        {isOpen ? '×' : '🌱'}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Farming Assistant</h3>
            {weatherData && (
              <div className="weather-info">
                <span>{weatherData.name}</span>
                <span>{Math.round(weatherData.main.temp)}°C</span>
                <span>{weatherData.weather[0].description}</span>
              </div>
            )}
          </div>
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.type === 'suggestions' ? (
                  <div className="suggestion-buttons">
                    {msg.content.map((question, qIndex) => (
                      <button
                        key={qIndex}
                        onClick={() => handleSuggestedQuestion(question.text)}
                        className="suggestion-button"
                      >
                        {question.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about crop recommendations..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
