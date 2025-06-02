import { useState, useEffect } from "react";
import Sidebar from '../../Sidebar/Sidebar';
import './Order.css';
import '../../../index.css';
import axios from '../../../utils/axios'; // Import the configured axios instance
import { Typography, Box, CircularProgress } from '@mui/material';

export default function FarmerOrders() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState([]); // Initialize orders as an empty array
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const [visibleOrders, setVisibleOrders] = useState([]);
  const [isDark, setIsDark] = useState(false);

useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    window.addEventListener('storage', checkDark); // In case theme is toggled elsewhere
    return () => window.removeEventListener('storage', checkDark);
  }, []);

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/farmer/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    // Animate orders appearing with a delay
    // Only animate if orders data is available and not loading/error
    if (orders.length > 0 && !loading && !error) {
      setTimeout(() => {
        setVisibleOrders(orders);
      }, 300);
    } else {
        setVisibleOrders([]); // Clear visible orders if no data or loading/error
    }
  }, [orders, loading, error]); // Depend on orders, loading, and error states

  const handleStatusChange = async (id, status) => {
    try {
      // Implement backend API call to update order status
      const response = await axios.put(`/farmer/orders/${id}/status`, { status });
      
      if (response.data.success) {
        // For now, simulate updating state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === id ? { ...order, status } : order // Use _id instead of id
          )
        );
        console.log(`Order ${id} status updated to ${status}`);
      } else {
        console.error('Failed to update order status:', response.data.message);
        // Optionally show an error message to the user
        setError(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      // Optionally show an error message to the user
      setError(err.response?.data?.message || 'Error updating order status');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }


  return (
    <div className="dashboard-container">
      <Sidebar 
        userType="farmer" 
        onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`dashboard-content ${isDark ? 'dark' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <h1 className="orders-heading">Pending Orders</h1>
        <div className={`table-container ${isDark? 'text-white': 'text-black'}`}>
          {visibleOrders.filter(order => order.status === "pending").length === 0 ? ( // Check for pending/confirmed orders
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <Typography variant="h6" color="textSecondary" className={isDark ? 'text-white' : 'text-black'}>
                No pending or confirmed orders.
              </Typography>
            </Box>
          ) : (
            <table className={`orders-table ${isDark? 'text-white': 'text-black'}`}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.filter(order => order.status === "pending").map((order, index) => (
                  <tr key={order._id} className="order-row animate" style={{ animationDelay: `${index * 0.1}s` }}> 
                    <td>#{order.orderId || 'N/A'}</td>
                    <td>{order.product?.productName || 'N/A'}</td> {/* Access product name from populated product object */}
                    <td>{order.quantity !== undefined && order.quantity !== null ? `${order.quantity} kg` : 'N/A'}</td>
                    <td>{order.product?.price !== undefined && order.product?.price !== null && order.quantity !== undefined && order.quantity !== null ? `₹${order.product.price * order.quantity}` : 'N/A'}</td> {/* Calculate total price */}
                    <td>{order.consumer?.name || 'N/A'}</td> {/* Access customer name from populated consumer object */}
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                    <td className={isDark ? 'text-white' : 'text-black'}>
                      <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'} `}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-button accept-button"
                          onClick={() => handleStatusChange(order._id, "confirmed")}
                        >
                          Accept
                        </button>
                        <button 
                          className="action-button reject-button"
                          onClick={() => handleStatusChange(order._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <h1 className="orders-heading">All Orders</h1>
        <div className="table-container">
           {visibleOrders.length === 0 ? ( // Check if any orders exist
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <Typography variant="h6" color="textSecondary">
                No orders available.
              </Typography>
            </Box>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order, index) => (
                  <tr key={order._id} className="order-row animate" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>#{order.orderId || 'N/A'}</td>
                    <td>{order.product?.productName || 'N/A'}</td> {/* Access product name */}
                    <td>{order.quantity !== undefined && order.quantity !== null ? `${order.quantity} kg` : 'N/A'}</td>
                    <td>{order.product?.price !== undefined && order.product?.price !== null && order.quantity !== undefined && order.quantity !== null ? `₹${order.product.price * order.quantity}` : 'N/A'}</td> {/* Calculate total price */}
                    <td>{order.consumer?.name || 'N/A'}</td> {/* Access customer name */}
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'}`}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
