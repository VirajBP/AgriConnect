import { useState, useEffect } from "react";
import Sidebar from '../../Sidebar/Sidebar';
import './Orders.css';
import '../../../index.css';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  CircularProgress
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from '../../../utils/axios';
import { useTheme } from '../../../Context/ThemeContext';

// Add this function to get product image
const getProductImage = (productName) => {
  if (!productName) return null;
  
  // Handle special cases for product names
  const nameMap = {
    'green peppers': 'green-pepper',
    'red peppers': 'red-pepper',
    'yellow peppers': 'yellow-pepper',
    // Add more special cases as needed
  };

  // Check if we have a special case for this product name
  const formattedName = nameMap[productName.toLowerCase()] || 
    productName.toLowerCase()
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/s$/, '');       // Remove trailing 's' if present
  
  // Try different image extensions
  const extensions = ['jpg', 'jpeg', 'webp', 'avif'];
  
  // Find the first existing image
  for (const ext of extensions) {
    try {
      const imagePath = `/images/products/crops/${formattedName}.${ext}`;
      return imagePath; // Return first attempt
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

export default function ConsumerOrders() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/consumer/orders');
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
  }, []);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await axios.put(`/api/consumer/orders/${orderId}/cancel`);
      if (response.data.success) {
        // Refresh orders from server to get updated data
        const ordersResponse = await axios.get('/api/consumer/orders');
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="orders-container">
        <Sidebar 
          userType="consumer" 
          onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
        />
        <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <CircularProgress />
          </Box>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <Sidebar 
          userType="consumer" 
          onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
        />
        <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
          <Typography color="error" variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
            {error}
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
            Please try again later or contact support if the problem persists.
          </Typography>
        </div>
      </div>
    );
  }

  const currentOrders = orders.filter(order => 
    ['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase())
  );

  const pastOrders = orders.filter(order => 
    ['completed', 'cancelled'].includes(order.status.toLowerCase())
  );

  return (
    <div className="orders-container">
      <Sidebar 
        userType="consumer" 
        onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
        <Typography variant="h4" className="orders-heading" gutterBottom>
          Current Orders
        </Typography>
        <div className={`table-container ${isDarkMode ? 'dark' : ''}`}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Farmer</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-message">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No current orders found
                    </Typography>
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order._id} className="order-row">
                    <td>#{order._id.slice(-6)}</td>
                    <td>
                      <Box className="product-info">
                        <Typography variant="body1" className={isDarkMode ? 'text-white' : ''}>
                          {order.product?.productName || 'Product Removed'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.product?.variety || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td className={isDarkMode ? 'text-white' : ''}>{order.quantity} {order.product?.unit || 'units'}</td>
                    <td className={isDarkMode ? 'text-white' : ''}>₹{order.totalPrice}</td>
                    <td>
                      <Box className="farmer-info">
                        <Typography variant="body1" className={isDarkMode ? 'text-white' : ''}>
                          {order.farmer?.name || 'Farmer Unavailable'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.farmer?.location || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td className={isDarkMode ? 'text-white' : ''}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className={isDarkMode ? 'text-white' : ''}>
                      {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        className={`status-chip ${order.status.toLowerCase()}`}
                      />
                    </td>
                    <td>
                      <Box className="action-buttons">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(order)}
                            className={isDarkMode ? 'dark-icon' : ''}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {order.status.toLowerCase() === 'pending' && (
                          <Tooltip title="Cancel Order">
                            <IconButton 
                              size="small" 
                              onClick={() => handleCancelOrder(order._id)}
                              color="error"
                              className={isDarkMode ? 'dark-icon' : ''}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Typography variant="h4" className="orders-heading" gutterBottom sx={{ mt: 4 }}>
          Past Orders
        </Typography>
        <div className={`table-container ${isDarkMode ? 'dark' : ''}`}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Farmer</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pastOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-message">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No past orders found
                    </Typography>
                  </td>
                </tr>
              ) : (
                pastOrders.map((order) => (
                  <tr key={order._id} className="order-row">
                    <td>#{order._id.slice(-6)}</td>
                    <td>
                      <Box className="product-info">
                        <Typography variant="body1" className={isDarkMode ? 'text-white' : ''}>
                          {order.product?.productName || 'Product Removed'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.product?.variety || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td className={isDarkMode ? 'text-white' : ''}>{order.quantity} {order.product?.unit || 'units'}</td>
                    <td className={isDarkMode ? 'text-white' : ''}>₹{order.totalPrice}</td>
                    <td>
                      <Box className="farmer-info">
                        <Typography variant="body1" className={isDarkMode ? 'text-white' : ''}>
                          {order.farmer?.name || 'Farmer Unavailable'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.farmer?.location || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td className={isDarkMode ? 'text-white' : ''}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className={isDarkMode ? 'text-white' : ''}>
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        className={`status-chip ${order.status.toLowerCase()}`}
                      />
                    </td>
                    <td>
                      <Box className="action-buttons">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(order)}
                            className={isDarkMode ? 'dark-icon' : ''}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          className={isDarkMode ? 'dark-dialog' : ''}
        >
          {selectedOrder && (
            <>
              <DialogTitle>Order Details</DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {/* Left side - Product Image and Basic Info */}
                  <Box>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: 300, 
                        borderRadius: 2, 
                        overflow: 'hidden',
                        mb: 2,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedOrder.product?.productName ? (
                        <img 
                          src={getProductImage(selectedOrder.product.productName)} 
                          alt={selectedOrder.product.productName}
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = '/images/products/placeholder.jpg'; // Fallback image
                          }}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: 'grey.100'
                          }}
                        >
                          <Typography variant="body1" color="textSecondary">
                            No image available
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="h5" gutterBottom>
                      {selectedOrder.product?.productName || 'Product Removed'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Quantity
                      </Typography>
                      <Typography variant="subtitle1">
                        {selectedOrder.quantity} {selectedOrder.product?.unit || 'units'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ₹{selectedOrder.totalPrice}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right side - Order and Farmer Details */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Order Information
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Order ID</Typography>
                        <Typography variant="body1">#{selectedOrder._id.slice(-6)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Order Date</Typography>
                        <Typography variant="body1">{new Date(selectedOrder.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Status</Typography>
                        <Chip
                          label={selectedOrder.status}
                          color={getStatusColor(selectedOrder.status)}
                          size="small"
                        />
                      </Box>
                      {selectedOrder.expectedDelivery && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">Expected Delivery</Typography>
                          <Typography variant="body1">{new Date(selectedOrder.expectedDelivery).toLocaleDateString()}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Farmer Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Name</Typography>
                        <Typography variant="body1">{selectedOrder.farmer?.name || 'Farmer Unavailable'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Location</Typography>
                        <Typography variant="body1">{selectedOrder.farmer?.location || '-'}</Typography>
                      </Box>
                      {selectedOrder.farmer?.phoneNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">Contact</Typography>
                          <Typography variant="body1">{selectedOrder.farmer.phoneNumber}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </div>
    </div>
  );
}