export const dummyProducts = {
    crops: [
        {
            _id: 'c1',
            productName: 'Wheat',
            productVariety: 'Durum',
            quantity: 1000,
            price: 2500,
            image: 'crops/wheat.jpg',
            farmer: {
                name: 'Rajesh Kumar',
                location: 'Amritsar, Punjab',
                phoneNumber: '+91-9876543210'
            },
            estimatedDate: '2024-04-01',
            quality: 'Premium',
            organicCertified: true
        },
        {
            _id: 'c2',
            productName: 'Rice',
            productVariety: 'Basmati',
            quantity: 800,
            price: 4500,
            image: 'crops/rice.jpg',
            farmer: {
                name: 'Sukhwinder Singh',
                location: 'Karnal, Haryana',
                phoneNumber: '+91-9876543211'
            },
            estimatedDate: '2024-04-15',
            quality: 'Premium',
            organicCertified: false
        },
        {
            _id: 'c3',
            productName: 'Sugarcane',
            productVariety: 'Premium',
            quantity: 500,
            price: 6000,
            image: 'crops/sugarcane.jpg',
            farmer: {
                name: 'Ramesh Patel',
                location: 'Ahmedabad, Gujarat',
                phoneNumber: '+91-9876543212'
            },
            estimatedDate: '2024-05-01',
            quality: 'Standard',
            organicCertified: true
        }
    ],
    agriWaste: [
        {
            _id: 'w1',
            productName: 'Wheat Straw',
            productVariety: 'Baled',
            quantity: 2000,
            price: 400,
            image: 'waste/wheat-straw.jpg',
            farmer: {
                name: 'Harpreet Singh',
                location: 'Ludhiana, Punjab',
                phoneNumber: '+91-9876543213'
            },
            moisture: '12%',
            baleSize: '40x50x70cm',
            transportAvailable: true
        },
        {
            _id: 'w2',
            productName: 'Rice Husk',
            productVariety: 'Processed',
            quantity: 1500,
            price: 300,
            image: 'waste/rice-husk.jpg',
            farmer: {
                name: 'Manoj Yadav',
                location: 'Panipat, Haryana',
                phoneNumber: '+91-9876543214'
            },
            moisture: '10%',
            quality: 'Premium',
            transportAvailable: true
        },
        {
            _id: 'w3',
            productName: 'Sugarcane Bagasse',
            productVariety: 'Raw',
            quantity: 3000,
            price: 250,
            image: 'waste/sugarcane-bagasse.jpg',
            farmer: {
                name: 'Prakash Patil',
                location: 'Kolhapur, Maharashtra',
                phoneNumber: '+91-9876543215'
            },
            moisture: '15%',
            quality: 'Standard',
            transportAvailable: false
        }
    ]
}; 