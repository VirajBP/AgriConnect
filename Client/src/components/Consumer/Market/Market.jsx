import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    Paper
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar/Sidebar';
import './Market.css';

// Define API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        if (marketType) {
            // Initialize with dummy data for now
            const dummyProducts = {
                crops: [
                    {
                        id: 1,
                        productName: 'Wheat',
                        productVariety: 'Premium Quality',
                        price: 2500,
                        farmer: { name: 'John Doe', location: 'Punjab' },
                        organicCertified: true,
                        quality: 'Premium'
                    },
                    {
                        id: 2,
                        productName: 'Rice',
                        productVariety: 'Basmati',
                        price: 3500,
                        farmer: { name: 'Jane Smith', location: 'Haryana' },
                        organicCertified: true,
                        quality: 'Premium'
                    },
                    {
                        id: 3,
                        productName: 'Corn',
                        productVariety: 'Sweet Corn',
                        price: 1800,
                        farmer: { name: 'Mike Brown', location: 'UP' },
                        organicCertified: false,
                        quality: 'Standard'
                    },
                    {
                        id: 4,
                        productName: 'Cotton',
                        productVariety: 'Long Staple',
                        price: 4500,
                        farmer: { name: 'Sarah Wilson', location: 'Gujarat' },
                        organicCertified: true,
                        quality: 'Premium'
                    },
                    {
                        id: 5,
                        productName: 'Sugarcane',
                        productVariety: 'Fresh',
                        price: 2000,
                        farmer: { name: 'Robert Lee', location: 'Maharashtra' },
                        organicCertified: false,
                        quality: 'Standard'
                    }
                ],
                agriWaste: [
                    {
                        id: 6,
                        productName: 'Rice Husk',
                        productVariety: 'Processed',
                        price: 800,
                        farmer: { name: 'David Clark', location: 'Bihar' },
                        moisture: '12%',
                        transportAvailable: true
                    },
                    {
                        id: 7,
                        productName: 'Wheat Straw',
                        productVariety: 'Baled',
                        price: 600,
                        farmer: { name: 'Emma Davis', location: 'MP' },
                        moisture: '10%',
                        transportAvailable: true
                    },
                    {
                        id: 8,
                        productName: 'Sugarcane Bagasse',
                        productVariety: 'Fresh',
                        price: 700,
                        farmer: { name: 'Tom Wilson', location: 'UP' },
                        moisture: '15%',
                        transportAvailable: false
                    }
                ]
            };
            
            setProducts(dummyProducts[marketType]);
            setFilteredProducts(dummyProducts[marketType]);
            setRecentListings(dummyProducts[marketType].slice(0, 3));
        }
    }, [marketType]);

    useEffect(() => {
        handleSearch();
    }, [searchQuery, filters]);

    const handleMarketSelect = async (type) => {
        setMarketType(type);
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/products/${type}`);
            setProducts(response.data.data);
            setFilteredProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
            // Fallback to dummy data handled in the first useEffect
        } finally {
            setLoading(false);
        }
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
                product.farmer.location.toLowerCase().includes(filters.location.toLowerCase());

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
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
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

    return (
        <div className="market-container">
            <Sidebar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Farmer's Market
                    </Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search products, varieties, or locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => {}}>
                                        <FilterIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{ mb: 3 }}
                    />
                    
                    {loading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredProducts.map((product) => (
                                <Grid item xs={12} sm={6} md={4} key={product.id}>
                                    <Card 
                                        elevation={2}
                                        sx={{ 
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: '0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4
                                            }
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={getProductImage(product)}
                                            alt={product.productName}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography gutterBottom variant="h6" component="h2">
                                                {product.productName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {product.productVariety}
                                            </Typography>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="h6" color="primary">
                                                    ₹{product.price}/kg
                                                </Typography>
                                                <Chip 
                                                    label={product.farmer.location}
                                                    size="small"
                                                    color="secondary"
                                                />
                                            </Box>
                                            {marketType === 'crops' && product.organicCertified && (
                                                <Chip 
                                                    label="Organic Certified"
                                                    size="small"
                                                    color="success"
                                                    sx={{ mr: 1 }}
                                                />
                                            )}
                                        </CardContent>
                                        <CardActions>
                                            <Button 
                                                size="small" 
                                                color="primary"
                                                onClick={() => handleViewDetails(product)}
                                                fullWidth
                                            >
                                                View Details
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Product Details Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    {selectedProduct && (
                        <>
                            <DialogTitle>
                                <Typography variant="h5" component="div">
                                    {selectedProduct.productName} - {selectedProduct.productVariety}
                                </Typography>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Grid container spacing={3}>
                                    {/* Product Image */}
                                    <Grid item xs={12} md={6}>
                                        <CardMedia
                                            component="img"
                                            image={getProductImage(selectedProduct)}
                                            alt={selectedProduct.productName}
                                            sx={{ 
                                                borderRadius: 1,
                                                height: 300,
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </Grid>

                                    {/* Product Details */}
                                    <Grid item xs={12} md={6}>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row">Price</TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="h6" color="primary">
                                                                ₹{selectedProduct.price}/kg
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row">Variety</TableCell>
                                                        <TableCell align="right">{selectedProduct.productVariety}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row">Farmer Name</TableCell>
                                                        <TableCell align="right">{selectedProduct.farmer.name}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row">Location</TableCell>
                                                        <TableCell align="right">
                                                            <Chip 
                                                                label={selectedProduct.farmer.location}
                                                                size="small"
                                                                color="secondary"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                    {marketType === 'crops' && (
                                                        <>
                                                            <TableRow>
                                                                <TableCell component="th" scope="row">Quality</TableCell>
                                                                <TableCell align="right">{selectedProduct.quality}</TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell component="th" scope="row">Organic Certification</TableCell>
                                                                <TableCell align="right">
                                                                    {selectedProduct.organicCertified ? (
                                                                        <Chip 
                                                                            label="Certified Organic"
                                                                            size="small"
                                                                            color="success"
                                                                        />
                                                                    ) : (
                                                                        <Chip 
                                                                            label="Conventional"
                                                                            size="small"
                                                                            color="default"
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        </>
                                                    )}
                                                    {marketType === 'agriWaste' && (
                                                        <>
                                                            <TableRow>
                                                                <TableCell component="th" scope="row">Moisture Content</TableCell>
                                                                <TableCell align="right">{selectedProduct.moisture}</TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell component="th" scope="row">Transport Available</TableCell>
                                                                <TableCell align="right">
                                                                    <Chip 
                                                                        label={selectedProduct.transportAvailable ? "Available" : "Not Available"}
                                                                        size="small"
                                                                        color={selectedProduct.transportAvailable ? "success" : "error"}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        </>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                </Grid>

                                {/* Additional Information */}
                                <Box mt={3}>
                                    <Typography variant="h6" gutterBottom>
                                        Additional Information
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {marketType === 'crops' ? (
                                            <>
                                                This {selectedProduct.productName.toLowerCase()} is of {selectedProduct.quality.toLowerCase()} quality, 
                                                sourced directly from our trusted farmer in {selectedProduct.farmer.location}. 
                                                {selectedProduct.organicCertified && " The product is certified organic, grown without synthetic pesticides or fertilizers."}
                                            </>
                                        ) : (
                                            <>
                                                This {selectedProduct.productName.toLowerCase()} is {selectedProduct.productVariety.toLowerCase()}, 
                                                available from {selectedProduct.farmer.location} with a moisture content of {selectedProduct.moisture}. 
                                                {selectedProduct.transportAvailable && " Transportation service is available for this product."}
                                            </>
                                        )}
                                    </Typography>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog}>Close</Button>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    onClick={() => navigate(`/market/product/${selectedProduct.id}`)}
                                >
                                    Place Order
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Container>
        </div>
    );
};

export default Market; 