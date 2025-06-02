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

// Define product images mapping
const productImages = {
    crops: {
        'Wheat': '/images/products/crops/wheat.jpg',
        'Rice': '/images/products/crops/rice.jpg',
        'Corn': '/images/products/crops/corn.jpg',
        'Cotton': '/images/products/crops/cotton.jpg',
        'Sugarcane': '/images/products/crops/sugarcane.jpg'
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
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        location: '',
        sortBy: 'latest',
        organicOnly: false,
        quality: '',
        moisture: '',
        transportRequired: false
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Always fetch from the main consumer market endpoint
                const response = await axios.get('/consumer/market/products');
                if (response.data.success) {
                    setProducts(response.data.data);
                    // Apply initial filtering based on marketType if already selected
                    if (marketType) {
                        setFilteredProducts(response.data.data.filter(product => product.marketType === marketType));
                    } else {
                         setFilteredProducts(response.data.data); // Show all if no type selected yet
                    }
                } else {
                    console.error('Error fetching products:', response.data.message || 'Failed to fetch products');
                    setError(response.data.message || 'Failed to fetch products');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err.response?.data?.message || 'Error fetching products');
            } finally {
                setLoading(false);
            }
        };

        // Fetch products when component mounts or marketType changes (for frontend filtering)
        fetchProducts();
    }, [marketType]); // Added marketType dependency

    useEffect(() => {
        // This useEffect is for applying search/filter changes after initial fetch
        const applyFilters = () => {
            let currentProducts = marketType 
                ? products.filter(product => product.marketType === marketType) 
                : products; // Start with all if no market type selected

            const filtered = currentProducts.filter(product => {
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

        applyFilters();
    }, [products, marketType, searchQuery, filters]);

    const handleMarketSelect = (type) => {
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
        setOpenDialog(true);
        setQuantity(1);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
    };

    const handleQuantityChange = (event) => {
        const value = parseInt(event.target.value);
        if (value > 0 && value <= selectedProduct.availableQuantity) {
            setQuantity(value);
        }
    };

    const handleAddToCart = async () => {
        try {
            const response = await axios.post('/consumer/cart/add', {
                productId: selectedProduct._id,
                quantity: quantity
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Product added to cart successfully',
                    severity: 'success'
                });
                handleCloseDialog();
            } else {
                setSnackbar({
                    open: true,
                    message: response.data.message || 'Failed to add product to cart',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error adding to cart',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getProductImage = (product) => {
        if (marketType === 'crops' || marketType === 'agriWaste') {
            return productImages[marketType][product.productName] || 
                   (marketType === 'crops' ? '/images/market/crops.jpg' : '/images/market/agri-waste.jpeg');
        }
        return '/images/market/crops.jpg';
    };

    if (!marketType) {
        return (
            <div className="market-page">
                <Sidebar />
                <Container className="market-selection-container">
                    <Grid container spacing={4} justifyContent="center">
                        <Grid item xs={12} md={6}>
                            <Card 
                                className="market-type-card"
                                onClick={() => handleMarketSelect('crops')}
                            >
                                <img 
                                    src="/images/market/crops.jpg" 
                                    alt="Crops" 
                                    className="market-type-image"
                                />
                                <CardContent>
                                    <Typography variant="h5">
                                        Crops Market
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Browse fresh crops directly from farmers
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card 
                                className="market-type-card"
                                onClick={() => handleMarketSelect('agriWaste')}
                            >
                                <img 
                                    src="/images/products/waste/wheat-straw.jpg" 
                                    alt="Agricultural Waste" 
                                    className="market-type-image"
                                />
                                <CardContent>
                                    <Typography variant="h5">
                                        Agricultural Waste Market
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Find straw, husk, and other agricultural by-products
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
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
                <Typography variant="h4" className="market-heading" gutterBottom>
                    Market
                </Typography>

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
                                placeholder="Filter by city..."
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationIcon />
                                        </InputAdornment>
                                    )
                                }}
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
                    <Grid container spacing={3}>
                        {filteredProducts.map(product => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                <Card className="product-card">
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.imageUrl || '/placeholder-product.jpg'}
                                        alt={product.productName}
                                        className="product-image"
                                    />
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Typography variant="h6" component="div" className="product-name">
                                                {product.productName}
                                            </Typography>
                                            <Chip
                                                label={`₹${product.price}/${product.unit}`}
                                                color="primary"
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" className="product-variety">
                                            {product.variety}
                                        </Typography>
                                        <Box mt={1}>
                                            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                                                <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                {product.farmer.city}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                            <Typography variant="body2" color="text.secondary">
                                                Available: {product.availableQuantity} {product.unit}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<ShoppingCartIcon />}
                                                onClick={() => handleViewDetails(product)}
                                                disabled={product.availableQuantity <= 0}
                                            >
                                                Add to Cart
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    {selectedProduct && (
                        <>
                            <DialogTitle>Product Details</DialogTitle>
                            <DialogContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <img
                                            src={selectedProduct.imageUrl || '/placeholder-product.jpg'}
                                            alt={selectedProduct.productName}
                                            className="product-detail-image"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h5" gutterBottom>
                                            {selectedProduct.productName}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                            {selectedProduct.variety}
                                        </Typography>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Rating
                                                value={selectedProduct.rating || 0}
                                                readOnly
                                                icon={<StarIcon fontSize="inherit" />}
                                            />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                ({selectedProduct.reviewCount || 0} reviews)
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" color="primary" gutterBottom>
                                            ₹{selectedProduct.price}/{selectedProduct.unit}
                                        </Typography>
                                        <Typography variant="body1" paragraph>
                                            {selectedProduct.description}
                                        </Typography>
                                        <Box mb={2}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Available Quantity
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedProduct.availableQuantity} {selectedProduct.unit}
                                            </Typography>
                                        </Box>
                                        <Box mb={2}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Farmer Information
                                            </Typography>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <LocationIcon fontSize="small" color="action" />
                                                <Typography variant="body2" ml={1}>
                                                    {selectedProduct.farmer.location}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                <Typography variant="body2" ml={1}>
                                                    {selectedProduct.farmer.phone}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center">
                                                <EmailIcon fontSize="small" color="action" />
                                                <Typography variant="body2" ml={1}>
                                                    {selectedProduct.farmer.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <TextField
                                                type="number"
                                                label="Quantity"
                                                value={quantity}
                                                onChange={handleQuantityChange}
                                                inputProps={{ min: 1, max: selectedProduct.availableQuantity }}
                                                size="small"
                                                sx={{ width: '100px' }}
                                            />
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<ShoppingCartIcon />}
                                                onClick={handleAddToCart}
                                                fullWidth
                                            >
                                                Add to Cart
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog}>Close</Button>
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