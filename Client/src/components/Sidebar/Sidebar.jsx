import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import './Sidebar.css';
import { 
    FaBars, 
    FaTachometerAlt, 
    FaUser, 
    FaShoppingCart, 
    FaBox, 
    FaSignOutAlt,
    FaHome,
    FaShoppingBag,
    FaStore,
    FaAngleRight,
    FaAngleLeft
} from 'react-icons/fa';

const Sidebar = ({ userType, onToggle }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const farmerMenuItems = [
        { path: '/farmer/dashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
        { path: '/farmer/profile', name: 'Profile', icon: <FaUser /> },
        { path: '/farmer/orders', name: 'Orders', icon: <FaShoppingCart /> },
        { path: '/farmer/products', name: 'Products', icon: <FaBox /> },
    ];

    const consumerMenuItems = [
        { path: '/consumer/dashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
        { path: '/consumer/market', name: 'Market', icon: <FaStore /> },
        { path: '/consumer/orders', name: 'Orders', icon: <FaShoppingCart /> },
        { path: '/consumer/profile', name: 'Profile', icon: <FaUser /> },
    ];

    const menuItems = userType === 'farmer' ? farmerMenuItems : consumerMenuItems;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        navigate('/login');
    };

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
        onToggle && onToggle(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button className="toggle-btn" onClick={handleToggle}>
                    {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
                </button>
                {!isCollapsed && <h2>AgriConnect</h2>}
            </div>

            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `menu-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="icon">{item.icon}</span>
                        {!isCollapsed && <span className="text">{item.name}</span>}
                    </NavLink>
                ))}
            </div>

            <button className="logout-btn" onClick={handleLogout}>
                <span className="icon"><FaSignOutAlt /></span>
                {!isCollapsed && <span className="text">Logout</span>}
            </button>
        </div>
    );
};

export default Sidebar; 