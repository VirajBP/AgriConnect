import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { 
    FaShoppingBag, 
    FaHistory, 
    FaBox, 
    FaArrowRight, 
    FaLeaf, 
    FaStore,
    FaCalendarAlt
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { consumerData } from '../../mockData/consumerData';
import './ConsumerDashboard.css';
import { useAuth } from '../../Context/AuthContext';
import axios from '../../utils/axios';
import { Typography } from '@mui/material';
import { useTheme } from '../../Context/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ConsumerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('6M');
    const { isDarkMode } = useTheme();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                console.log('Fetching consumer dashboard data...');
                const response = await axios.get('/api/consumer/dashboard');
                console.log('Consumer dashboard response:', response.data);

                if (response.data.success) {
                    setDashboardData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error('Error fetching consumer dashboard data:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });

                if (err.response?.status === 401) {
                    setError('Please log in again to access the dashboard');
                } else if (err.response?.status === 404) {
                     // This might happen if a dashboard hasn't been created yet, though our backend now creates one on registration.
                     // We can handle it gracefully or rely on the backend to create it.
                    setError('Dashboard data not found.');
                } else {
                    setError(err.response?.data?.message || 'Error fetching dashboard data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []); // Empty dependency array means this runs once on mount

    // Function to prepare chart data based on filter
    const getChartData = (period) => {
        if (!dashboardData || !dashboardData.monthlySpending) return { labels: [], datasets: [] };

        // Get current date and create a date for filtering
        const currentDate = new Date();
        const filterDate = new Date(currentDate);

        // Set filter date based on period
        switch (period) {
            case '3M':
                filterDate.setMonth(currentDate.getMonth() - 2); // Show last 3 months
                break;
            case '1M':
                filterDate.setMonth(currentDate.getMonth()); // Show current month
                break;
            default: // 6M
                filterDate.setMonth(currentDate.getMonth() - 5); // Show last 6 months
        }

        // Reset dates to start of month for accurate comparison
        filterDate.setDate(1);
        filterDate.setHours(0, 0, 0, 0);

        // Generate all months in the range
        const months = [];
        const tempDate = new Date(filterDate);
        
        while (tempDate <= currentDate) {
            months.push(tempDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        // Map existing data to the months
        const existingData = [...dashboardData.monthlySpending];
        const mergedData = months.map(month => {
            const existingMonth = existingData.find(data => data.month === month);
            return {
                month: month,
                amount: existingMonth ? existingMonth.amount : 0
            };
        });

        return {
            labels: mergedData.map(item => item.month),
            datasets: [{
                label: 'Monthly Spending',
                data: mergedData.map(item => item.amount),
                fill: true,
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                tension: 0.4,
                spanGaps: false,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
    };

     // Update chart data when dashboardData or timeFilter changes
    useEffect(() => {
        if (dashboardData) {
            setChartData(getChartData(timeFilter));
        }
    }, [dashboardData, timeFilter]);

    const [chartData, setChartData] = useState(getChartData(timeFilter)); // Initialize with default filter

    const handleTimeFilterChange = (period) => {
        setTimeFilter(period);
        // chartData will be updated by the useEffect hook
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                titleColor: isDarkMode ? '#fff' : '#333',
                bodyColor: isDarkMode ? '#fff' : '#333',
                borderColor: isDarkMode ? '#333' : '#e0e0e0',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    display: true
                },
                ticks: {
                    color: isDarkMode ? '#fff' : '#333',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    display: true
                },
                ticks: {
                    color: isDarkMode ? '#fff' : '#333',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        }
    };

    return (
        <div className="consumer-dashboard">
            <Sidebar 
                userType="consumer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
                <div className="dashboard-header">
                    <div className="welcome-section">
                        <h1>Welcome back, {user?.name}!</h1>
                        <p>Here's what's happening with your orders</p>
                    </div>
                    <button className="new-order-btn" onClick={() => navigate('/consumer/market')}>
                        <FaStore /> Browse Market
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <FaShoppingBag />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Active Orders</span>
                            <h3>{dashboardData?.stats?.pendingOrders}</h3>
                            <span className="stat-change">Pending/Confirmed</span>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">
                            <FaLeaf />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Orders</span>
                            <h3>{dashboardData?.stats?.totalOrders}</h3>
                            <span className="stat-change">All time</span>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <FaCalendarAlt />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Completed Orders</span>
                            <h3>{dashboardData?.stats?.completedOrders}</h3>
                            <span className="stat-change">All time</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-main">
                    <div className={`spending-trends ${isDarkMode ? 'dark' : ''}`}>
                        <div className="section-header">
                            <h2>Spending Trends</h2>
                            <div className="time-filters">
                                {['6M', '3M', '1M'].map((period) => (
                                    <button
                                        key={period}
                                        className={timeFilter === period ? 'active' : ''}
                                        onClick={() => handleTimeFilterChange(period)}
                                        disabled={period === '1M' && (!dashboardData?.monthlySpending || dashboardData.monthlySpending.length < 1)}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="chart-container">
                            {dashboardData?.monthlySpending?.length > 0 ? (
                                <Line data={chartData} options={chartOptions} />
                            ) : (
                                <Typography variant="body1" align="center">No spending data available.</Typography>
                            )}
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'dark recent-activity' : 'recent-activity'}`}>
                        <div className="section-header">
                            <h2>Recent Activity</h2>
                            <button className="view-all" onClick={() => navigate('/consumer/orders')}>
                                View All <FaArrowRight />
                            </button>
                        </div>
                        <div className="activity-list">
                            {dashboardData?.recentOrders?.map(order => (
                                <div key={order._id} className={`${isDarkMode ? 'dark activity-item' : 'activity-item'}`}>
                                    <div className="activity-icon">
                                        <FaBox />
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-header">
                                            <h4>Order from {order.farmerName}</h4>
                                            <span className={`status ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        {order.productName && (
                                            <p className="activity-items">
                                                {order.productName}
                                            </p>
                                        )}
                                        <div className="activity-meta">
                                            <span className="date">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!dashboardData || !dashboardData.recentOrders || dashboardData.recentOrders.length === 0) && (
                                <Typography variant="body1" align="center">No recent activity.</Typography>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsumerDashboard; 