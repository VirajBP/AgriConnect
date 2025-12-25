import { useState, useEffect } from "react";
import Sidebar from '../../Sidebar/Sidebar';
import './Order.css';
import '../../../index.css';
import axios from '../../../utils/axios'; // Import the configured axios instance
import { Typography, Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Rating, IconButton, Tooltip } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

export default function FarmerOrders() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState([]); // Initialize orders as an empty array
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const [visibleOrders, setVisibleOrders] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [showDeliveryDateDialog, setShowDeliveryDateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Rating dialog state (farmer → consumer)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

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
        const response = await axios.get('/api/farmer/orders');
        // console.log("These are the orders", response.data.data);
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        // console.error('Error fetching orders:', err);
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
      if (status === "confirmed") {
        setSelectedOrderId(id);
        setShowDeliveryDateDialog(true);
        return;
      }

      const response = await axios.put(`/api/farmer/orders/${id}/status`, { 
        status,
        deliveryDate: null // Reset delivery date when rejecting
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === id 
              ? {
                  ...order,
                  status: status,
                  deliveryDate: null
                }
              : order
          )
        );
        
        setVisibleOrders(prevVisibleOrders => 
          prevVisibleOrders.map(order => 
            order._id === id 
              ? {
                  ...order,
                  status: status,
                  deliveryDate: null
                }
              : order
          )
        );
      } else {
        // console.error('Failed to update order status:', response.data.message);
        setError(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      // console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Error updating order status');
    }
  };

  const handleConfirmDeliveryDate = async () => {
    if (!deliveryDate) {
      alert('Please select a delivery date');
      return;
    }

    try {
      const response = await axios.put(`/api/farmer/orders/${selectedOrderId}/status`, {
        status: 'confirmed',
        deliveryDate: deliveryDate
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === selectedOrderId 
              ? {
                  ...order,
                  status: 'confirmed',
                  deliveryDate: deliveryDate
                }
              : order
          )
        );
        
        setVisibleOrders(prevVisibleOrders => 
          prevVisibleOrders.map(order => 
            order._id === selectedOrderId 
              ? {
                  ...order,
                  status: 'confirmed',
                  deliveryDate: deliveryDate
                }
              : order
          )
        );

        setShowDeliveryDateDialog(false);
        setSelectedOrderId(null);
        setDeliveryDate('');
      }
    } catch (err) {
      // console.error('Error confirming order:', err);
      setError(err.response?.data?.message || 'Error confirming order');
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
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDark ? 'dark' : ''}`}>
        <div className="orders-container">
        <h1 className="orders-heading">Pending Orders</h1>
        <div className={`${isDark ? 'table-container-black' : 'table-container'}`}>
          {visibleOrders.filter(order => order.status === "pending").length === 0 ? ( 
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <Typography variant="h6" color="textSecondary" className={isDark ? 'text-white' : ''}>
                No pending or confirmed orders.
              </Typography>
            </Box>
          ) : (
            <table className={`orders-table ${isDark ? 'text-white' : ''}`}>
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
                    <td>{order.orderId}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>{order.price}</td>
                    <td>{order.customer}</td>
                    <td>{order.orderDate}</td>
                    <td>{order.deliveryDate}</td>
                    <td>
                      <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'} ${isDark ? 'dark' : ''}`}>
                        {order.status}
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
        <div className={`${isDark ? 'table-container-black' : 'table-container'}`}>
           {visibleOrders.length === 0 ? (
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <Typography variant="h6" color="textSecondary" className={isDark ? 'text-white' : ''}>
                No orders available.
              </Typography>
            </Box>
          ) : (
            <table className={`orders-table ${isDark ? 'text-white' : ''}`}>
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
                {visibleOrders.map((order, index) => (
                  <tr key={order._id} className="order-row animate" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>{order.orderId}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>{order.price}</td>
                    <td>{order.customer}</td>
                    <td>{order.orderDate}</td>
                    <td>{order.deliveryDate}</td>
                    <td>
                      <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'} ${isDark ? 'dark' : ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status?.toLowerCase() === 'completed' && !order.farmerRating && (
                        <Tooltip title="Rate Consumer">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setRatingOrderId(order._id);
                              setRatingValue(0);
                              setRatingComment('');
                              setRatingDialogOpen(true);
                            }}
                          >
                            <StarIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Delivery Date Dialog */}
        <Dialog 
          open={showDeliveryDateDialog} 
          onClose={() => {
            setShowDeliveryDateDialog(false);
            setSelectedOrderId(null);
            setDeliveryDate('');
          }}
          PaperProps={{
            style: {
              backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
              color: isDark ? '#ffffff' : '#000000'
            }
          }}
        >
          <DialogTitle>Set Expected Delivery Date</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                type="date"
                fullWidth
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                inputProps={{
                  min: new Date().toISOString().split('T')[0] // Prevent past dates
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowDeliveryDateDialog(false);
                setSelectedOrderId(null);
                setDeliveryDate('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDeliveryDate}
              variant="contained" 
              color="primary"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rating dialog: farmer → consumer */}
        <Dialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
              color: isDark ? '#ffffff' : '#000000'
            }
          }}
        >
          <DialogTitle>Rate Your Experience with the Consumer</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Rating
                name="consumer-rating"
                value={ratingValue}
                onChange={(_, newValue) => setRatingValue(newValue)}
                precision={1}
                size="large"
              />
              <TextField
                label="Optional comments"
                multiline
                minRows={3}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRatingDialogOpen(false)} disabled={submittingRating}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!ratingValue) {
                  alert('Please select a rating between 1 and 5');
                  return;
                }
                setSubmittingRating(true);
                try {
                  const res = await axios.post(
                    `/api/farmer/orders/${ratingOrderId}/rate`,
                    { value: ratingValue, comment: ratingComment }
                  );

                  if (res.data.success) {
                    setOrders(prev =>
                      prev.map(o =>
                        o._id === ratingOrderId
                          ? { ...o, farmerRating: res.data.data.farmerRating }
                          : o
                      )
                    );
                    setVisibleOrders(prev =>
                      prev.map(o =>
                        o._id === ratingOrderId
                          ? { ...o, farmerRating: res.data.data.farmerRating }
                          : o
                      )
                    );
                    setRatingDialogOpen(false);
                  } else {
                    alert(res.data.message || 'Failed to submit rating');
                  }
                } catch (err) {
                  // console.error('Error submitting rating:', err);
                  alert(err.response?.data?.message || 'Error submitting rating');
                } finally {
                  setSubmittingRating(false);
                }
              }}
              disabled={submittingRating}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
        </div>
      </div>
    </div>
  );
}
