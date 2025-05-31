import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBox, FaUser, FaSignOutAlt, FaBars, FaEdit, 
         FaSave, FaTimes, FaDownload, FaSearch, FaSort, FaShoppingCart,
         FaPlus, FaFilter, FaChartPie, FaLeaf } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import './FarmerProducts.css';
import Sidebar from "../../Sidebar/Sidebar";
import axios from '../../../utils/axios'; // Correct the import path for the configured axios instance
import { Typography, Box, CircularProgress } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProductPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(true);
  
  const [products, setProducts] = useState([]);

  const [newProduct, setNewProduct] = useState({
    productName: '',
    productVariety: '',
    quantity: '',
    price: '',
    estimatedDate: ''
  });

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/farmer/products');
        if (response.data.success) {
          setProducts(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle adding new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/farmer/products', newProduct);
      if (response.data.success) {
        setProducts([...products, response.data.data]);
        setShowAddProduct(false);
        setNewProduct({
          productName: '',
          productVariety: '',
          quantity: '',
          price: '',
          estimatedDate: ''
        });
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Error adding product');
    }
  };

  // Handle editing product
  const handleEditProduct = async (id, updatedData) => {
    try {
      const response = await axios.put(`/farmer/products/${id}`, updatedData);
      if (response.data.success) {
        setProducts(products.map(product => 
          product._id === id ? response.data.data : product
        ));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Error updating product');
    }
  };

  // Handle deleting product
  const handleDeleteProduct = async (id) => {
    try {
      const response = await axios.delete(`/farmer/products/${id}`);
      if (response.data.success) {
        setProducts(products.filter(product => product._id !== id));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || 'Error deleting product');
    }
  };

  // Filter products based on search term and price range
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productVariety.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (!priceRange.min || product.price >= Number(priceRange.min)) &&
                        (!priceRange.max || product.price <= Number(priceRange.max));
    return matchesSearch && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Prepare chart data
  const chartData = {
    labels: products.map(p => p.productName),
    datasets: [{
      data: products.map(p => p.quantity),
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

  if (loading) {
    return (
      <div className="farmer-products">
        <Sidebar userType="farmer" />
        <div className="products-content">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="farmer-products">
        <Sidebar userType="farmer" />
        <div className="products-content">
          <Typography color="error" align="center">
            {error}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="farmer-products">
      <Sidebar 
        userType="farmer" 
        onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`products-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="products-header">
          <h1>My Products</h1>
          <button className="add-product-btn" onClick={() => setShowAddProduct(true)}>
            <FaPlus /> Add New Product
          </button>
        </div>

        <div className="products-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="price-filter">
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            />
          </div>
        </div>

        {showChart && (
          <div className="products-chart">
            <h2>Product Distribution</h2>
            <Pie data={chartData} />
          </div>
        )}

        <div className="products-list">
          {sortedProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-header">
                <h3>{product.productName}</h3>
                <span className="product-variety">{product.productVariety}</span>
              </div>
              <div className="product-details">
                <p><strong>Quantity:</strong> {product.quantity} kg</p>
                <p><strong>Price:</strong> ₹{product.price}/kg</p>
                <p><strong>Estimated Date:</strong> {new Date(product.estimatedDate).toLocaleDateString()}</p>
              </div>
              <div className="product-actions">
                <button onClick={() => setEditingId(product._id)}>
                  <FaEdit /> Edit
                </button>
                <button onClick={() => handleDeleteProduct(product._id)}>
                  <FaTimes /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddProduct && (
          <div className="add-product-modal">
            <div className="modal-content">
              <h2>Add New Product</h2>
              <form onSubmit={handleAddProduct}>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Product Variety"
                  value={newProduct.productVariety}
                  onChange={(e) => setNewProduct({ ...newProduct, productVariety: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity (kg)"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Price per kg"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  type="date"
                  value={newProduct.estimatedDate}
                  onChange={(e) => setNewProduct({ ...newProduct, estimatedDate: e.target.value })}
                  required
                />
                <div className="modal-actions">
                  <button type="submit">Add Product</button>
                  <button type="button" onClick={() => setShowAddProduct(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
