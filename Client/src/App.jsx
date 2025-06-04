import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { ThemeProvider } from './Context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Signup';
import FarmerDashboard from './components/Farmer/FarmerDashboard';
import FarmerProfile from './components/Farmer/FarmerProfile';
import FarmerOrders from './components/Farmer/Orders/Order';
import FarmerProducts from './components/Farmer/Products/FarmerProducts';
import ConsumerDashboard from './components/Consumer/ConsumerDashboard';
import ConsumerProfile from './components/Consumer/ConsumerProfile';
import ConsumerOrders from './components/Consumer/Orders/Orders';
import ConsumerMarket from './components/Consumer/Market/Market';
import './App.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Farmer Routes */}
              <Route path="/farmer/dashboard" element={
                <ProtectedRoute userType="farmer">
                  <FarmerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/farmer/profile" element={
                <ProtectedRoute userType="farmer">
                  <FarmerProfile />
                </ProtectedRoute>
              } />

              <Route path="/farmer/products" element={
                <ProtectedRoute userType="farmer">
                  <FarmerProducts />
                </ProtectedRoute>
              } />

              <Route path="/farmer/orders" element={
                <ProtectedRoute userType="farmer">
                  <FarmerOrders />
                </ProtectedRoute>
              } />              

              {/* Protected Consumer Routes */}
              <Route path="/consumer/dashboard" element={
                <ProtectedRoute userType="consumer">
                  <ConsumerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/consumer/profile" element={
                <ProtectedRoute userType="consumer">
                  <ConsumerProfile />
                </ProtectedRoute>
              } />

              <Route path="/consumer/orders" element={
                <ProtectedRoute userType="consumer">
                  <ConsumerOrders />
                </ProtectedRoute>
              } />

              <Route path="/consumer/market" element={
                <ProtectedRoute userType="consumer">
                  <ConsumerMarket />
                </ProtectedRoute>
              } />

              {/* Redirect root to login */}
              <Route path="/" element={<Login />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App; 