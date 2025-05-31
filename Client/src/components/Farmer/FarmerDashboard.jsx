import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../Context/AuthContext';
import axios from '../../utils/axios';
import Sidebar from '../Sidebar/Sidebar';
import { FaShoppingBag, FaCalendarCheck, FaHistory, FaArrowRight } from 'react-icons/fa';
import { Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
} from 'chart.js';
import './Dashboard/FarmerDashboard.css';
import Chatbot from '../shared/Chatbot/Chatbot';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
);

const FarmerDashboard = () => {
    const { user } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalRevenue: 0,
            activeListings: 0,
            completedOrders: 0,
            pendingOrders: 0
        },
        monthlyRevenue: [],
        popularProducts: [],
        todayOrders: [],
        upcomingOrders: [],
        inventory: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                console.log('Fetching dashboard data...');
                const token = localStorage.getItem('token');
                console.log('Token available:', !!token);
                
                const response = await axios.get('/farmer/dashboard');
                console.log('Dashboard response:', response.data);
                
                if (response.data.success) {
                    setDashboardData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
                
                if (err.response?.status === 401) {
                    setError('Please log in again to access the dashboard');
                } else if (err.response?.status === 404) {
                    setError('Dashboard data not found');
                } else {
                    setError(err.response?.data?.message || 'Error fetching dashboard data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
            </Box>
        );
    }

    // Calculate total quantity for percentages
    const totalQuantity = dashboardData.inventory.reduce((sum, item) => sum + item.quantity, 0);

    // Updated chart data with percentages
    const chartData = {
        labels: dashboardData.inventory.map(item => item.productName),
        datasets: [{
            data: dashboardData.inventory.map(item => item.quantity),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ]
        }]
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 20,
                    generateLabels: (chart) => {
                        const datasets = chart.data.datasets;
                        return chart.data.labels.map((label, i) => ({
                            text: `${label} (${Math.round((datasets[0].data[i] / totalQuantity) * 100)}%)`,
                            fillStyle: datasets[0].backgroundColor[i],
                            index: i
                        }));
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const percentage = Math.round((value / totalQuantity) * 100);
                        return `${context.label}: ${value}kg (${percentage}%)`;
                    }
                }
            },
            datalabels: {
                color: '#fff',
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: (value) => {
                    const percentage = Math.round((value / totalQuantity) * 100);
                    return percentage > 5 ? `${percentage}%` : ''; // Only show if > 5%
                }
            }
        },
        layout: {
            padding: 20
        }
    };

    const revenueChartData = {
        labels: dashboardData.monthlyRevenue.map(item => item.month),
        datasets: [
            {
                label: 'Monthly Revenue',
                data: dashboardData.monthlyRevenue.map(item => item.revenue),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    return (
        <div className="dashboard-container">
            <Sidebar 
                userType="farmer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <h1>Dashboard</h1>
                
                <Box sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Welcome, {user?.name}!
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Stats Cards */}
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Total Revenue
                                    </Typography>
                                    <Typography variant="h4">
                                        ₹{dashboardData.stats.totalRevenue.toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Active Listings
                                    </Typography>
                                    <Typography variant="h4">
                                        {dashboardData.stats.activeListings}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Completed Orders
                                    </Typography>
                                    <Typography variant="h4">
                                        {dashboardData.stats.completedOrders}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Pending Orders
                                    </Typography>
                                    <Typography variant="h4">
                                        {dashboardData.stats.pendingOrders}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Revenue Chart */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Monthly Revenue
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Line data={revenueChartData} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Popular Products */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Popular Products
                                    </Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product Name</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.popularProducts.map((product, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{product}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                    {/* Today's Orders */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Today's Orders
                                    </Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Customer</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.todayOrders.map((order) => (
                                                    <TableRow key={order._id}>
                                                        <TableCell>{order.productName}</TableCell>
                                                        <TableCell>{order.quantity} kg</TableCell>
                                                        <TableCell>{order.customerName}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                    {/* Upcoming Orders */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Upcoming Orders
                                    </Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Delivery Date</TableCell>
                                                    <TableCell>Customer</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.upcomingOrders.map((order) => (
                                                    <TableRow key={order._id}>
                                                        <TableCell>{order.productName}</TableCell>
                                                        <TableCell>{order.quantity} kg</TableCell>
                                                        <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>{order.customerName}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Inventory */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Inventory
                                    </Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Unit</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.inventory.map((product) => (
                                                    <TableRow key={product.productId}>
                                                        <TableCell>{product.productName}</TableCell>
                                                        <TableCell>{product.quantity}</TableCell>
                                                        <TableCell>{product.unit}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
                <Chatbot />
            </div>
        </div>
    );
};

export default FarmerDashboard; 