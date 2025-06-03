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
import { Search as SearchIcon, FilterList as FilterIcon, ShoppingCart as ShoppingCartIcon, Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, Star as StarIcon, LocationOn as LocationIcon, Phone as PhoneIcon, Email as EmailIcon, Person as PersonIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar/Sidebar';
import './Market.css';
import noImage from '../../../assets/images/no-image.svg';

// Define product images mapping
const productImages = {
    crops: {
        'Wheat': '/images/products/crops/wheat.jpg',
        'Rice': '/images/products/crops/rice.jpg',
        'Corn': '/images/products/crops/corn.jpg',
        'Cotton': '/images/products/crops/cotton.jpg',
        'Sugarcane': '/images/products/crops/sugarcane.jpg',
        'Soybean': '/images/products/crops/Soyabean.jpg',
        'Maize': '/images/products/crops/corn.jpg',
        'Spinach': '/images/products/crops/Spinach.avif',
        'Tomato': '/images/products/crops/tomato.jpg',
        'Potato': '/images/products/crops/potato.jpg',
        'Green Peppers': '/images/products/crops/GreenPepper.jpg',
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
    const [cartItems, setCartItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

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
                    product.variety?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.farmer?.location?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                const matchesPrice = 
                    (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
                    (!filters.maxPrice || product.price <= Number(filters.maxPrice));

                const matchesLocation = 
                    !filters.location || 
                    product.farmer?.location?.toLowerCase() === filters.location.toLowerCase();

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

                return matchesSearch && matchesPrice && matchesLocation && matchesTypeSpecific;
            });

            console.log('Final filtered products:', filtered);
            setFilteredProducts(filtered);
        };

        applyFilters();
    }, [products, marketType, searchQuery, filters]);

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const response = await axios.get('/consumer/cart');
                if (response.data.success) {
                    setCartItems(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching cart items:', error);
            }
        };

        fetchCartItems();
    }, []);

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
            const cartResponse = await axios.post('/consumer/cart/add', {
                productId: selectedProduct._id,
                quantity: quantity
            });

            if (cartResponse.data.success) {
                // Fetch updated cart items after adding
                const response = await axios.get('/consumer/cart');
                if (response.data.success) {
                    setCartItems(response.data.data);
                }
                
                setSnackbar({
                    open: true,
                    message: 'Product added to cart successfully',
                    severity: 'success'
                });
                handleCloseDialog();
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

    const handleRemoveFromCart = async (productId) => {
        try {
            const response = await axios.delete(`/consumer/cart/remove/${productId}`);
            if (response.data.success) {
                // Update cart items after removal
                const cartResponse = await axios.get('/consumer/cart');
                if (cartResponse.data.success) {
                    setCartItems(cartResponse.data.data);
                }

                setSnackbar({
                    open: true,
                    message: 'Product removed from cart',
                    severity: 'success'
                });
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error removing from cart',
                severity: 'error'
            });
        }
    };

    const handlePlaceOrder = async (products) => {
        try {
            // Group products by farmer
            const productsByFarmer = products.reduce((acc, product) => {
                const farmerId = product.farmer._id;
                if (!acc[farmerId]) {
                    acc[farmerId] = {
                        farmerId,
                        products: [],
                        totalAmount: 0
                    };
                }
                acc[farmerId].products.push({
                    productId: product._id,
                    quantity: product.quantity,
                    pricePerUnit: product.price
                });
                acc[farmerId].totalAmount += product.quantity * product.price;
                return acc;
            }, {});

            // Create orders for each farmer
            const orderPromises = Object.values(productsByFarmer).map(({ farmerId, products, totalAmount }) => 
                axios.post('/consumer/orders/create', {
                    farmerId,
                    products,
                    totalAmount,
                    status: 'pending'
                })
            );

            await Promise.all(orderPromises);

            // Clear cart after successful order placement
            await axios.post('/consumer/cart/clear');
            setCartItems([]);
            
            setSnackbar({
                open: true,
                message: 'Orders placed successfully',
                severity: 'success'
            });
            setCartOpen(false);
        } catch (error) {
            console.error('Error placing orders:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error placing orders',
                severity: 'error'
            });
        }
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

    if (!marketType) {
        return (
            <div className="market-container">
                <Sidebar 
                    userType="consumer" 
                    onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
                />
                <div className={`market-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 4
                        }}>
                            <Typography variant="h4" className="market-heading" gutterBottom>
                                Select Market Type
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<ShoppingCartIcon />}
                                onClick={() => setCartOpen(true)}
                                sx={{ ml: 2 }}
                            >
                                Cart ({cartItems.length})
                            </Button>
                        </Box>
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

                {/* Cart Drawer */}
                <Drawer
                    anchor="right"
                    open={cartOpen}
                    onClose={() => setCartOpen(false)}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: '100%',
                            maxWidth: 400,
                            p: 2
                        }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Shopping Cart</Typography>
                        {cartItems.length === 0 ? (
                            <Typography variant="body1" color="text.secondary">
                                Your cart is empty
                            </Typography>
                        ) : (
                            <>
                                <List>
                                    {cartItems.map((item) => (
                                        <ListItem
                                            key={item._id}
                                            secondaryAction={
                                                <IconButton 
                                                    edge="end" 
                                                    aria-label="delete"
                                                    onClick={() => handleRemoveFromCart(item._id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText
                                                primary={item.productName}
                                                secondary={`${item.quantity} ${item.unit} × ₹${item.price}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Total: ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => handlePlaceOrder(cartItems)}
                                        sx={{ mt: 2 }}
                                    >
                                        Place Order
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Drawer>
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
                                            startIcon={<ShoppingCartIcon />}
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
                                            Add to Cart
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Dialog 
                    open={openDialog} 
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
                                                bgcolor: '#f5f5f5', 
                                                borderRadius: 2
                                            }}>
                                                <Typography variant="h6" color="primary" gutterBottom>
                                                    ₹{selectedProduct.price}/{selectedProduct.unit || 'kg'}
                                                </Typography>
                                                <Typography variant="body1" gutterBottom>
                                                    Available Quantity: {selectedProduct.quantity || 0} {selectedProduct.unit || 'kg'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Farmer Information
                                                </Typography>
                                                <Box sx={{ 
                                                    mt: 2,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1
                                                }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <PersonIcon fontSize="small" color="action" />
                                                        <Typography variant="body1">
                                                            {selectedProduct.farmer?.name || 'Name not available'}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <LocationIcon fontSize="small" color="action" />
                                                        <Typography variant="body1">
                                                            {selectedProduct.farmer?.location || 'Location not available'}
                                                        </Typography>
                                                    </Box>
                                                    {selectedProduct.farmer?.phoneNumber && (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <PhoneIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                {selectedProduct.farmer.phoneNumber}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {selectedProduct.farmer?.email && (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <EmailIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                {selectedProduct.farmer.email}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ mt: 3 }}>
                                                <TextField
                                                    type="number"
                                                    label="Quantity"
                                                    value={quantity}
                                                    onChange={handleQuantityChange}
                                                    inputProps={{ 
                                                        min: 1, 
                                                        max: selectedProduct.quantity || 0
                                                    }}
                                                    fullWidth
                                                    sx={{ mb: 2 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        fullWidth
                                                        startIcon={<ShoppingCartIcon />}
                                                        onClick={handleAddToCart}
                                                        disabled={!selectedProduct.quantity || selectedProduct.quantity <= 0}
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        fullWidth
                                                        onClick={() => handlePlaceOrder([{ ...selectedProduct, quantity }])}
                                                        disabled={!selectedProduct.quantity || selectedProduct.quantity <= 0}
                                                        sx={{
                                                            backgroundColor: '#1a237e',
                                                            '&:hover': {
                                                                backgroundColor: '#283593'
                                                            }
                                                        }}
                                                    >
                                                        Place Order
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
                                <Button 
                                    onClick={handleCloseDialog}
                                    variant="outlined"
                                >
                                    Close
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