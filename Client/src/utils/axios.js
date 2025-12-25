import axios from 'axios';

const instance = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || 'https://agriconnect-backend.vercel.app').replace(/\/api$/, ''),
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add a request interceptor to add the auth token to requests
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('Making request to:', config.url, {
            method: config.method,
            headers: config.headers
        });
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors
instance.interceptors.response.use(
    (response) => {
        console.log('Response received:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default instance; 