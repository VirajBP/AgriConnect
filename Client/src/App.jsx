import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import FarmerDashboard from './components/Farmer/FarmerDashboard';
import ConsumerDashboard from './components/Consumer/ConsumerDashboard';
import FarmerProfile from './components/Farmer/FarmerProfile';
import ConsumerProfile from './components/Consumer/ConsumerProfile';
import Market from './components/Consumer/Market/Market';
import Orders from './components/Farmer/Orders/Order';
import Products from './components/Farmer/Products/FarmerProducts';
import ConsumerOrders from './components/Consumer/Orders/Orders';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup/:userType" element={<Signup />} />
            
            {/* Protected routes */}
            <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
            <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
            <Route path="/farmer/profile" element={<FarmerProfile />} />
            <Route path="/consumer/profile" element={<ConsumerProfile />} />
            <Route path="/consumer/market" element={<Market />} />
            <Route path="/farmer/orders" element={<Orders />} />
            <Route path="/farmer/products" element={<Products />} />
            <Route path="/consumer/orders" element={<ConsumerOrders />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 