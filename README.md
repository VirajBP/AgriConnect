# AgriConnect

AgriConnect is a modern web platform that connects farmers directly with consumers, making agricultural trade more efficient and sustainable. The platform facilitates direct transactions between farmers and various types of consumers (restaurants, supermarkets, food processors, etc.), eliminating intermediaries and ensuring fair pricing.

## Features

### For Farmers
- **Product Management**: Add, update, and manage agricultural products
- **Order Management**: Track and manage incoming orders
- **Profile Management**: Maintain personal and business information
- **Dashboard**: View sales analytics and performance metrics

### For Consumers
- **Market Browse**: Browse available agricultural products
- **Order Management**: Place and track orders
- **Spending Analytics**: View spending trends and history
- **Profile Management**: Manage organization details and preferences

## Technology Stack

### Frontend
- React.js
- React Router for navigation
- Context API for state management
- Material-UI components
- Chart.js for analytics visualization
- CSS3 with modern features

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- RESTful API architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/agriconnect.git
cd agriconnect
```

2. Install dependencies for both client and server
```bash
# Install client dependencies
cd Client
npm install

# Install server dependencies
cd ../Server
npm install
```

3. Set up environment variables
```bash
# In the Server directory
cp env.example .env
# Edit .env with your actual values

# In the Client directory
cp env.example .env
# Edit .env with your actual values
```

4. Start the development servers
```bash
# Start the backend server (from Server directory)
npm run dev

# Start the frontend development server (from Client directory)
npm start
```

## Environment Setup

1. Server Configuration
```bash
# Create a .env.example file in the Server directory
cp .env.example .env

# Edit the .env file with your actual values
# Never commit the actual .env file to version control
```

2. Client Configuration
```bash
# Create a .env.example file in the Client directory
cp .env.example .env

# Edit the .env file with your actual values
```

3. Required Environment Variables
- Server: Check `.env.example` in the Server directory for required variables
- Client: Check `.env.example` in the Client directory for required variables

Note: Never commit actual environment values to version control. The `.env` files are included in `.gitignore`.

## User Types

### Farmer
- Registration with phone number
- Product listing and management
- Order fulfillment
- Sales tracking

### Consumer Types
- Restaurants
- Supermarkets
- Food Processing Companies
- Healthcare Facilities
- Event Organizers
- NGOs
- Hotels
- Catering Services
- Educational Institutions
- Corporate Cafeterias

## Features in Detail

### Authentication
- Secure JWT-based authentication
- Role-based access control
- Separate login flows for farmers and consumers
- Password reset functionality:
  - Email-based OTP verification for consumers
  - Email verification with 10-minute expiry
  - Rate limiting (3 attempts per hour)
  - Secure password update after verification
  - Password requirements: minimum 6 characters, must include a number

### Dashboard
- Real-time analytics
- Order status tracking
- Recent activity feed
- Performance metrics

### Market
- Product search and filtering
- Category-based browsing
- Price comparison
- Order placement

### Profile Management
- User information management
- Location settings
- Business type settings (for consumers)
- Dark/Light theme preference

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/agriconnect

## Acknowledgments

- React.js team for the amazing frontend library
- Material-UI for beautiful components
- Chart.js for data visualization
- All contributors who have helped shape this project

## Deployment

### Frontend Deployment (Vercel)

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the Client directory as the root directory
   - Framework Preset: Select "Create React App"
   - Build and Output Settings:
     ```
     Build Command: npm run build
     Output Directory: build
     Install Command: npm install
     ```
   - The `build` directory will be automatically created during deployment

3. Configure environment variables in Vercel:
   - Go to your project settings
   - Add the following environment variable:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com/api
     ```
   - Replace `your-backend-url` with your actual Render backend URL

Note: When you run `npm run build` locally or when Vercel builds your app:
1. It creates a new `build` directory
2. Optimizes all your code for production
3. Minifies files and creates static assets
4. This build directory is what gets served to users

### Backend Deployment (Render)

1. Push your code to a GitHub repository

2. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Select the Server directory as the root directory
   - Set the build command: `npm install`
   - Set the start command: `npm start`

3. Add environment variables in Render:
   - Go to your Web Service's Environment settings
   - Add all variables from your `.env` file
   - Update `MONGODB_URI` to your production MongoDB URL
   - Set a strong `JWT_SECRET`
   - Configure your production email service credentials

4. Important Production Settings:
   - Set `NODE_ENV=production`
   - Update CORS settings in your backend to allow requests from your Vercel domain
   - Ensure rate limiting is properly configured
   - Use secure email service credentials

Note: Never commit production environment values to version control. Always set them through the platform's environment variable settings.
