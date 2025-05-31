export const farmerData = {
    // Sample farmer profile
    profile: {
        id: "f1",
        name: "KisanLal",
        phoneNumber: "+91 9876543210",
        location: "123 Farm Road, Agricultural District",
        joinedDate: "2023-01-15",
        rating: 4.8
    },

    // Dashboard data
    dashboard: {
        todayOrders: [
            {
                _id: "to1",
                productName: "Wheat stubble",
                quantity: 50,
                price: 1500,
                customerName: "Fresh Mart"
            },
            {
                _id: "to2",
                productName: "Rice Stubble",
                quantity: 100,
                price: 2000,
                customerName: "Green Grocers"
            }
        ],
        upcomingOrders: [
            {
                _id: "uo1",
                productName: "Onions",
                quantity: 75,
                deliveryDate: "2024-03-25",
                customerName: "Veggie Store"
            },
            {
                _id: "uo2",
                productName: "Carrots",
                quantity: 30,
                deliveryDate: "2024-03-26",
                customerName: "Fresh Foods"
            }
        ],
        totalOrders: 156,
        recentOrders: [
            {
                _id: "ro1",
                productName: "Rice Husk",
                quantity: 50,
                orderDate: "2024-03-20",
                status: "Completed",
                customerName: "Fresh Mart",
                price: 1500
            },
            {
                _id: "ro2",
                productName: "Wheat Straw",
                quantity: 100,
                orderDate: "2024-03-19",
                status: "Processing",
                customerName: "Green Grocers",
                price: 2000
            },
            {
                _id: "ro3",
                productName: "Sugarcane Bagasse",
                quantity: 75,
                orderDate: "2024-03-18",
                status: "Pending",
                customerName: "Veggie Store",
                price: 1800
            }
        ],
        inventory: [
            {
                productId: "p1",
                productName: "Tomatoes",
                quantity: 200,
                unit: "kg"
            },
            {
                productId: "p2",
                productName: "Potatoes",
                quantity: 350,
                unit: "kg"
            },
            {
                productId: "p3",
                productName: "Onions",
                quantity: 175,
                unit: "kg"
            },
            {
                productId: "p4",
                productName: "Carrots",
                quantity: 120,
                unit: "kg"
            }
        ]
    },

    // Products data
    products: [
        {
            _id: "p1",
            name: "Tomatoes",
            price: 30,
            quantity: 200,
            unit: "kg",
            description: "Fresh, ripe tomatoes",
            category: "Vegetables",
            imageUrl: "https://example.com/tomatoes.jpg"
        },
        {
            _id: "p2",
            name: "Potatoes",
            price: 20,
            quantity: 350,
            unit: "kg",
            description: "Premium quality potatoes",
            category: "Vegetables",
            imageUrl: "https://example.com/potatoes.jpg"
        }
    ],

    // Orders history
    orders: [
        {
            _id: "o1",
            orderDate: "2024-03-20",
            products: [
                {
                    productId: "p1",
                    name: "Tomatoes",
                    quantity: 50,
                    price: 1500
                }
            ],
            status: "Completed",
            customerName: "Fresh Mart",
            totalAmount: 1500
        },
        {
            _id: "o2",
            orderDate: "2024-03-19",
            products: [
                {
                    productId: "p2",
                    name: "Potatoes",
                    quantity: 100,
                    price: 2000
                }
            ],
            status: "Processing",
            customerName: "Green Grocers",
            totalAmount: 2000
        }
    ]
}; 