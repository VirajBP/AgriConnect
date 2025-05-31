export const consumerData = {
    // Sample consumer profile
    profile: {
        id: "c1",
        name: "Jethalal Gada",
        email: "gadaelectronics@example.com",
        phoneNumber: "+91 9876543211",
        address: "123 Main St, Mumbai",
        joinedDate: "2024-01-01"
    },

    // Dashboard data
    dashboard: {
        recentOrders: [
            {
                _id: "ro1",
                orderDate: "2024-03-20",
                items: [
                    {
                        productName: "Wheat Husk",
                        quantity: 5,
                        price: 150
                    },
                    {
                        productName: "Rice Straw",
                        quantity: 3,
                        price: 60
                    }
                ],
                status: "Delivered",
                totalAmount: 210,
                farmerName: "KisanLal"
            },
            {
                _id: "ro2",
                orderDate: "2024-03-18",
                items: [
                    {
                        productName: "Grain Stubble",
                        quantity: 4,
                        price: 100
                    }
                ],
                status: "Processing",
                totalAmount: 100,
                farmerName: "Rukmani Devi"
            }
        ],
        orderStats: {
            totalOrders: 15,
            pendingOrders: 2,
            deliveredOrders: 13
        }
    },

    // Order history
    orders: [
        {
            _id: "o1",
            orderDate: "2024-03-20",
            items: [
                {
                    productName: "Tomatoes",
                    quantity: 5,
                    price: 150
                },
                {
                    productName: "Potatoes",
                    quantity: 3,
                    price: 60
                }
            ],
            status: "Delivered",
            totalAmount: 210,
            farmerName: "KisanLal",
            deliveryAddress: "123 Main St, Bangalore",
            paymentMethod: "Online Payment"
        },
        {
            _id: "o2",
            orderDate: "2024-03-18",
            items: [
                {
                    productName: "Onions",
                    quantity: 4,
                    price: 100
                }
            ],
            status: "Processing",
            totalAmount: 100,
            farmerName: "Rukmani Devi",
            deliveryAddress: "123 Main St, Bangalore",
            paymentMethod: "Cash on Delivery"
        }
    ],

    // Cart data
    cart: {
        items: [
            {
                productId: "p1",
                productName: "Carrots",
                quantity: 2,
                price: 40,
                farmerName: "KisanLal"
            },
            {
                productId: "p2",
                productName: "Cabbage",
                quantity: 1,
                price: 30,
                farmerName: "Rukmani Devi"
            }
        ],
        totalAmount: 70
    }
}; 