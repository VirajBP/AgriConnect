import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
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
    Alert
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, ShoppingCart as ShoppingCartIcon, Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, Star as StarIcon, LocationOn as LocationIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar/Sidebar';
import './Market.css';
import noImage from '../../../assets/images/no-image.svg';
import { FaUser } from 'react-icons/fa';

// Define product images mapping
const productImages = {
    crops: {
        'Wheat': '/images/products/crops/wheat.jpg',
        'Rice': '/images/products/crops/rice.jpg',
        'Corn': '/images/products/crops/corn.jpg',
        'Cotton': '/images/products/crops/cotton.jpg',
        'Sugarcane': '/images/products/crops/sugarcane.jpg',
        'Soybean': '/images/products/crops/soybean.jpg',
        'Maize': '/images/products/crops/corn.jpg',
        'Spinach': '/images/products/crops/Spinach.avif',
        'Tomato': '/images/products/crops/tomato.jpg',
        'Potato': '/images/products/crops/potato.jpg',
        'Green Peppers': '/images/products/crops/greenpepper.jpg',
        'Onion':'/images/products/crops/onion.jpeg',
        'Garlic':'/images/products/crops/garlic.webp',
    },
    agriWaste: {
        'Rice Husk': '/images/products/waste/rice-husk.jpg',
        'Wheat Straw': '/images/products/waste/wheat-straw.jpg',
        'Sugarcane Bagasse': '/images/products/waste/sugarcane-bagasse.jpg'
    }
};

const Market = () => {
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
        searchQuery: ''
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState('');
    const [orderError, setOrderError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log('Fetching products from API...');
                const response = await axios.get('/consumer/market/products');
                console.log('API Response:', response.data);
                
                if (response.data.success) {
                    const productsWithCategory = response.data.data.map(product => ({
                        ...product,
                        category: product.productType === 'agriWaste' ? 'agriWaste' : 'crops'
                    }));
                    setProducts(productsWithCategory);
                    
                    if (marketType) {
                        console.log('Filtering by market type:', marketType);
                        const filtered = productsWithCategory.filter(product => product.category === marketType);
                        console.log('Filtered products:', filtered);
                        setFilteredProducts(filtered);
                    } else {
                        console.log('No market type selected, showing all products');
                        setFilteredProducts(productsWithCategory);
                    }
                    
                    // Set user location if available in the first product's farmer location
                    if (productsWithCategory.length > 0 && productsWithCategory[0].farmer?.location) {
                        setUserLocation(productsWithCategory[0].farmer.location);
                    }
                    
                    console.log('All products:', productsWithCategory);
                    console.log('Market type:', marketType);
                } else {
                    console.error('Error fetching products:', response.data.message || 'Failed to fetch products');
                    setError(response.data.message || 'Failed to fetch products');
                }
            } catch (err) {
                console.error('Error fetching products:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
                setError(err.response?.data?.message || 'Error fetching products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [marketType]);

    useEffect(() => {
        const applyFilters = () => {
            console.log('Applying filters with:', {
                products: products.length,
                marketType,
                searchQuery,
                filters
            });

            let currentProducts = marketType 
                ? products.filter(product => product.category === marketType)
                : products;

            console.log('Products after market type filter:', currentProducts.length);

            const filtered = currentProducts.filter(product => {
                const matchesSearch = !searchQuery || (
                    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.variety?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                const matchesPrice = 
                    (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
                    (!filters.maxPrice || product.price <= Number(filters.maxPrice));

                let matchesTypeSpecific = true;
                if (marketType === 'crops') {
                    matchesTypeSpecific = 
                        (!filters.organicOnly || product.organicCertified) &&
                        (!filters.quality || product.quality === filters.quality);
                } else if (marketType === 'agriWaste') {
                    matchesTypeSpecific = 
                        (!filters.moisture || product.moisture === filters.moisture) &&
                        (!filters.transportRequired || product.transportAvailable);
                }

                return matchesSearch && matchesPrice && matchesTypeSpecific;
            });

            console.log('Final filtered products:', filtered);
            setFilteredProducts(filtered);
        };

        applyFilters();
    }, [products, marketType, searchQuery, filters]);

    const handleMarketSelect = (type) => {
        console.log('Selected market type:', type);
        setMarketType(type);
        // The useEffect with marketType dependency will handle fetching/filtering
    };

    const handleSearch = () => {
        const filtered = products.filter(product => {
            const matchesSearch = !searchQuery || (
                product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.productVariety.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.farmer.location.toLowerCase().includes(searchQuery.toLowerCase())
            );

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

            return matchesSearch && matchesPrice && matchesLocation && matchesTypeSpecific;
        });

        setFilteredProducts(filtered);
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleViewDetails = (product) => {
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

    const getProductImage = (product) => {
        // First try product's own image URL
        if (product.imageUrl && product.imageUrl !== 'N/A') {
            return product.imageUrl;
        }
        
        // Then try category-specific image based on product name
        const categoryImages = productImages[product.category || 'crops'] || {};
        const productNameKey = Object.keys(categoryImages).find(
            key => product.productName.toLowerCase().includes(key.toLowerCase())
        );
        
        if (productNameKey) {
            return categoryImages[productNameKey];
        }
        
        // Return default category image
        return product.category === 'agriWaste' 
            ? '/images/products/waste/agri-waste-default.jpg'
            : '/images/products/crops/default-crop.jpg';
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

            const response = await axios.post('/consumer/orders', {
                product: selectedProduct._id,
                quantity: orderQuantity,
                farmer: selectedProduct.farmer._id
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Order placed successfully!',
                    severity: 'success'
                });
                
                // Reset order quantity
                setOrderQuantity('');
                
                // Close the current product dialog
                handleCloseDialog();
                
                // Refresh the products list
                const productsResponse = await axios.get('/consumer/market/products');
                if (productsResponse.data.success) {
                    const updatedProducts = productsResponse.data.data;
                    setProducts(updatedProducts);
                    
                    // Update filtered products based on current market type
                    if (marketType) {
                        const filtered = updatedProducts.filter(product => product.category === marketType);
                        setFilteredProducts(filtered);
                    } else {
                        setFilteredProducts(updatedProducts);
                    }
                }
            }
        } catch (error) {
            console.error('Error placing order:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error placing order',
                severity: 'error'
            });
        }
    };

    if (!marketType) {
        return (
            <div className="market-container">
                <Sidebar 
                    userType="consumer" 
                    onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
                />
                <div className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                        <Typography variant="h4" className="market-heading" gutterBottom align="center">
                            Select Market Type
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            gap: 4,
                            mt: 4,
                            px: 2,
                            flexWrap: 'wrap'
                        }}>
                            <Card 
                                className="market-type-card"
                                onClick={() => handleMarketSelect('crops')}
                                sx={{
                                    width: '100%',
                                    maxWidth: 450,
                                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                        cursor: 'pointer'
                                    }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="280"
                                    image="/images/market/crops.jpg"
                                    alt="Crops"
                                    sx={{ 
                                        objectFit: 'cover',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)'
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
                                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                        cursor: 'pointer'
                                    }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="280"
                                    image="/images/products/waste/wheat-straw.jpg"
                                    alt="Agricultural Waste"
                                    sx={{ 
                                        objectFit: 'cover',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)'
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
            <div className="market-container">
                <Sidebar userType="consumer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
                <div className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                        <CircularProgress />
                    </Box>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="market-container">
                <Sidebar userType="consumer" onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)} />
                <div className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Typography color="error" variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                        {error}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
                        Please try again later or contact support if the problem persists.
                    </Typography>
                </div>
            </div>
        );
    }

    return (
        <div className="market-container">
            <Sidebar 
                userType="consumer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    mb: 4 
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 1200,
                        mb: 2
                    }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setMarketType('')}
                            sx={{ 
                                mr: 2,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                    transform: 'translateX(-5px)'
                                }
                            }}
                        >
                            ← Back to Market Selection
                        </Button>
                    </Box>
                    <Typography variant="h4" className="market-heading" align="center" gutterBottom>
                        {marketType === 'crops' ? 'Crops Market' : 'Agricultural Waste Market'}
                    </Typography>
                </Box>

                {/* Search and Filter Section */}
                <Box sx={{ mb: 4 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={userLocation}
                                disabled
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationIcon />
                                        </InputAdornment>
                                    )
                                }}
                                helperText="Showing products from farmers in your location"
                            />
                        </Grid>
                    </Grid>
                </Box>

                {filteredProducts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No products available in your city
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Check back later for new products from local farmers
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={4} justifyContent="center">
                        {filteredProducts.map(product => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                <Card 
                                    className="product-card"
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        p: 2,
                                        maxWidth: 320,
                                        margin: '0 auto'
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={getProductImage(product)}
                                        alt={product.productName}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 2
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: 0 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Typography variant="h6" component="div" className="product-name">
                                                {product.productName}
                                            </Typography>
                                            <Chip
                                                label={`₹${product.price}/${product.unit || 'kg'}`}
                                                color="primary"
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" className="product-variety" gutterBottom>
                                            {product.variety || 'Standard Variety'}
                                        </Typography>
                                        <Box mt={2}>
                                            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gutterBottom>
                                                <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                                                {product.farmer?.location || 'Location not specified'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gutterBottom>
                                                <FaUser fontSize="small" style={{ marginRight: '8px' }} />
                                                {product.farmer?.name || 'Unknown Farmer'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Available: {product.quantity || 0} {product.unit || 'kg'}
                                            </Typography>
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
                                                backgroundColor: '#1a237e',
                                                '&:hover': {
                                                    backgroundColor: '#283593'
                                                }
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
                            borderRadius: 2,
                            maxWidth: 800
                        }
                    }}
                >
                    {selectedProduct && (
                        <>
                            <DialogTitle 
                                sx={{ 
                                    borderBottom: '1px solid #e0e0e0',
                                    p: 3
                                }}
                            >
                                <Typography variant="h5" fontWeight="600">
                                    Product Details
                                </Typography>
                            </DialogTitle>
                            <DialogContent sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <CardMedia
                                            component="img"
                                            image={getProductImage(selectedProduct)}
                                            alt={selectedProduct.productName}
                                            sx={{
                                                width: '100%',
                                                height: 300,
                                                objectFit: 'cover',
                                                borderRadius: 2,
                                                mb: 2
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box>
                                            <Typography variant="h5" gutterBottom fontWeight="600">
                                                {selectedProduct.productName}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                                {selectedProduct.variety || 'Standard Variety'}
                                            </Typography>
                                            
                                            <Box sx={{ 
                                                mt: 3,
                                                p: 2, 
                                                bgcolor: 'background.paper', 
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}>
                                                <Typography variant="h6" color="primary" gutterBottom>
                                                    ₹{selectedProduct.price}/{selectedProduct.unit || 'kg'}
                                                </Typography>
                                                <Typography variant="body1" gutterBottom>
                                                    Available Quantity: {selectedProduct.quantity || 0} {selectedProduct.unit || 'kg'}
                                                </Typography>
                                                <Box mt={2}>
                                                    <Typography variant="body2" gutterBottom>
                                                        <FaUser style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                                        Farmer: {selectedProduct.farmer?.name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="body2" gutterBottom>
                                                        <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                        Location: {selectedProduct.farmer?.location || 'Not specified'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box mt={3}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Order Quantity ({selectedProduct.unit || 'kg'})
                                                </Typography>
                                                <TextField
                                                    type="number"
                                                    fullWidth
                                                    value={orderQuantity}
                                                    onChange={(e) => {
                                                        setOrderQuantity(e.target.value);
                                                        setOrderError('');
                                                    }}
                                                    error={!!orderError}
                                                    helperText={orderError}
                                                    InputProps={{
                                                        inputProps: { 
                                                            min: 1,
                                                            max: selectedProduct.quantity 
                                                        }
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handlePlaceOrder}
                                                    disabled={!orderQuantity || orderQuantity <= 0 || orderQuantity > selectedProduct.quantity}
                                                >
                                                    Place Order
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </DialogContent>
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
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </div>
    );
};

export default Market; 