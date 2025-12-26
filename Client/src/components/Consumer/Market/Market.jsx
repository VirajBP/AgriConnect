import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { useTheme } from '../../../Context/ThemeContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  TextField,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Rating,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar/Sidebar';
import './Market.css';
import noImage from '../../../assets/images/no-image.svg';
import { FaUser } from 'react-icons/fa';

// Define product images mapping
const productImages = {
  crops: {
    Wheat: '/images/products/crops/wheat.jpg',
    Rice: '/images/products/crops/rice.jpg',
    Corn: '/images/products/crops/corn.jpg',
    Cotton: '/images/products/crops/cotton.jpg',
    Sugarcane: '/images/products/crops/sugarcane.jpg',
    Soybean: '/images/products/crops/soybean.jpg',
    Maize: '/images/products/crops/corn.jpg',
    Spinach: '/images/products/crops/spinach.avif',
    Tomato: '/images/products/crops/tomato.jpg',
    Potato: '/images/products/crops/potato.jpg',
    'Green Peppers': '/images/products/crops/green-pepper.jpg',
    Onion: '/images/products/crops/onion.jpeg',
    Garlic: '/images/products/crops/garlic.webp',
  },
  agriWaste: {
    'Rice Husk': '/images/products/waste/rice-husk.jpg',
    'Wheat Straw': '/images/products/waste/wheat-straw.jpg',
    'Sugarcane Bagasse': '/images/products/waste/sugarcane-bagasse.jpg',
  },
};

const Market = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [marketType, setMarketType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    searchQuery: '',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderError, setOrderError] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get('/api/consumer/location/states');
        if (response.data.success) {
          setStates(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        try {
          const response = await axios.get(
            `/api/consumer/location/cities/${selectedState}`
          );
          if (response.data.success) {
            setCities(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
      } else {
        setCities([]);
        setSelectedCity('');
      }
    };
    fetchCities();
  }, [selectedState]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setSearchLoading(true);
        console.log('Fetching products from API...');

        // Build query parameters for location-based search
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedCity) params.append('city', selectedCity);

        const response = await axios.get(
          `/api/consumer/market/products?${params.toString()}`
        );
        console.log('API Response:', response.data);

        if (response.data.success) {
          const productsWithCategory = response.data.data.map(product => ({
            ...product,
            category:
              product.productType === 'agriWaste' ? 'agriWaste' : 'crops',
          }));
          setProducts(productsWithCategory);
          setFilteredProducts(productsWithCategory);

          console.log('All products:', productsWithCategory);
          console.log('Search results:', {
            totalFarmers: response.data.totalFarmers,
            totalProducts: response.data.totalProducts,
            filters: response.data.filters,
          });
        } else {
          console.error(
            'Error fetching products:',
            response.data.message || 'Failed to fetch products'
          );
          setError(response.data.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(err.response?.data?.message || 'Error fetching products');
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    };

    if (marketType) {
      fetchProducts();
    }
  }, [marketType, selectedState, selectedCity]);

  useEffect(() => {
    const applyFilters = () => {
      console.log('Applying filters with:', {
        products: products.length,
        marketType,
        searchQuery,
        userLocation,
      });

      let currentProducts = products;

      // Filter by market type if selected
      if (marketType) {
        currentProducts = currentProducts.filter(
          product => product.category === marketType
        );
      }

      // Filter by search query
      if (searchQuery) {
        currentProducts = currentProducts.filter(
          product =>
            product.productName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            product.productVariety
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            product.farmer?.location
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        );
      }

      // Filter by location if provided (flexible matching)
      if (userLocation) {
        currentProducts = currentProducts.filter(
          product =>
            product.farmer?.location
              ?.toLowerCase()
              .includes(userLocation.toLowerCase()) ||
            product.farmer?.city
              ?.toLowerCase()
              .includes(userLocation.toLowerCase()) ||
            product.farmer?.state
              ?.toLowerCase()
              .includes(userLocation.toLowerCase())
        );
      }

      setFilteredProducts(currentProducts);
    };

    applyFilters();
  }, [products, marketType, searchQuery, userLocation]);

  const handleMarketSelect = type => {
    console.log('Selected market type:', type);
    setMarketType(type);
    // The useEffect with marketType dependency will handle fetching/filtering
  };

  const handleSearch = () => {
    const filtered = products.filter(product => {
      const matchesSearch =
        !searchQuery ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productVariety
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.farmer.location
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesPrice =
        (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
        (!filters.maxPrice || product.price <= Number(filters.maxPrice));

      const matchesLocation =
        !filters.location ||
        product.farmer.city.toLowerCase() === filters.location.toLowerCase();

      let matchesTypeSpecific = true;
      if (marketType === 'crops') {
        matchesTypeSpecific =
          (!filters.organicOnly || product.organicCertified) &&
          (!filters.quality || product.quality === filters.quality);
      } else {
        matchesTypeSpecific =
          (!filters.moisture || product.moisture === filters.moisture) &&
          (!filters.transportRequired || product.transportAvailable);
      }

      return (
        matchesSearch && matchesPrice && matchesLocation && matchesTypeSpecific
      );
    });

    setFilteredProducts(filtered);
  };

  const handleFilterChange = e => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleViewDetails = product => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getProductImage = product => {
    // First try product's own image URL
    if (product.imageUrl && product.imageUrl !== 'N/A') {
      return product.imageUrl;
    }

    // Then try category-specific image based on product name
    const categoryImages = productImages[product.category || 'crops'] || {};
    const productNameKey = Object.keys(categoryImages).find(key =>
      product.productName.toLowerCase().includes(key.toLowerCase())
    );

    if (productNameKey) {
      return categoryImages[productNameKey];
    }

    // Return default category image
    return product.category === 'agriWaste'
      ? '/images/products/waste/agri-waste-default.jpg'
      : '/images/products/crops/default-crop.jpg';
  };

  const handleStateChange = event => {
    setSelectedState(event.target.value);
    setSelectedCity(''); // Reset city when state changes
  };

  const handleCityChange = event => {
    setSelectedCity(event.target.value);
  };

  const handleLocationSearch = () => {
    // Trigger search by updating the dependencies in useEffect
    // This will automatically fetch products based on selected state/city
    if (!selectedState && !selectedCity) {
      setSnackbar({
        open: true,
        message: 'Please select at least a state or city to search',
        severity: 'warning',
      });
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!orderQuantity || orderQuantity <= 0) {
        setOrderError('Please enter a valid quantity');
        return;
      }

      if (orderQuantity > selectedProduct.quantity) {
        setOrderError('Order quantity cannot exceed available quantity');
        return;
      }

      const response = await axios.post('/api/consumer/orders', {
        product: selectedProduct._id,
        quantity: orderQuantity,
        farmer: selectedProduct.farmer._id,
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Order placed successfully!',
          severity: 'success',
        });

        // Reset order quantity
        setOrderQuantity('');

        // Close the current product dialog
        handleCloseDialog();

        // Refresh the products list with current filters
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedCity) params.append('city', selectedCity);

        const productsResponse = await axios.get(
          `/api/consumer/market/products?${params.toString()}`
        );
        if (productsResponse.data.success) {
          const updatedProducts = productsResponse.data.data.map(product => ({
            ...product,
            category:
              product.productType === 'agriWaste' ? 'agriWaste' : 'crops',
          }));
          setProducts(updatedProducts);
          setFilteredProducts(updatedProducts);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error placing order',
        severity: 'error',
      });
    }
  };

  if (!marketType) {
    return (
      <div className={`market-container ${isDarkMode ? 'dark' : ''}`}>
        <Sidebar
          userType="consumer"
          onToggle={collapsed => setIsSidebarCollapsed(collapsed)}
        />
        <div
          className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography
              variant="h4"
              className="market-heading"
              gutterBottom
              align="center"
            >
              Select Market Type
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                mt: 4,
                px: 2,
                flexWrap: 'wrap',
              }}
            >
              <Card
                className="market-type-card"
                onClick={() => handleMarketSelect('crops')}
                sx={{
                  width: '100%',
                  maxWidth: 450,
                  transition:
                    'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="280"
                  image="/images/market/crops.jpg"
                  alt="Crops"
                  sx={{
                    objectFit: 'cover',
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom fontWeight="600">
                    Crops Market
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Browse fresh crops directly from farmers
                  </Typography>
                </CardContent>
              </Card>

              <Card
                className="market-type-card"
                onClick={() => handleMarketSelect('agriWaste')}
                sx={{
                  width: '100%',
                  maxWidth: 450,
                  transition:
                    'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="280"
                  image="/images/products/waste/wheat-straw.jpg"
                  alt="Agricultural Waste"
                  sx={{
                    objectFit: 'cover',
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom fontWeight="600">
                    Agricultural Waste Market
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Find straw, husk, and other agricultural by-products
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`market-container ${isDarkMode ? 'dark' : ''}`}>
        <Sidebar
          userType="consumer"
          onToggle={collapsed => setIsSidebarCollapsed(collapsed)}
        />
        <div
          className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <CircularProgress />
          </Box>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`market-container ${isDarkMode ? 'dark' : ''}`}>
        <Sidebar
          userType="consumer"
          onToggle={collapsed => setIsSidebarCollapsed(collapsed)}
        />
        <div
          className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}
        >
          <Typography
            color="error"
            variant="h6"
            sx={{ textAlign: 'center', mt: 4 }}
          >
            {error}
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ textAlign: 'center', mt: 2 }}
          >
            Please try again later or contact support if the problem persists.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className={`market-container ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar
        userType="consumer"
        onToggle={collapsed => setIsSidebarCollapsed(collapsed)}
      />
      <div
        className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: 1200,
              mb: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setMarketType('')}
              sx={{
                mr: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateX(-5px)',
                },
              }}
            >
              ← Back to Market Selection
            </Button>
          </Box>
          <Typography
            variant="h4"
            className="market-heading"
            align="center"
            gutterBottom
          >
            {marketType === 'crops'
              ? 'Crops Market'
              : 'Agricultural Waste Market'}
          </Typography>
        </Box>

        {/* Location Search Section */}
        <Box className="search-container" sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>
                  Select State
                </InputLabel>
                <Select
                  value={selectedState}
                  onChange={handleStateChange}
                  label="Select State"
                  sx={{
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    color: isDarkMode ? '#fff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#666' : 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#90caf9' : '#1976d2',
                    },
                    '& .MuiSelect-icon': {
                      color: isDarkMode ? '#b0b0b0' : 'inherit',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All States</em>
                  </MenuItem>
                  {states.map(state => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!selectedState}>
                <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>
                  Select City
                </InputLabel>
                <Select
                  value={selectedCity}
                  onChange={handleCityChange}
                  label="Select City"
                  sx={{
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    color: isDarkMode ? '#fff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#666' : 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#90caf9' : '#1976d2',
                    },
                    '& .MuiSelect-icon': {
                      color: isDarkMode ? '#b0b0b0' : 'inherit',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Cities</em>
                  </MenuItem>
                  {cities.map(city => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#666' : 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#90caf9' : '#1976d2',
                    },
                    '& input': {
                      color: isDarkMode ? '#fff' : 'inherit',
                    },
                    '& input::placeholder': {
                      color: isDarkMode ? '#b0b0b0' : 'inherit',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Search Results Summary */}
          {(selectedState || selectedCity) && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {searchLoading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    Searching farmers...
                  </Box>
                ) : (
                  `Found ${filteredProducts.length} products from farmers in ${selectedCity ? `${selectedCity}, ` : ''}${selectedState || 'selected location'}`
                )}
              </Typography>
            </Box>
          )}
        </Box>

        {filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography
              variant="h6"
              color={isDarkMode ? '#b0b0b0' : 'textSecondary'}
              gutterBottom
            >
              {selectedState || selectedCity
                ? `No products available in ${selectedCity ? `${selectedCity}, ` : ''}${selectedState || 'selected location'}`
                : 'No products available'}
            </Typography>
            <Typography
              variant="body1"
              color={isDarkMode ? '#b0b0b0' : 'textSecondary'}
              sx={{ mb: 2 }}
            >
              {selectedState || selectedCity
                ? 'Try selecting a different state or city to find more farmers and products'
                : 'Please select a state and city to search for farmers and their products'}
            </Typography>
            {!selectedState && !selectedCity && (
              <Button
                variant="outlined"
                onClick={() => setSelectedState('Maharashtra')} // Default suggestion
                sx={{ mt: 1 }}
              >
                Browse Maharashtra Farmers
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {filteredProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <Card
                  className={`product-card ${isDarkMode ? 'dark' : ''}`}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    maxWidth: 320,
                    margin: '0 auto',
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={getProductImage(product)}
                    alt={product.productName}
                    sx={{
                      borderRadius: 2,
                      mb: 2,
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 0 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        className={`product-name ${isDarkMode ? 'dark' : ''}`}
                      >
                        {product.productName}
                      </Typography>
                      <Chip
                        label={`₹${product.price}/${product.unit || 'kg'}`}
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: isDarkMode ? '#1a237e' : undefined,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      className={`product-variety ${isDarkMode ? 'dark' : ''}`}
                      gutterBottom
                    >
                      {product.variety || 'Standard Variety'}
                    </Typography>
                    <Box mt={2}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gutterBottom
                      >
                        <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                        {product.farmer?.city && product.farmer?.state
                          ? `${product.farmer.city}, ${product.farmer.state}`
                          : product.farmer?.location ||
                            'Location not specified'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gutterBottom
                      >
                        <FaUser
                          fontSize="small"
                          style={{ marginRight: '8px' }}
                        />
                        {product.farmer?.name || 'Unknown Farmer'}
                      </Typography>
                      {product.farmer?.rating &&
                        product.farmer.rating.count > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Rating
                              name="farmer-rating"
                              value={Number(product.farmer.rating.average) || 0}
                              precision={0.5}
                              size="small"
                              readOnly
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 0.5 }}
                            >
                              ({product.farmer.rating.count})
                            </Typography>
                          </Box>
                        )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Available: {product.quantity || 0}{' '}
                        {product.unit || 'kg'}
                      </Typography>
                      {product.productRating &&
                        product.productRating.count > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 1,
                            }}
                          >
                            <Rating
                              name="product-rating"
                              value={Number(product.productRating.average) || 0}
                              precision={0.5}
                              size="small"
                              readOnly
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 0.5 }}
                            >
                              ({product.productRating.count})
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 0, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => handleViewDetails(product)}
                      disabled={!product.quantity || product.quantity <= 0}
                      sx={{
                        py: 1,
                        bgcolor: isDarkMode ? '#1a237e' : '#1a237e',
                        '&:hover': {
                          bgcolor: isDarkMode ? '#283593' : '#283593',
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxWidth: 700,
              maxHeight: '90vh',
              bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {selectedProduct && (
            <>
              <DialogTitle
                sx={{
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? '#333' : 'divider',
                  p: 2,
                  fontWeight: 700,
                  fontSize: 24,
                  bgcolor: isDarkMode ? '#181818' : 'background.default',
                  color: isDarkMode ? '#fff' : 'inherit',
                }}
              >
                Product Details
              </DialogTitle>
              <DialogContent
                sx={{
                  p: 0,
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <Grid container sx={{ flex: 1, minHeight: 0 }}>
                  <Grid item xs={12}>
                    <CardMedia
                      component="img"
                      image={getProductImage(selectedProduct)}
                      alt={selectedProduct.productName}
                      sx={{
                        width: '100%',
                        height: 280,
                        objectFit: 'cover',
                        borderRadius: 0,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        gutterBottom
                        sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                      >
                        {selectedProduct.productName}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: isDarkMode ? '#b0b0b0' : 'text.secondary',
                          mb: 1,
                        }}
                      >
                        {selectedProduct.productVariety}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 3,
                          flexWrap: 'wrap',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <PersonIcon
                            sx={{
                              color: isDarkMode ? '#b0b0b0' : 'text.secondary',
                            }}
                          />
                          <Typography
                            sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                          >
                            {selectedProduct.farmer.name}
                          </Typography>
                          {selectedProduct.farmer?.rating &&
                            selectedProduct.farmer.rating.count > 0 && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  ml: 1,
                                }}
                              >
                                <Rating
                                  name="farmer-rating-detail"
                                  value={
                                    Number(
                                      selectedProduct.farmer.rating.average
                                    ) || 0
                                  }
                                  precision={0.5}
                                  size="small"
                                  readOnly
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 0.5 }}
                                >
                                  ({selectedProduct.farmer.rating.count})
                                </Typography>
                              </Box>
                            )}
                        </Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <LocationOnIcon
                            sx={{
                              color: isDarkMode ? '#b0b0b0' : 'text.secondary',
                            }}
                          />
                          <Typography
                            sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                          >
                            {selectedProduct.farmer.city &&
                            selectedProduct.farmer.state
                              ? `${selectedProduct.farmer.city}, ${selectedProduct.farmer.state}`
                              : selectedProduct.farmer.location ||
                                'Location not specified'}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <PhoneIcon
                            sx={{
                              color: isDarkMode ? '#b0b0b0' : 'text.secondary',
                            }}
                          />
                          <Typography
                            sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                          >
                            {selectedProduct.farmer.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider
                        sx={{
                          my: 2,
                          borderColor: isDarkMode ? '#333' : 'divider',
                        }}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={7}>
                          <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Available Quantity
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                              >
                                {selectedProduct.quantity}{' '}
                                {selectedProduct.unit || 'kg'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Price per unit
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ color: isDarkMode ? '#fff' : 'inherit' }}
                              >
                                ₹{selectedProduct.price}/
                                {selectedProduct.unit || 'kg'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <Box>
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              label="Order Quantity"
                              value={orderQuantity}
                              onChange={e => setOrderQuantity(e.target.value)}
                              error={!!orderError}
                              helperText={orderError}
                              InputProps={{
                                inputProps: {
                                  min: 1,
                                  max: selectedProduct.quantity,
                                },
                                sx: {
                                  color: isDarkMode ? '#fff' : 'inherit',
                                  bgcolor: isDarkMode ? '#232323' : '#fff',
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  color: isDarkMode ? '#b0b0b0' : 'inherit',
                                },
                              }}
                              sx={{ mb: 2 }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                mt: 1,
                                mb: 1,
                                textAlign: 'right',
                                color: isDarkMode ? '#fff' : 'inherit',
                              }}
                            >
                              Total: ₹
                              {orderQuantity * selectedProduct.price || 0}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions
                sx={{
                  position: 'sticky',
                  bottom: 0,
                  bgcolor: isDarkMode ? '#181818' : 'background.paper',
                  borderTop: '1px solid',
                  borderColor: isDarkMode ? '#333' : 'divider',
                  p: 2,
                  zIndex: 2,
                }}
              >
                <Button
                  onClick={handleCloseDialog}
                  variant="outlined"
                  color="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  variant="contained"
                  color="primary"
                  sx={{ minWidth: 120 }}
                >
                  Place Order
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              bgcolor: isDarkMode ? '#1e1e1e' : undefined,
              color: isDarkMode ? '#fff' : undefined,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default Market;
