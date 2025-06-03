import { useState, useEffect } from "react";
import Sidebar from '../../Sidebar/Sidebar';
import './Orders.css';
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

export default function ConsumerOrders() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/consumer/orders');
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
      const response = await axios.put(`/consumer/orders/${orderId}/cancel`);
      if (response.data.success) {
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: 'Cancelled' }
            : order
        ));
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
        <Sidebar userType="consumer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
        <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
        <Sidebar userType="consumer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
        <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
    ['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase()),
    console.log(orders)
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
      <div className={`orders-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Typography variant="h4" className="orders-heading" gutterBottom>
          Current Orders
        </Typography>
        <div className="table-container">
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
                  <td colSpan="9" align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No current orders found
                    </Typography>
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.product?.productName || 'Product Removed'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.product?.variety || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td>{order.quantity} {order.product?.unit || 'units'}</td>
                    <td>₹{order.totalPrice}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.farmer?.name || 'Farmer Unavailable'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.farmer?.location || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : '-'}</td>
                    <td>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </td>
                    <td>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(order)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {order.status.toLowerCase() === 'pending' && (
                        <Tooltip title="Cancel Order">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCancelOrder(order._id)}
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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
        <div className="table-container">
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
                  <td colSpan="9" align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No past orders found
                    </Typography>
                  </td>
                </tr>
              ) : (
                pastOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.product?.productName || 'Product Removed'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.product?.variety || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td>{order.quantity} {order.product?.unit || 'units'}</td>
                    <td>₹{order.totalPrice}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.farmer?.name || 'Farmer Unavailable'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.farmer?.location || '-'}
                        </Typography>
                      </Box>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </td>
                    <td>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(order)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          {selectedOrder && (
            <>
              <DialogTitle>Order Details</DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Product Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Product Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.product?.productName || 'Product Removed'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Variety
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.product?.variety || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Quantity
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.quantity} {selectedOrder.product?.unit || 'units'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body1">
                        ₹{selectedOrder.totalAmount}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Farmer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.farmer?.name || 'Farmer Unavailable'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.farmer?.location || '-'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Order Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Order Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        label={selectedOrder.status}
                        color={getStatusColor(selectedOrder.status)}
                        size="small"
                      />
                    </Box>
                    {selectedOrder.expectedDelivery && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Expected Delivery
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedOrder.expectedDelivery).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                    {selectedOrder.deliveryDate && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Delivery Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
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