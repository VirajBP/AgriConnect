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
                const response = await axios.get('/api/consumer/consumer/dashboard');
                console.log('Consumer dashboard response:', response.data);

                if (response.data.success) {
                    console.log('Dashboard data received:', response.data.data);
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
                    setError('Dashboard data not found. Please try refreshing the page.');
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
        // Determine how many months to show based on period
        let monthsToShow;
        switch (period) {
            case '1M':
                monthsToShow = 1;
                break;
            case '3M':
                monthsToShow = 3;
                break;
            case '6M':
                monthsToShow = 6;
                break;
            default:
                monthsToShow = 6;
        }

        // Generate the last N months from current date
        const months = [];
        const currentDate = new Date();
        
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            months.push(monthStr);
        }

        // Create data array with 0 as default, then fill with actual data if available
        const chartData = months.map(month => {
            let amount = 0;
            if (dashboardData?.monthlySpending) {
                const existingMonth = dashboardData.monthlySpending.find(data => data.month === month);
                if (existingMonth) {
                    amount = existingMonth.amount;
                }
            }
            return { month, amount };
        });

        return {
            labels: chartData.map(item => {
                const date = new Date(item.month);
                return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Monthly Spending',
                data: chartData.map(item => item.amount),
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

    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    // Update chart data when dashboardData or timeFilter changes
    useEffect(() => {
        if (dashboardData) {
            setChartData(getChartData(timeFilter));
        }
    }, [dashboardData, timeFilter, isDarkMode]);

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