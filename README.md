# AgriConnect

AgriConnect is a modern web platform that connects farmers directly with consumers, making agricultural trade more efficient and sustainable. The platform enables direct transactions between farmers and various consumer types (restaurants, supermarkets, food processors, etc.), eliminating intermediaries and ensuring fair pricing.

---

## Features

### For Farmers

* **Product Management**: Add, update, and manage agricultural products
* **Order Management**: Track and manage incoming orders
* **Profile Management**: Maintain personal and business information
* **Dashboard**: View sales analytics and performance metrics

### For Consumers

* **Market Browse**: Browse available agricultural products
* **Order Management**: Place and track orders
* **Spending Analytics**: View spending trends and history
* **Profile Management**: Manage organization details and preferences

---

## Technology Stack

### Frontend

* React.js
* React Router
* Context API (state management)
* Material-UI
* Chart.js
* CSS3 (modern features)

### Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication
* RESTful API architecture

---

## Getting Started

### Prerequisites

* Node.js (v14 or higher)
* npm (v6 or higher)
* MongoDB (v4.4 or higher)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/agriconnect.git
cd agriconnect
```

2. **Install dependencies**

```bash
# Client
cd Client
npm install

# Server
cd ../Server
npm install
```

3. **Set up environment variables**

```bash
# Server
cp .env.example .env

# Client
cp .env.example .env
```

Edit the `.env` files with your actual values. Do not commit them to version control.

4. **Run the application**

```bash
# Backend
cd Server
npm run dev

# Frontend
cd ../Client
npm start
```

---

## Environment Setup

### Server

* Create a `.env` file using `.env.example`
* Configure database, JWT secret, and email service

### Client

* Create a `.env` file using `.env.example`
* Set API base URL and environment-specific variables

> **Note:** `.env` files are included in `.gitignore`. Never commit sensitive values.

---

## User Types

### Farmer

* Phone number–based registration
* Product listing and management
* Order fulfillment
* Sales analytics

### Consumer Types

* Restaurants
* Supermarkets
* Food Processing Companies
* Healthcare Facilities
* Event Organizers
* NGOs
* Hotels
* Catering Services
* Educational Institutions
* Corporate Cafeterias

---

## Features in Detail

### Authentication

* JWT-based authentication
* Role-based access control
* Separate login flows for farmers and consumers
* Password reset with email OTP

  * OTP expiry: 10 minutes
  * Rate limiting: 3 attempts/hour
* Password requirements:

  * Minimum 6 characters
  * Must include at least one number

### Dashboard

* Real-time analytics
* Order status tracking
* Recent activity feed
* Performance metrics

### Market

* Product search and filtering
* Category-based browsing
* Price comparison
* Order placement

### Profile Management

* User information updates
* Location settings
* Business type settings (consumers)
* Dark/Light theme preference

---

## Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import repository into Vercel
3. Select **Client** as the root directory
4. Framework Preset: Create React App
5. Build Settings:

```text
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

6. Add environment variable:

```text
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### Backend (Render)

1. Push code to GitHub
2. Create a Web Service on Render
3. Select **Server** as the root directory
4. Commands:

```text
Build Command: npm install
Start Command: npm start
```

5. Configure environment variables from `.env`
6. Set production options:

* `NODE_ENV=production`
* Proper CORS configuration
* Secure JWT secret
* Valid email service credentials

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact

**Your Name**
Email: [viraj.pradhan04@gmail.com](mailto:viraj.pradhan04@gmail.com)
GitHub: [https://github.com/VirajBP/AgriConnect](https://github.com/VirajBPP/AgriConnect)

---

## Acknowledgments

* React.js team
* Material-UI
* Chart.js
* All contributors to the project
