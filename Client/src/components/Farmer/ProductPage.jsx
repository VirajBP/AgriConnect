import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBox, FaUser, FaSignOutAlt, FaBars, FaEdit, 
         FaSave, FaTimes, FaDownload, FaSearch, FaSort } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import './ProductPage.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProductPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  const [products, setProducts] = useState([
    { id: 1, productName: 'Tomatoes', productVariety: 'Cherry', quantity: 100, price: 40, estimatedDate: '2024-04-01' },
    { id: 2, productName: 'Potatoes', productVariety: 'Russet', quantity: 200, price: 25, estimatedDate: '2024-04-15' },
    { id: 3, productName: 'Carrots', productVariety: 'Baby', quantity: 150, price: 30, estimatedDate: '2024-04-10' },
  ]);

  const [newProduct, setNewProduct] = useState({
    productName: '',
    productVariety: '',
    quantity: '',
    price: '',
    estimatedDate: ''
  });

  const [editFormData, setEditFormData] = useState({
    productName: '',
    productVariety: '',
    quantity: '',
    price: '',
    estimatedDate: ''
  });

  const chartData = {
    labels: products.map(product => `${product.productName} (${product.productVariety})`),
    datasets: [{
      data: products.map(product => product.quantity),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ],
      borderWidth: 1,
    }],
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProducts([...products, { ...newProduct, id: Date.now() }]);
    setNewProduct({
      productName: '',
      productVariety: '',
      quantity: '',
      price: '',
      estimatedDate: ''
    });
    setShowAddProduct(false);
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditFormData(product);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setProducts(products.map(product => 
      product.id === editingId ? editFormData : product
    ));
    setEditingId(null);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedProducts = () => {
    let filteredProducts = products.filter(product => {
      const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.productVariety.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = (!priceRange.min || product.price >= Number(priceRange.min)) &&
                          (!priceRange.max || product.price <= Number(priceRange.max));
      return matchesSearch && matchesPrice;
    });

    if (sortConfig.key) {
      filteredProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredProducts;
  };

  const downloadCSV = () => {
    const headers = ['Product Name', 'Variety', 'Quantity', 'Price', 'Available From'];
    const csvData = getFilteredAndSortedProducts().map(product => [
      product.productName,
      product.productVariety,
      product.quantity,
      product.price,
      product.estimatedDate
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          <FaBars />
        </div>
        <div className="sidebar-header">
          <h2>FarmConnect</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/farmer/dashboard" className="nav-link">
            <FaHome /> <span>Dashboard</span>
          </Link>
          <Link to="/farmer/products" className="nav-link active">
            <FaBox /> <span>Products</span>
          </Link>
          <Link to="/farmer/profile" className="nav-link">
            <FaUser /> <span>Profile</span>
          </Link>
          <Link to="/login" className="nav-link logout">
            <FaSignOutAlt /> <span>Logout</span>
          </Link>
        </nav>
      </div>

      <div className={`main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-header">
          <h1>Products</h1>
          <div className="header-actions">
            <button className="download-btn" onClick={downloadCSV}>
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        <div className="content-grid">
          {/* Add Product Section */}
          <div className="section-card add-product-section">
            <h2>Add New Product</h2>
            <button 
              className="add-product-button"
              onClick={() => setShowAddProduct(!showAddProduct)}
            >
              {showAddProduct ? 'Cancel' : 'Add New Product'}
            </button>

            {showAddProduct && (
              <form className="add-product-form" onSubmit={handleAddProduct}>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Product Variety"
                    value={newProduct.productVariety}
                    onChange={(e) => setNewProduct({...newProduct, productVariety: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity (kg)"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price per kg (₹)"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Estimated Date of Availability"
                    value={newProduct.estimatedDate}
                    onChange={(e) => setNewProduct({...newProduct, estimatedDate: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="submit-button">Add Product</button>
              </form>
            )}
          </div>

          {/* Chart Section */}
          <div className="section-card chart-section">
            <h2>Product Distribution</h2>
            <div className="chart-container">
              <Pie data={chartData} options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }} />
            </div>
          </div>

          {/* Products List Section */}
          <div className="section-card products-list-section">
            <h2>Manage Products</h2>
            <div className="search-filter-bar">
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
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>

            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('productName')}>
                      Product Name <FaSort />
                    </th>
                    <th onClick={() => handleSort('productVariety')}>
                      Variety <FaSort />
                    </th>
                    <th onClick={() => handleSort('quantity')}>
                      Quantity (kg) <FaSort />
                    </th>
                    <th onClick={() => handleSort('price')}>
                      Price (₹/kg) <FaSort />
                    </th>
                    <th onClick={() => handleSort('estimatedDate')}>
                      Available From <FaSort />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAndSortedProducts().map((product, index) => (
                    <tr key={product.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                      {editingId === product.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              name="productName"
                              value={editFormData.productName}
                              onChange={handleEditFormChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="productVariety"
                              value={editFormData.productVariety}
                              onChange={handleEditFormChange}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="quantity"
                              value={editFormData.quantity}
                              onChange={handleEditFormChange}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="price"
                              value={editFormData.price}
                              onChange={handleEditFormChange}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              name="estimatedDate"
                              value={editFormData.estimatedDate}
                              onChange={handleEditFormChange}
                            />
                          </td>
                          <td>
                            <button className="save-button" onClick={handleEditSubmit}>
                              <FaSave />
                            </button>
                            <button className="cancel-button" onClick={() => setEditingId(null)}>
                              <FaTimes />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{product.productName}</td>
                          <td>{product.productVariety}</td>
                          <td>{product.quantity}</td>
                          <td>₹{product.price}</td>
                          <td>{new Date(product.estimatedDate).toLocaleDateString()}</td>
                          <td>
                            <button className="edit-button" onClick={() => handleEditClick(product)}>
                              <FaEdit />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;