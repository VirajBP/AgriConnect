import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FarmerDashboard from '../components/Farmer/FarmerDashboard';
import FarmerProducts from '../components/Farmer/Products/FarmerProducts';
import FarmerProfile from '../components/Farmer/FarmerProfile';
import FarmerOrders from '../components/Farmer/Orders/Order';
// ... other imports

const FarmerRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<FarmerDashboard />} />
      <Route path="products" element={<FarmerProducts />} />
      <Route path="profile" element={<FarmerProfile />} />
      <Route path="orders" element={<FarmerOrders />} />
    </Routes>
  );
};

export default FarmerRoutes;
