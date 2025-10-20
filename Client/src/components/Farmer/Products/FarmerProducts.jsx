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
  const [catalog, setCatalog] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [varietySuggestions, setVarietySuggestions] = useState([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showVarietySuggestions, setShowVarietySuggestions] = useState(false);

  const [newProduct, setNewProduct] = useState({
    productName: '',
    productVariety: '',
    quantity: '',
    price: '',
    estimatedDate: ''
  });

  // Fetch products and catalog from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch farmer's products
        const productsResponse = await axios.get('/api/farmer/products');
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        }
        
        // Fetch product catalog for suggestions
        const catalogResponse = await axios.get('/api/farmer/catalog');
        if (catalogResponse.data.success) {
          setCatalog(catalogResponse.data.data);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    window.addEventListener('storage', checkDark); // In case theme is toggled elsewhere
    return () => window.removeEventListener('storage', checkDark);
  }, []);

  // Handle product name input change with suggestions
  const handleProductNameChange = (value) => {
    setNewProduct({ ...newProduct, productName: value, productVariety: '' });
    
    if (value.length > 0) {
      const suggestions = catalog
        .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
        .map(item => item.name)
        .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
        .slice(0, 5);
      setProductSuggestions(suggestions);
      setShowProductSuggestions(suggestions.length > 0);
      
      // Auto-populate variety suggestions for exact matches
      const exactMatch = catalog.find(item => item.name.toLowerCase() === value.toLowerCase());
      if (exactMatch) {
        const varieties = catalog
          .filter(item => item.name.toLowerCase() === value.toLowerCase())
          .map(item => item.variety)
          .filter((variety, index, arr) => arr.indexOf(variety) === index) // Remove duplicates
          .slice(0, 5);
        setVarietySuggestions(varieties);
        setShowVarietySuggestions(varieties.length > 0);
      } else {
        setShowVarietySuggestions(false);
      }
    } else {
      setShowProductSuggestions(false);
      setShowVarietySuggestions(false);
    }
  };

  // Handle variety input change with suggestions
  const handleVarietyChange = (value) => {
    setNewProduct({ ...newProduct, productVariety: value });
    
    if (value.length > 0 && newProduct.productName) {
      const suggestions = catalog
        .filter(item => 
          item.name.toLowerCase() === newProduct.productName.toLowerCase() &&
          item.variety.toLowerCase().includes(value.toLowerCase())
        )
        .map(item => item.variety)
        .slice(0, 5);
      setVarietySuggestions(suggestions);
      setShowVarietySuggestions(suggestions.length > 0);
    } else {
      setShowVarietySuggestions(false);
    }
  };

  // Handle adding new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/farmer/products', newProduct);
      if (response.data.success) {
        // Refresh products from server to get updated data
        const productsResponse = await axios.get('/api/farmer/products');
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        }
        setShowAddProduct(false);
        setNewProduct({
          productName: '',
          productVariety: '',
          quantity: '',
          price: '',
          estimatedDate: ''
        });
        setShowProductSuggestions(false);
        setShowVarietySuggestions(false);
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Error adding product');
    }
  };

  // Handle editing product
  const handleEditProduct = async (id, updatedData) => {
    try {
      const response = await axios.put(`/api/farmer/products/${id}`, updatedData);
      if (response.data.success) {
        // Refresh products from server to get updated data
        const productsResponse = await axios.get('/api/farmer/products');
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        }
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
        const response = await axios.delete(`/api/farmer/products/${id}`);
        if (response.data.success) {
          // Refresh products from server to get updated data
          const productsResponse = await axios.get('/api/farmer/products');
          if (productsResponse.data.success) {
            setProducts(productsResponse.data.data);
          }
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        setError(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  // Filter products based on search term and price range
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.productVariety?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
    labels: products.map(p => p.productName || 'Unknown Product'),
    datasets: [{
      data: products.map(p => p.quantity || 0),
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

  // Chart options with proper label colors
  const chartOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isDark ? '#fff' : '#333',
          font: { 
            weight: 'bold',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        titleColor: isDark ? '#fff' : '#333',
        bodyColor: isDark ? '#fff' : '#333',
        borderColor: isDark ? '#333' : '#e0e0e0',
        borderWidth: 1
      }
    },
    maintainAspectRatio: false
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
    <div className={`farmer-products ${isDark ? 'dark' : 'light'}`}>
      <Sidebar 
        userType="farmer" 
        onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`products-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className={`${isDark ? 'dark products-header' : 'products-header'}`}>
          <h1>My Products</h1>
          <button 
            className="add-product-btn"
            onClick={() => setShowAddProduct(true)}
          >
            <FaPlus /> Add New Product
          </button>
        </div>

        {/* Add New Product Form - Rendered Inline */}
        {showAddProduct && (
          <div className="add-product-inline-form add-product-form">
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="input-with-suggestions">
                <input
                  type="text"
                  placeholder="Product Name (e.g., Tomato, Rice, Apple)"
                  value={newProduct.productName}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  onFocus={() => newProduct.productName && setShowProductSuggestions(productSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                  required
                />
                {showProductSuggestions && (
                  <div className="suggestions-dropdown">
                    {productSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => {
                          setNewProduct({ ...newProduct, productName: suggestion, productVariety: '' });
                          setShowProductSuggestions(false);
                          
                          // Auto-show variety suggestions for selected product
                          const varieties = catalog
                            .filter(item => item.name.toLowerCase() === suggestion.toLowerCase())
                            .map(item => item.variety)
                            .filter((variety, index, arr) => arr.indexOf(variety) === index)
                            .slice(0, 5);
                          setVarietySuggestions(varieties);
                          setShowVarietySuggestions(varieties.length > 0);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="input-with-suggestions">
                <input
                  type="text"
                  placeholder="Product Variety (e.g., Cherry, Basmati, Red Delicious)"
                  value={newProduct.productVariety}
                  onChange={(e) => handleVarietyChange(e.target.value)}
                  onFocus={() => newProduct.productVariety && setShowVarietySuggestions(varietySuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowVarietySuggestions(false), 200)}
                  required
                />
                {showVarietySuggestions && (
                  <div className="suggestions-dropdown">
                    {varietySuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => {
                          setNewProduct({ ...newProduct, productVariety: suggestion });
                          setShowVarietySuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        <div className="search-section">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={`${isDark ? 'dark price-filter' : 'price-filter'}`}>
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

        {/* Show chart above products only when no search/filter is active */}
        {showChart && !searchTerm && !priceRange.min && !priceRange.max && (
          <div className={`${isDark ? 'dark chart-section' : 'chart-section'}`}>
            <h2>Product Distribution</h2>
            <div className="chart-container">
              <Pie data={chartData} options={chartOptions} />
            </div>
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
                      defaultValue={product.estimatedDate && !isNaN(new Date(product.estimatedDate)) ? new Date(product.estimatedDate).toISOString().split('T')[0] : ''}
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
                    <p><strong className={isDark ? 'text-white' : 'text-black'}>Estimated Date:</strong> {product.estimatedDate && !isNaN(new Date(product.estimatedDate)) ? new Date(product.estimatedDate).toLocaleDateString() : 'Not set'}</p>
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

        {/* Show chart below products when search/filter is active */}
        {showChart && (searchTerm || priceRange.min || priceRange.max) && (
          <div className={`${isDark ? 'dark chart-section' : 'chart-section'}`}>
            <h2>Product Distribution</h2>
            <div className="chart-container">
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
