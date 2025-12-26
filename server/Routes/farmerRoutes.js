const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Farmer = require('../Model/Farmer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const FarmerDashboard = require('../Model/FarmerDashboard');
const { updateDashboardStats } = require('../Utils/farmerUtils');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get farmer profile with active listings count
router.get('/profile', auth, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id).select('-password');
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // Fetch dashboard stats to get active listings count
    const dashboard = await FarmerDashboard.findOne({ farmerId: req.user.id });
    const activeListingsCount = dashboard ? dashboard.stats.activeListings : 0;

    res.json({
      success: true,
      data: { ...farmer.toObject(), activeListings: activeListingsCount },
    });
  } catch (error) {
    console.error('Error fetching farmer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
});

// Update farmer profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'name',
      'phoneNumber',
      'location',
      'password',
      'state',
      'city',
    ];
    const isValidOperation = updates.every(update =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid updates!' });
    }

    const farmer = await Farmer.findById(req.user.id);

    if (!farmer) {
      return res
        .status(404)
        .json({ success: false, message: 'Farmer not found' });
    }

    // Handle password update separately
    if (req.body.password) {
      const salt = await bcrypt.genSalt(12);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    updates.forEach(update => {
      farmer[update] = req.body[update];
    });
    await farmer.save();

    // If location is updated, consider if product locations need sync (depends on schema)
    // For now, assuming product location is separate or derived.

    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating farmer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
});

// Add a new product to farmer's inventory
router.post('/products', auth, async (req, res) => {
  try {
    const { productName, productVariety, quantity, price, estimatedDate } =
      req.body;

    // Find or create product in catalog
    let catalogProduct = await Product.findOne({
      name: productName,
      variety: productVariety,
    });

    if (!catalogProduct) {
      catalogProduct = new Product({
        name: productName,
        variety: productVariety,
        category: 'Others', // Default category
      });
      await catalogProduct.save();
    }

    // Add to farmer's inventory
    const farmer = await Farmer.findById(req.user.id);
    farmer.inventory.push({
      productId: catalogProduct._id,
      quantity,
      price,
      estimatedHarvestDate: new Date(estimatedDate),
      isAvailable: true,
      qualityGrade: 'A',
    });
    await farmer.save();

    // Update dashboard stats
    await updateDashboardStats(req.user.id);

    res.status(201).json({
      success: true,
      data: {
        _id: farmer.inventory[farmer.inventory.length - 1]._id,
        productName: catalogProduct.name,
        productVariety: catalogProduct.variety,
        quantity,
        price,
        estimatedDate,
      },
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding product',
    });
  }
});

// Get product catalog (no auth required - it's reference data)
router.get('/catalog', async (req, res) => {
  try {
    const products = await Product.find({}).select(
      'name variety category image description'
    );
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching product catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product catalog',
    });
  }
});

// Get all products of a farmer from inventory
router.get('/products', auth, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id).populate(
      'inventory.productId',
      'name variety category image'
    );

    const products = farmer.inventory.map(item => ({
      _id: item._id,
      productName: item.productId.name,
      productVariety: item.productId.variety,
      category: item.productId.category,
      quantity: item.quantity,
      price: item.price,
      estimatedDate: item.estimatedHarvestDate,
      isAvailable: item.isAvailable,
      qualityGrade: item.qualityGrade,
      image: item.productId.image,
    }));

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
    });
  }
});

// Get all orders for a farmer
router.get('/orders', auth, async (req, res) => {
  try {
    // console.log('Fetching orders for farmer:', req.user.id);

    const orders = await Order.find({ farmer: req.user.id })
      .populate({
        path: 'consumer',
        select: 'name rating',
      })
      .sort({ createdAt: -1 });

    // console.log('Raw orders data:', JSON.stringify(orders, null, 2));

    // Auto-complete confirmed orders whose delivery date has passed
    const now = new Date();
    await Order.updateMany(
      { farmer: req.user.id, status: 'confirmed', deliveryDate: { $lt: now } },
      { $set: { status: 'completed' } }
    );

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => {
      const formatDate = date => {
        if (!date) return '';
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return '';
          return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        } catch (e) {
          console.error('Error formatting date:', e);
          return '';
        }
      };

      // Ensure all fields are properly populated with actual values
      const orderData = {
        _id: order._id,
        orderId: order.orderId ? `#${order.orderId}` : '',
        product: order.productName || '',
        quantity: order.quantity ? `${order.quantity} kg` : '',
        price: order.totalPrice ? `₹${order.totalPrice}` : '',
        customer: order.consumer?.name || '',
        orderDate: formatDate(order.orderDate || order.createdAt),
        deliveryDate: formatDate(order.deliveryDate),
        status: order.status || 'pending',
        // Ratings for transparency
        farmerRating: order.farmerRating || null,
        consumerRating: order.consumerRating || null,
        consumerRatingSummary: order.consumer?.rating || {
          average: 0,
          count: 0,
        },
      };

      // Log the transformed order for debugging
      // console.log('Transformed order:', orderData);

      return orderData;
    });

    // console.log('All transformed orders:', JSON.stringify(transformedOrders, null, 2));

    res.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error('Error fetching orders:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message,
    });
  }
});

// Get farmer dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    // console.log('Fetching dashboard for user:', req.user.id);

    const farmer = await Farmer.findById(req.user.id);
    if (!farmer) {
      // console.log('Farmer not found for ID:', req.user.id);
      return res
        .status(404)
        .json({ success: false, message: 'Farmer not found' });
    }

    // Update dashboard stats before fetching
    await updateDashboardStats(req.user.id);

    // Get dashboard data
    const dashboard = await FarmerDashboard.findOne({
      farmerId: req.user.id,
    }).populate({
      path: 'popularProducts',
      select: 'productName price quantity',
    });

    if (!dashboard) {
      // console.log('Dashboard data not found for farmer ID:', req.user.id);
      return res
        .status(404)
        .json({ success: false, message: 'Dashboard data not found' });
    }

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.find({
      farmer: req.user.id,
      createdAt: { $gte: today },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('consumer', 'name')
      .populate('product', 'productName');

    // Get upcoming orders
    const upcomingOrders = await Order.find({
      farmer: req.user.id,
      deliveryDate: { $gt: today },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('consumer', 'name')
      .populate('product', 'productName');

    // Get inventory from farmer document
    const farmerWithInventory = await Farmer.findById(req.user.id).populate(
      'inventory.productId',
      'name variety category'
    );
    const inventory = farmerWithInventory.inventory.map(item => ({
      _id: item._id,
      productName: item.productId.name,
      productVariety: item.productId.variety,
      quantity: item.quantity,
      price: item.price,
    }));

    // Transform orders to handle both old and new formats
    const transformOrder = order => {
      return {
        _id: order._id,
        productName:
          order.productName || order.product?.name || 'Product Removed',
        quantity: order.quantity,
        deliveryDate: order.deliveryDate,
        customerName: order.consumer?.name || 'Customer Unavailable',
      };
    };

    // Ensure monthlyRevenue is sorted by date
    const sortedMonthlyRevenue = [...(dashboard.monthlyRevenue || [])].sort(
      (a, b) => {
        return new Date(a.month) - new Date(b.month);
      }
    );

    // console.log('Dashboard data fetched successfully:', {
    //     stats: dashboard.stats,
    //     monthlyRevenue: sortedMonthlyRevenue,
    //     popularProducts: dashboard.popularProducts,
    //     todayOrdersCount: todayOrders.length,
    //     upcomingOrdersCount: upcomingOrders.length,
    //     inventoryCount: inventory.length
    // });

    res.json({
      success: true,
      data: {
        stats: dashboard.stats,
        monthlyRevenue: sortedMonthlyRevenue,
        popularProducts: dashboard.popularProducts || [],
        todayOrders: todayOrders.map(transformOrder),
        upcomingOrders: upcomingOrders.map(transformOrder),
        inventory,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update a product in farmer's inventory
router.put('/products/:id', auth, async (req, res) => {
  try {
    const {
      productName,
      productVariety,
      quantity,
      price,
      estimatedDate,
      isAvailable,
      qualityGrade,
    } = req.body;

    const farmer = await Farmer.findById(req.user.id);
    const inventoryItem = farmer.inventory.id(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in inventory',
      });
    }

    // Handle product name/variety updates
    if (productName || productVariety) {
      // Find or create product in catalog
      let catalogProduct = await Product.findOne({
        name: productName || inventoryItem.productId.name,
        variety: productVariety || inventoryItem.productId.variety,
      });

      if (!catalogProduct) {
        catalogProduct = new Product({
          name: productName,
          variety: productVariety,
          category: 'Others',
        });
        await catalogProduct.save();
      }

      inventoryItem.productId = catalogProduct._id;
    }

    // Update inventory item fields
    if (quantity !== undefined) inventoryItem.quantity = quantity;
    if (price !== undefined) inventoryItem.price = price;
    if (estimatedDate)
      inventoryItem.estimatedHarvestDate = new Date(estimatedDate);
    if (isAvailable !== undefined) inventoryItem.isAvailable = isAvailable;
    if (qualityGrade) inventoryItem.qualityGrade = qualityGrade;

    await farmer.save();

    // Update dashboard stats
    await updateDashboardStats(req.user.id);

    // Return properly formatted data
    const updatedFarmer = await Farmer.findById(req.user.id).populate(
      'inventory.productId',
      'name variety category'
    );
    const updatedItem = updatedFarmer.inventory.id(req.params.id);

    res.json({
      success: true,
      data: {
        _id: updatedItem._id,
        productName: updatedItem.productId.name,
        productVariety: updatedItem.productId.variety,
        category: updatedItem.productId.category,
        quantity: updatedItem.quantity,
        price: updatedItem.price,
        estimatedDate: updatedItem.estimatedHarvestDate,
        isAvailable: updatedItem.isAvailable,
        qualityGrade: updatedItem.qualityGrade,
      },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
    });
  }
});

// Delete a product from farmer's inventory
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id);
    const inventoryItem = farmer.inventory.id(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in inventory',
      });
    }

    // Remove from inventory
    inventoryItem.deleteOne();
    await farmer.save();

    // Update dashboard stats
    await updateDashboardStats(req.user.id);

    res.json({
      success: true,
      message: 'Product removed from inventory successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
    });
  }
});

// Update order status
router.put('/orders/:id/status', auth, async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    // Validate status
    const validStatuses = [
      'pending',
      'confirmed',
      'rejected',
      'cancelled',
      'completed',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Convert order ID to ObjectId
    let orderId;
    try {
      orderId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findOne({ _id: orderId, farmer: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order can be updated
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update order status. Current status is ${order.status}`,
      });
    }

    // Validate delivery date if status is being set to confirmed
    if (status === 'confirmed') {
      if (!deliveryDate) {
        return res.status(400).json({
          success: false,
          message: 'Delivery date is required when confirming an order',
        });
      }

      const deliveryDateObj = new Date(deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deliveryDateObj < today) {
        return res.status(400).json({
          success: false,
          message: 'Delivery date cannot be in the past',
        });
      }
    }

    // Update order status and delivery date
    order.status = status;
    order.deliveryDate = status === 'confirmed' ? deliveryDate : null;

    // If productName is missing, set a default value to avoid validation error
    if (!order.productName) {
      order.productName = 'Product Name Not Available';
    }

    await order.save();

    // Try to update dashboard stats, but don't fail if it doesn't work
    try {
      await updateDashboardStats(req.user.id);
    } catch (dashboardError) {
      console.error('Error updating dashboard stats:', dashboardError);
      // Continue with the response even if dashboard update fails
    }

    // Return the updated order with populated fields
    const updatedOrder = await Order.findById(order._id).populate(
      'consumer',
      'name'
    );

    // Transform the order to match frontend expectations
    const transformedOrder = {
      _id: updatedOrder._id,
      orderId: updatedOrder.orderId || updatedOrder._id.toString().slice(-6),
      product: updatedOrder.productName || 'Unknown Product',
      quantity: updatedOrder.quantity || 0,
      price: updatedOrder.totalPrice || 0,
      customer: updatedOrder.consumer?.name || 'Unknown Customer',
      status: updatedOrder.status,
      orderDate: updatedOrder.orderDate,
      deliveryDate: updatedOrder.deliveryDate,
    };

    res.json({
      success: true,
      data: transformedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
    });
  }
});

// Allow farmers to rate consumers for completed orders
router.post('/orders/:orderId/rate', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { value, comment } = req.body;

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating value must be between 1 and 5',
      });
    }

    // Find the completed order belonging to this farmer
    const order = await Order.findOne({
      _id: orderId,
      farmer: req.user.id,
      status: 'completed',
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Completed order not found for this farmer',
      });
    }

    // Prevent double rating
    if (order.farmerRating && order.farmerRating.value) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this order',
      });
    }

    // Save rating on order
    order.farmerRating = {
      value,
      comment: comment || '',
      ratedAt: new Date(),
    };
    await order.save();

    // Update consumer aggregate rating
    const Consumer = require('../Model/Consumer');
    const consumer = await Consumer.findById(order.consumer);
    if (consumer) {
      const prevAvg = consumer.rating?.average || 0;
      const prevCount = consumer.rating?.count || 0;

      const newCount = prevCount + 1;
      const newAvg = (prevAvg * prevCount + value) / newCount;

      consumer.rating = {
        average: newAvg,
        count: newCount,
      };
      await consumer.save();
    }

    return res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        farmerRating: order.farmerRating,
        consumerRatingSummary: consumer ? consumer.rating : null,
      },
    });
  } catch (error) {
    console.error('Error rating consumer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting rating',
    });
  }
});

// Get product ratings for farmer
router.get('/product-ratings', auth, async (req, res) => {
  try {
    const ProductRating = require('../Model/ProductRating');
    const productRatings = await ProductRating.find({ farmer: req.user.id })
      .populate('product', 'name variety')
      .sort({ 'rating.average': -1 });

    res.json({
      success: true,
      data: productRatings,
    });
  } catch (error) {
    console.error('Error fetching product ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product ratings',
    });
  }
});

// Upload profile photo
router.post('/profile/upload-photo', auth, async (req, res) => {
  try {
    const { photoData } = req.body;

    if (!photoData) {
      return res.status(400).json({
        success: false,
        message: 'Photo data is required',
      });
    }

    // Update farmer profile with photo data (base64)
    const farmer = await Farmer.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoData },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: farmer,
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading photo',
    });
  }
});

module.exports = router;
