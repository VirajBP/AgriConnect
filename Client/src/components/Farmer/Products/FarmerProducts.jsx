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
import '../../../index.css';
import Sidebar from "../../Sidebar/Sidebar";
import axios from '../../../utils/axios'; // Correct the import path for the configured axios instance
import { Typography, Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '../../../Context/ThemeContext';

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
  const [isDark, setIsDark] = useState(false);
  
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

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    window.addEventListener('storage', checkDark); // In case theme is toggled elsewhere
    return () => window.removeEventListener('storage', checkDark);
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await axios.delete(`/farmer/products/${id}`);
        if (response.data.success) {
          setProducts(products.filter(product => product._id !== id));
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        setError(err.response?.data?.message || 'Error deleting product');
      }
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

  // Pie chart legend and tooltip colors
  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#e5e7eb' : '#333',
          font: { weight: 'bold' }
        }
      },
      tooltip: {
        bodyColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#e5e7eb' : '#333',
        titleColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#e5e7eb' : '#333'
      }
    }
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
      <div className={`  products-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className={!isDark? "products-header" : "products-header dark add-product-container add-product-box"}>
          <h1 className={isDark ? 'text-white' : 'text-black'}>My Products</h1>
          <button className="add-product-btn" onClick={() => setShowAddProduct(true)}>
            <FaPlus /> Add New Product
          </button>
        </div>

        {/* Add New Product Form - Rendered Inline */}
        {showAddProduct && (
          <div className="add-product-inline-form add-product-form">
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
              <div className="form-actions">
                <button type="submit">Add Product</button>
                <button type="button" onClick={() => setShowAddProduct(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col items-center w-full">
          <div className="flex justify-center w-full mb-4">
            <div className="search-box search-bar w-full max-w-md flex items-center bg-white dark:bg-gray-800 rounded shadow px-4 py-2">
              <FaSearch className="text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full bg-transparent text-black dark:text-white ml-2 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-center w-full mb-4">
            <div className="price-filter filter-box min-max-box min-price max-price flex gap-2 bg-white dark:bg-gray-800 rounded shadow px-4 py-2">
              <input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="bg-transparent text-black dark:text-white focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="bg-transparent text-black dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {showChart && (
          <div className="products-chart center chart-card">
            <h2>Product Distribution</h2>
            <Pie data={chartData} options={chartOptions} />
          </div>
        )}

        <div className="products-list">
          {sortedProducts.map(product => (
            <div key={product._id} className="product-card">
              {editingId === product._id ? (
                <div className="edit-product-form product-details-box">
                  <h3>Edit Product</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleEditProduct(product._id, {
                      productName: e.target.productName.value,
                      productVariety: e.target.productVariety.value,
                      quantity: e.target.quantity.value,
                      price: e.target.price.value,
                      estimatedDate: e.target.estimatedDate.value
                    });
                  }}>
                    <input
                      type="text"
                      name="productName"
                      defaultValue={product.productName}
                      placeholder="Product Name"
                      required
                    />
                    <input
                      type="text"
                      name="productVariety"
                      defaultValue={product.productVariety}
                      placeholder="Product Variety"
                      required
                    />
                    <input
                      type="number"
                      name="quantity"
                      defaultValue={product.quantity}
                      placeholder="Quantity (kg)"
                      required
                    />
                    <input
                      type="number"
                      name="price"
                      defaultValue={product.price}
                      placeholder="Price per kg"
                      required
                    />
                    <input
                      type="date"
                      name="estimatedDate"
                      defaultValue={new Date(product.estimatedDate).toISOString().split('T')[0]}
                      required
                    />
                    <div className="form-actions">
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="product-header">
                    <h3>{product.productName}</h3>
                    <span className="product-variety">{product.productVariety}</span>
                  </div>
                  <div className="product-details product-details-box">
                    <p><strong className={isDark ? 'text-white' : 'text-black'}>Quantity:</strong> {product.quantity} kg</p>
                    <p><strong className={isDark ? 'text-white' : 'text-black'}>Price:</strong> ₹{product.price}/kg</p>
                    <p><strong className={isDark ? 'text-white' : 'text-black'}>Estimated Date:</strong> {new Date(product.estimatedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => setEditingId(product._id)}>
                      <FaEdit /> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(product._id)}>
                      <FaTimes /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
