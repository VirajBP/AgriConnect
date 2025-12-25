const mongoose = require('mongoose');
const Consumer = require('../Model/Consumer');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agriconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for migration');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// Migration function to add state and city fields to existing consumers
const migrateConsumerStateCity = async () => {
    try {
        console.log('Starting migration to add state and city fields to consumers...');
        
        // Find all consumers without state, city, or address fields
        const consumersToUpdate = await Consumer.find({
            $or: [
                { state: { $exists: false } },
                { city: { $exists: false } },
                { address: { $exists: false } },
                { state: null },
                { city: null },
                { address: null }
            ]
        });

        console.log(`Found ${consumersToUpdate.length} consumers to update`);

        if (consumersToUpdate.length === 0) {
            console.log('No consumers need migration');
            return;
        }

        // Update each consumer with default values
        for (const consumer of consumersToUpdate) {
            // Set default state and city based on location if possible
            let defaultState = 'Maharashtra'; // Default state
            let defaultCity = 'Mumbai'; // Default city
            
            // Try to extract state/city from existing location field
            if (consumer.location) {
                const location = consumer.location.toLowerCase();
                
                // Simple mapping based on common city names
                if (location.includes('mumbai') || location.includes('thane') || location.includes('pune')) {
                    defaultState = 'Maharashtra';
                    if (location.includes('mumbai')) defaultCity = 'Mumbai';
                    else if (location.includes('pune')) defaultCity = 'Pune';
                    else if (location.includes('thane')) defaultCity = 'Thane';
                    else defaultCity = 'Mumbai';
                } else if (location.includes('delhi')) {
                    defaultState = 'Delhi';
                    defaultCity = 'New Delhi';
                } else if (location.includes('bangalore') || location.includes('bengaluru')) {
                    defaultState = 'Karnataka';
                    defaultCity = 'Bangalore';
                } else if (location.includes('chennai')) {
                    defaultState = 'Tamil Nadu';
                    defaultCity = 'Chennai';
                } else if (location.includes('hyderabad')) {
                    defaultState = 'Telangana';
                    defaultCity = 'Hyderabad';
                } else if (location.includes('kolkata')) {
                    defaultState = 'West Bengal';
                    defaultCity = 'Kolkata';
                } else if (location.includes('ahmedabad')) {
                    defaultState = 'Gujarat';
                    defaultCity = 'Ahmedabad';
                } else if (location.includes('jaipur')) {
                    defaultState = 'Rajasthan';
                    defaultCity = 'Jaipur';
                }
            }

            await Consumer.findByIdAndUpdate(
                consumer._id,
                {
                    $set: {
                        state: consumer.state || defaultState,
                        city: consumer.city || defaultCity,
                        address: consumer.address || consumer.location || 'Address not provided'
                    }
                }
            );

            console.log(`Updated consumer ${consumer.name} (${consumer.email}) with state: ${defaultState}, city: ${defaultCity}`);
        }

        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration error:', error);
    }
};

// Run migration
const runMigration = async () => {
    await connectDB();
    await migrateConsumerStateCity();
    await mongoose.connection.close();
    console.log('Migration script completed');
    process.exit(0);
};

// Execute if run directly
if (require.main === module) {
    runMigration();
}

module.exports = { migrateConsumerStateCity };