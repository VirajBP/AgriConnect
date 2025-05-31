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
  Rating
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function ConsumerOrders() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [orders, setOrders] = useState([
    { 
      id: 1, 
      name: "Wheat", 
      variety: "Premium Quality",
      status: "Pending",
      quantity: "50 kg",
      price: "₹2000",
      farmerName: "Rajesh Kumar",
      farmerLocation: "Punjab",
      orderDate: "2024-03-20",
      expectedDelivery: "2024-03-25",
      organicCertified: true,
      quality: "Premium"
    },
    { 
      id: 2, 
      name: "Rice", 
      variety: "Basmati",
      status: "Completed",
      quantity: "30 kg",
      price: "₹1800",
      farmerName: "Suresh Verma",
      farmerLocation: "Haryana",
      orderDate: "2024-03-15",
      deliveryDate: "2024-03-18",
      rating: 5,
      review: "Excellent quality rice, very satisfied with the purchase!"
    },
    { 
      id: 3, 
      name: "Corn", 
      variety: "Sweet Corn",
      status: "Rejected",
      quantity: "25 kg",
      price: "₹1200",
      farmerName: "Amit Sharma",
      farmerLocation: "UP",
      orderDate: "2024-03-10",
      reason: "Quality not as expected"
    },
    { 
      id: 4, 
      name: "Cotton", 
      variety: "Long Staple",
      status: "Processing",
      quantity: "100 kg",
      price: "₹4500",
      farmerName: "Priya Patel",
      farmerLocation: "Gujarat",
      orderDate: "2024-03-22",
      expectedDelivery: "2024-03-28",
      organicCertified: true
    },
    { 
      id: 5, 
      name: "Sugarcane", 
      variety: "Fresh",
      status: "Completed",
      quantity: "200 kg",
      price: "₹3000",
      farmerName: "Ramesh Yadav",
      farmerLocation: "Maharashtra",
      orderDate: "2024-03-12",
      deliveryDate: "2024-03-16",
      rating: 4,
      review: "Good quality, prompt delivery"
    },
    { 
      id: 6, 
      name: "Rice Husk", 
      variety: "Processed",
      status: "Completed",
      quantity: "500 kg",
      price: "₹4000",
      farmerName: "David Clark",
      farmerLocation: "Bihar",
      orderDate: "2024-03-08",
      deliveryDate: "2024-03-11",
      rating: 5,
      review: "Perfect for our biomass needs"
    },
    { 
      id: 7, 
      name: "Wheat Straw", 
      variety: "Baled",
      status: "Pending",
      quantity: "300 kg",
      price: "₹1800",
      farmerName: "Emma Davis",
      farmerLocation: "MP",
      orderDate: "2024-03-21",
      expectedDelivery: "2024-03-26",
      transportRequired: true
    },
    { 
      id: 8, 
      name: "Sugarcane Bagasse", 
      variety: "Fresh",
      status: "Processing",
      quantity: "400 kg",
      price: "₹2800",
      farmerName: "Tom Wilson",
      farmerLocation: "UP",
      orderDate: "2024-03-19",
      expectedDelivery: "2024-03-24",
      moisture: "15%"
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleOrders, setVisibleOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/consumer/orders');
        if (response.data.success) {
          console.log('Frontend received consumer orders:', response.data.data);
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

  useEffect(() => {
    setTimeout(() => {
      setVisibleOrders(orders);
    }, 300);
  }, [orders]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        userType="consumer" 
        onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
              {visibleOrders
                .filter(order => ['pending', 'processing'].includes(order.status.toLowerCase()))
                .map((order, index) => (
                  <tr key={order.id} className="order-row animate" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>#{order.id}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{order.variety}</Typography>
                      </Box>
                    </td>
                    <td>{order.quantity}</td>
                    <td>{order.price}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.farmerName}</Typography>
                        <Typography variant="caption" color="textSecondary">{order.farmerLocation}</Typography>
                      </Box>
                    </td>
                    <td>{order.orderDate}</td>
                    <td>{order.expectedDelivery}</td>
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
                      {order.status === 'Pending' && (
                        <Tooltip title="Cancel Order">
                          <IconButton size="small" color="error">
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
              ))}
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
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders
                .filter(order => ['completed', 'rejected'].includes(order.status.toLowerCase()))
                .map((order, index) => (
                  <tr key={order.id} className="order-row animate" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>#{order.id}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{order.variety}</Typography>
                      </Box>
                    </td>
                    <td>{order.quantity}</td>
                    <td>{order.price}</td>
                    <td>
                      <Box>
                        <Typography variant="body1">{order.farmerName}</Typography>
                        <Typography variant="caption" color="textSecondary">{order.farmerLocation}</Typography>
                      </Box>
                    </td>
                    <td>{order.orderDate}</td>
                    <td>{order.deliveryDate || '-'}</td>
                    <td>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </td>
                    <td>
                      {order.status === 'Completed' && (
                        <Rating
                          value={order.rating || 0}
                          readOnly
                          size="small"
                          icon={<StarIcon fontSize="inherit" />}
                        />
                      )}
                    </td>
                    <td>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(order)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Order Details #{selectedOrder?.id}
          </DialogTitle>
          <DialogContent dividers>
            {selectedOrder && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Product Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1} mb={3}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Product:</Typography>
                    <Typography variant="body1">{selectedOrder.name} ({selectedOrder.variety})</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Quantity:</Typography>
                    <Typography variant="body1">{selectedOrder.quantity}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Price:</Typography>
                    <Typography variant="body1">{selectedOrder.price}</Typography>
                  </Box>
                  {selectedOrder.organicCertified && (
                    <Chip label="Organic Certified" color="success" size="small" sx={{ alignSelf: 'flex-start' }} />
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Farmer Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1} mb={3}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Name:</Typography>
                    <Typography variant="body1">{selectedOrder.farmerName}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Location:</Typography>
                    <Typography variant="body1">{selectedOrder.farmerLocation}</Typography>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Order Status
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Status:</Typography>
                    <Chip
                      label={selectedOrder.status}
                      color={getStatusColor(selectedOrder.status)}
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Order Date:</Typography>
                    <Typography variant="body1">{selectedOrder.orderDate}</Typography>
                  </Box>
                  {selectedOrder.expectedDelivery && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Expected Delivery:</Typography>
                      <Typography variant="body1">{selectedOrder.expectedDelivery}</Typography>
                    </Box>
                  )}
                  {selectedOrder.deliveryDate && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Delivery Date:</Typography>
                      <Typography variant="body1">{selectedOrder.deliveryDate}</Typography>
                    </Box>
                  )}
                </Box>

                {selectedOrder.rating && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                      Rating & Review
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Rating value={selectedOrder.rating} readOnly />
                      <Typography variant="body2">
                        ({selectedOrder.rating}/5)
                      </Typography>
                    </Box>
                    {selectedOrder.review && (
                      <Typography variant="body2" color="text.secondary">
                        "{selectedOrder.review}"
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}