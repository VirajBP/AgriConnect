import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Chip,
    Divider,
    Button,
    Paper,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { LocationOn, Person, LocalShipping, Timer, Phone, Email, Warning } from '@mui/icons-material';
import axios from 'axios';
import Sidebar from '../../Sidebar/Sidebar';

// Product images mapping
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

const dummyProducts = {
    crops: [
        {
            id: 1,
            productName: 'Wheat',
            productVariety: 'Premium Quality',
            price: 2500,
            quantity: 1000,
            description: 'High-quality wheat grain suitable for premium flour production. Cultivated using modern farming techniques with optimal nutrient management.',
            harvestDate: '2025-01-15',
            availableFrom: '2025-02-01',
            farmer: {
                name: 'John Doe',
                location: 'Punjab',
                experience: '15 years',
                phone: '+91 98765 43210',
                email: 'john.doe@farmer.com'
            },
            organicCertified: true,
            quality: 'Premium',
            moisture: '12%',
            protein: '13%',
            certification: 'ISO 9001:2015',
            type: 'crops'
        },
        // ... other crops
    ],
    agriWaste: [
        {
            id: 6,
            productName: 'Rice Husk',
            productVariety: 'Processed',
            price: 800,
            quantity: 5000,
            description: 'Clean and processed rice husk suitable for biomass energy production. Low moisture content and high calorific value.',
            availableFrom: '2025-02-01',
            farmer: {
                name: 'David Clark',
                location: 'Bihar',
                experience: '10 years',
                phone: '+91 98765 43211',
                email: 'david.clark@farmer.com'
            },
            moisture: '12%',
            transportAvailable: true,
            bulkDiscount: true,
            minimumOrder: '1000 kg',
            type: 'agriWaste'
        },
        // ... other waste products
    ]
};

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
                setProduct(response.data.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                // Fallback to dummy data
                const allProducts = [...dummyProducts.crops, ...dummyProducts.agriWaste];
                const dummyProduct = allProducts.find(p => p.id === parseInt(productId));
                setProduct(dummyProduct);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleContactSeller = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handlePlaceOrder = () => {
        // Implement order placement logic here
        console.log('Placing order for quantity:', orderQuantity);
        setOpenDialog(false);
        // Navigate to orders page after placing order
        navigate('/consumer/orders');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!product) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography variant="h5">Product not found</Typography>
            </Box>
        );
    }

    const getProductImage = (product) => {
        if (product.type === 'crops' || product.type === 'agriWaste') {
            return productImages[product.type][product.productName] || 
                   (product.type === 'crops' ? '/images/market/crops.jpg' : '/images/market/agri-waste.jpeg');
        }
        return '/images/market/crops.jpg';
    };

    return (
        <div className="product-details-container" style={{ display: 'flex' }}>
            <Sidebar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, marginLeft: '240px' }}>
                <Grid container spacing={4}>
                    {/* Product Image Section */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardMedia
                                component="img"
                                height="400"
                                image={getProductImage(product)}
                                alt={product.productName}
                                sx={{ objectFit: 'cover' }}
                            />
                        </Card>
                    </Grid>

                    {/* Product Info Section */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h4">
                                    {product.productName}
                                </Typography>
                                <Typography variant="h5" color="primary">
                                    ₹{product.price}/kg
                                </Typography>
                            </Box>
                            
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                {product.productVariety}
                            </Typography>

                            <Box display="flex" gap={1} mb={2}>
                                {product.type === 'crops' && product.organicCertified && (
                                    <Chip 
                                        label="Organic Certified"
                                        color="success"
                                        size="small"
                                    />
                                )}
                                {product.quality && (
                                    <Chip 
                                        label={`${product.quality} Quality`}
                                        color="secondary"
                                        size="small"
                                    />
                                )}
                                {product.transportAvailable && (
                                    <Chip 
                                        label="Transport Available"
                                        color="info"
                                        size="small"
                                        icon={<LocalShipping />}
                                    />
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Product Details
                            </Typography>

                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell component="th" scope="row">Available Quantity</TableCell>
                                            <TableCell>{product.quantity} kg</TableCell>
                                        </TableRow>
                                        {product.moisture && (
                                            <TableRow>
                                                <TableCell component="th" scope="row">Moisture Content</TableCell>
                                                <TableCell>{product.moisture}</TableCell>
                                            </TableRow>
                                        )}
                                        {product.protein && (
                                            <TableRow>
                                                <TableCell component="th" scope="row">Protein Content</TableCell>
                                                <TableCell>{product.protein}</TableCell>
                                            </TableRow>
                                        )}
                                        {product.certification && (
                                            <TableRow>
                                                <TableCell component="th" scope="row">Certification</TableCell>
                                                <TableCell>{product.certification}</TableCell>
                                            </TableRow>
                                        )}
                                        {product.harvestDate && (
                                            <TableRow>
                                                <TableCell component="th" scope="row">Harvest Date</TableCell>
                                                <TableCell>{new Date(product.harvestDate).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell component="th" scope="row">Available From</TableCell>
                                            <TableCell>{new Date(product.availableFrom).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant="h6" gutterBottom>
                                Seller Information
                            </Typography>

                            <Box display="flex" flexDirection="column" gap={2} mb={3}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Person />
                                    <Typography>
                                        {product.farmer.name} ({product.farmer.experience} experience)
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1}>
                                    <LocationOn />
                                    <Typography>
                                        {product.farmer.location}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1}>
                                    <Phone />
                                    <Typography>
                                        {product.farmer.phone}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1}>
                                    <Email />
                                    <Typography>
                                        {product.farmer.email}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    onClick={handleContactSeller}
                                >
                                    Place Order
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Product Description Section */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Description
                            </Typography>
                            <Typography variant="body1">
                                {product.description}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Order Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog}>
                    <DialogTitle>Place Order</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                label="Quantity (kg)"
                                type="number"
                                fullWidth
                                value={orderQuantity}
                                onChange={(e) => setOrderQuantity(e.target.value)}
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                            {product.minimumOrder && (
                                <Box display="flex" alignItems="center" gap={1} mt={1} color="warning.main">
                                    <Warning fontSize="small" />
                                    <Typography variant="body2">
                                        Minimum order quantity: {product.minimumOrder}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handlePlaceOrder} variant="contained" color="primary">
                            Place Order
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
};

export default ProductDetails;
