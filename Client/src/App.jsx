import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { ThemeProvider } from './Context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Eager load only critical components
import Login from './components/Auth/Login';

// Lazy load non-critical components
const Register = lazy(() => import('./components/Auth/Signup'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const FarmerDashboard = lazy(
  () => import('./components/Farmer/FarmerDashboard')
);
const FarmerProfile = lazy(() => import('./components/Farmer/FarmerProfile'));
const FarmerOrders = lazy(() => import('./components/Farmer/Orders/Order'));
const FarmerProducts = lazy(
  () => import('./components/Farmer/Products/FarmerProducts')
);
const ConsumerDashboard = lazy(
  () => import('./components/Consumer/ConsumerDashboard')
);
const ConsumerProfile = lazy(
  () => import('./components/Consumer/ConsumerProfile')
);
const ConsumerOrders = lazy(
  () => import('./components/Consumer/Orders/Orders')
);
const ConsumerMarket = lazy(
  () => import('./components/Consumer/Market/Market')
);

// Loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="app">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup/:userType" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Farmer Routes */}
                <Route
                  path="/farmer/dashboard"
                  element={
                    <ProtectedRoute userType="farmer">
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer/profile"
                  element={
                    <ProtectedRoute userType="farmer">
                      <FarmerProfile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/farmer/products"
                  element={
                    <ProtectedRoute userType="farmer">
                      <FarmerProducts />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/farmer/orders"
                  element={
                    <ProtectedRoute userType="farmer">
                      <FarmerOrders />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Consumer Routes */}
                <Route
                  path="/consumer/dashboard"
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consumer/profile"
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerProfile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/consumer/orders"
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerOrders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/consumer/market"
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerMarket />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to login */}
                <Route path="/" element={<Login />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
