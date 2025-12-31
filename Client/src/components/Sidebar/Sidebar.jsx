import React, { useState, useEffect } from 'react';
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
  FaAngleLeft,
  FaComments,
} from 'react-icons/fa';
import { chatAPI } from '../../utils/chatAPI';

const Sidebar = ({ userType, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const farmerMenuItems = [
    { path: '/farmer/dashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/farmer/profile', name: 'Profile', icon: <FaUser /> },
    { path: '/farmer/orders', name: 'Orders', icon: <FaShoppingCart /> },
    { path: '/farmer/products', name: 'Products', icon: <FaBox /> },
    { 
      path: '/farmer/messages', 
      name: 'Messages', 
      icon: <FaComments />,
      badge: unreadCount > 0 ? unreadCount : null
    },
  ];

  const consumerMenuItems = [
    {
      path: '/consumer/dashboard',
      name: 'Dashboard',
      icon: <FaTachometerAlt />,
    },
    { path: '/consumer/market', name: 'Market', icon: <FaStore /> },
    { path: '/consumer/orders', name: 'Orders', icon: <FaShoppingCart /> },
    { path: '/consumer/profile', name: 'Profile', icon: <FaUser /> },
    { 
      path: '/consumer/messages', 
      name: 'Messages', 
      icon: <FaComments />,
      badge: unreadCount > 0 ? unreadCount : null
    },
  ];

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await chatAPI.getChats();
        const totalUnread = response.data.chats.reduce(
          (sum, chat) => sum + chat.unreadCount,
          0
        );
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

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
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `menu-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="icon">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="text">{item.name}</span>
                {item.badge && (
                  <span className="badge">{item.badge}</span>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <span className="badge-collapsed">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        <span className="icon">
          <FaSignOutAlt />
        </span>
        {!isCollapsed && <span className="text">Logout</span>}
      </button>
    </div>
  );
};

export default Sidebar;
