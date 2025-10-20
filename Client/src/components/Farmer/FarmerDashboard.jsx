import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../Context/AuthContext';
import axios from '../../utils/axios';
import Sidebar from '../Sidebar/Sidebar';
import { FaShoppingBag, FaCalendarCheck, FaHistory, FaClock } from 'react-icons/fa';
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
// import '../../index.css';
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
        inventory: []
    });
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDark, setIsDark] = useState(false);

useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    window.addEventListener('storage', checkDark); // In case theme is toggled elsewhere
    return () => window.removeEventListener('storage', checkDark);
  }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                console.log('Fetching dashboard data...');
                const token = localStorage.getItem('token');
                console.log('Token available:', !!token);
                
                const response = await axios.get('/api/farmer/dashboard');
                console.log('Dashboard response:', response.data,'New response' , response.data.data);
                
                if (response.data.success) {
                    // Initialize dashboard data without pending orders count
                    const initialData = {
                        ...response.data.data,
                        stats: {
                            ...response.data.data.stats,
                            pendingOrders: 0 // Will be updated after fetching pending orders
                        }
                    };
                    setDashboardData(initialData);
                    
                    // After getting dashboard data, fetch pending orders
                //     const response2 = await axios.get(`/api/orders?status=pending&farmerId=${response.data.data._id}`);
                // console.log('Pending Orders Response:', response2.data);
                    if (response) {
                        await fetchPendingOrders(response);
                    }
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

        const fetchPendingOrders = async () => {
            try {
                const response = await axios.get('/api/farmer/orders');
                // console.log('This is the response of the pending orders', response.data)
                // console.log('This is the response of the pending orders', response.data.data.stats.pendingOrders)
                if (response.data.success) {
                    // console.log('Fetched orders from the orders endpoint:', response.data.data);
                    const pending = (response.data.data).filter(order => order.status === 'pending');
                    // console.log('Filtered pending orders:', pending);
                    setPendingOrders(pending);
                    setDashboardData(prev => ({
                        ...prev,
                        stats: {
                            ...prev.stats,
                            pendingOrders: pending.length
                        }
                    }));
                } else {
                    console.error('Failed to fetch pending orders:', response.data.message);
                }
            } catch (error) {
                console.error('Error fetching pending orders:', error);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar userType="farmer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
                <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <div className="loading">
                        <CircularProgress />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <Sidebar userType="farmer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
                <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <div className="error-message">
                        <Typography color="error" variant="h6">
                            {error}
                        </Typography>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate total quantity for percentages
    const totalQuantity = (dashboardData.inventory || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Updated chart data with percentages
    const chartData = {
        labels: (dashboardData.inventory || []).map(item => item.productName || 'Unknown'),
        datasets: [{
            data: (dashboardData.inventory || []).map(item => item.quantity || 0),
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
        
        labels: (dashboardData.monthlyRevenue || []).map(item => item.month || 'Unknown'),
        datasets: [
            {
                label: 'Monthly Revenue',
                data: (dashboardData.monthlyRevenue || []).map(item => item.revenue || 0),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };
    // console.log('This is the dashboard data which is received ', dashboardData)
    const revenueChartOptions = {
        plugins: {
            legend: { labels: { color: isDark ? '#fff' : '#333' } },
            title: { color: isDark ? '#fff' : '#333' }
        },
        scales: {
            x: {
                grid: { color: isDark ? '#fff' : '#e5e7eb' },
                ticks: { color: isDark ? '#fff' : '#333' }
            },
            y: {
                grid: { color: isDark ? '#fff' : '#e5e7eb' },
                ticks: { color: isDark ? '#fff' : '#333' }
            }
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar 
                userType="farmer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDark ? 'dark' : ''}`}>
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {user?.name || 'Farmer'}!</h1>
                        <p >Here's an overview of your farm's performance</p>
                    </div>
                </div>

                <div className={`stats-grid ${isDark ? 'text-white' : 'text-black'}`}>
                    <div className="stat-card primary bg-white dark:bg-gray-900 border-l-4" style={{ borderLeftColor: '#3b82f6' }}>
                        <div className="stat-icon">
                            <FaShoppingBag />
                        </div>
                        <div className="stat-info">
                            <h3>₹{(dashboardData.stats?.totalRevenue || 0).toLocaleString()}</h3>
                            
                            <span className="stat-label">Total Revenue</span>
                        </div>
                    </div>

                    <div className="stat-card success bg-white dark:bg-gray-900 border-l-4" style={{ borderLeftColor: '#10b981' }}>
                        <div className="stat-icon">
                            <FaCalendarCheck />
                        </div>
                        <div className="stat-info">
                            <h3>{dashboardData.stats?.activeListings || 0}</h3>
                            <span className="stat-label">Active Listings</span>
                        </div>
                    </div>

                    <div className="stat-card warning bg-white dark:bg-gray-900 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                        <div className="stat-icon">
                            <FaHistory />
                        </div>
                        <div className="stat-info">
                            <h3>{dashboardData.stats?.completedOrders || 0}</h3>
                            <span className="stat-label">Completed Orders</span>
                        </div>
                    </div>

                    <div className="stat-card danger bg-white dark:bg-gray-900 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                        <div className="stat-icon">
                            <FaClock />
                        </div>
                        <div className="stat-info">
                            <h3>{dashboardData.stats?.pendingOrders || 0}</h3>
                            <span className="stat-label">Pending Orders</span>
                        </div>
                    </div>
                </div>

                <div className={`dashboard-main ${isDark? 'text-white': 'text-black'}`}>
                    <div className="monthly-revenue">
                        <div className="section-header">
                            <h2>Monthly Revenue</h2>
                        </div>
                        <div className="chart-container">
                            <Line data={revenueChartData} options={revenueChartOptions} />
                        </div>
                    </div>

                    <div className="pending-orders">
                        <div className="section-header">
                            <h2>Pending Orders</h2>
                        </div>
                        <div className="activity-list">
                            {pendingOrders.length > 0 ? (
                                pendingOrders.map((order) => (
                                    <div key={order._id || Math.random()} className="activity-item">
                                        <div className="activity-details">
                                            <div className="activity-header">
                                                <h4>{order.product?.name || 'Unknown Product'}</h4>
                                                <span className="status-badge status-pending">
                                                    {order.quantity || 0} kg
                                                </span>
                                            </div>
                                            <p className="activity-meta">
                                                Customer: {order.consumer?.name || 'Unknown Customer'}
                                            </p>
                                            <p className="activity-meta">
                                                Expected Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-orders">
                                    <p>No pending orders at the moment</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                    <div className={`inventory-section ${isDark? 'text-white': 'text-black'} ${isDark? 'dark': ''}`}>
                        <div className="section-header" style={{textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <h2 className={isDark ? 'text-white' : 'text-black'}>Inventory</h2>
                        </div>
                        <div className="inventory-table-container">
                            <table className="inventory-table w-full bg-white dark:bg-gray-900 dark:text-white">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-100 dark:bg-gray-800 dark:text-white">Product Name</th>
                                        <th className="bg-gray-100 dark:bg-gray-800 dark:text-white">Quantity</th>
                                        <th className="bg-gray-100 dark:bg-gray-800 dark:text-white">Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(dashboardData.inventory || []).map((product) => (
                                        <tr key={product.productId || Math.random()} className="border-b border-gray-200 dark:border-gray-700">
                                            <td>{product.productName || 'Unknown Product'}</td>
                                            <td>{product.quantity || 0}</td>
                                            <td>{product.unit || 'units'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                <Chatbot />
            </div>
        </div>
    );
};

export default FarmerDashboard; 