# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project layout

- `Client/`: React single-page app (Create React App) for farmer and consumer portals.
- `server/`: Node.js/Express API with MongoDB via Mongoose; handles auth, dashboards, orders, products, chatbot proxy, and email.
- `ml_service/`: FastAPI microservice that powers the agronomy chatbot and crop recommendation endpoints.
- Root: shared dev dependencies (Tailwind/PostCSS) and a small bcrypt helper dependency.

The main runtime stack is three processes: React client, Express API server, and the FastAPI ML service.

## Common commands

All commands are run from the `agriconnect` repo root unless otherwise noted.

### Backend API (`server/`)

From `server/`:

- Install dependencies:
  - `npm install`
- Start development server (with MongoDB running and `.env` configured):
  - `npm run dev`
- Start in production mode:
  - `npm start`

There are no real backend tests defined yet (`npm test` just prints a placeholder).

### Frontend (`Client/`)

From `Client/`:

- Install dependencies:
  - `npm install`
- Start React dev server (proxying API calls to `http://localhost:5000`):
  - `npm start`
- Create production build:
  - `npm run build`
- Run Jest tests (CRA default):
  - `npm test`
  - To focus on a single test file, start `npm test` and then use Jest's interactive prompt (e.g. filter by the test file name such as `App.test.js`).

### ML service (`ml_service/`)

Create and activate a Python virtual environment, then from `ml_service/`:

- Install dependencies:
  - `pip install -r requirements.txt`
- Run the FastAPI service locally (exposes `/chat` and `/predict` at `http://localhost:8000`):
  - `python app.py`
- Train or retrain the crop recommendation model and feature ranges:
  - `python train_model.py`
- Train the (separate) torch-based intent model for Q&A (if you want to regenerate `data/model.pth`):
  - `python train.py`

### Database migration utilities

From `server/` you can run one-off maintenance scripts against MongoDB (ensure `MONGODB_URI` is set):

- Backfill consumer `state`, `city`, and `address` fields from the older `location` field:
  - `node scripts/migrateConsumerStateCity.js`

## Environment configuration

### Backend (`server/.env`)

Key variables inferred from the code and README:

- `MONGODB_URI`: MongoDB connection string used by `server/Config/db.js` and migration scripts.
- `JWT_SECRET`: secret used in `authController.js` and `Middleware/auth.js` for signing and verifying tokens.
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP credentials for `Utils/emailService.js` (password reset OTP emails).
- `PORT`: optional; Express defaults to `5000` if not set.
- `NODE_ENV`: used in error responses to decide whether to include internal details.

### Frontend (`Client/.env`)

- `REACT_APP_API_URL`: base URL for API calls used in `Signup.jsx` and `utils/axios.js`. When unset, defaults to `http://localhost:5000`.
- `REACT_APP_OPENWEATHER_API_KEY`: API key for OpenWeatherMap used in `components/shared/Chatbot/Chatbot.jsx`.

The `Client/package.json` `proxy` field also points to `http://localhost:5000` for local development.

### ML service (`ml_service`)

- No explicit `.env` is referenced; file paths for models and data are relative to `ml_service/data/`.
- The FastAPI app binds to port `8000` inside `app.py`.

## Backend architecture (Express + MongoDB)

### Entry point and middleware

- `server/server.js`:
  - Loads CORS immediately and configures it to allow `http://localhost:3000` with credentials.
  - Sets up JSON/urlencoded parsers and a request-logging middleware that logs method, path, body, and headers.
  - Registers primary route groups **before** connecting to MongoDB:
    - `/api/auth` → `Routes/authRoutes.js`
    - `/api/farmer` → `Routes/farmerRoutes.js`
    - `/api/consumer` → `Routes/consumerRoutes.js`
    - `/api/chatbot` → `Routes/chatbotRoutes.js`
  - Lazily loads the DB connector and all models (`Farmer`, `Consumer`, `Product`, `Order`) on initialization and calls `Config/db.js` to connect using `MONGODB_URI`.
  - Central error-handling middleware normalizes validation and duplicate-key errors into JSON responses and hides stack traces unless `NODE_ENV=development`.

### Authentication and authorization

- `Middleware/auth.js`:
  - Pulls the JWT from the `Authorization: Bearer <token>` header.
  - Verifies with `JWT_SECRET` and derives both the user ID and `type` (`farmer` or `consumer`).
  - Loads the corresponding `Farmer` or `Consumer` document (without password) and attaches it as `req.user`; also sets `req.userType`.
- `Controllers/authController.js`:
  - Single controller handling both farmer and consumer flows, keyed off the request path.
  - **Register**:
    - Farmers: validates `name`, `phoneNumber` (10 digits), `password` length, `location`, `state`, `city`; enforces unique phone, validates `isValidStateCityPair`, hashes password with bcrypt, creates a `Farmer` and an associated `FarmerDashboard`, returns JWT.
    - Consumers: validates full profile (`name`, `email`, `password`, `phoneNumber`, `type`, `state`, `city`, `address`), enforces email and phone uniqueness, validates consumer `type` against a fixed enum, validates `state`/`city` pair, hashes password, creates `Consumer` + `ConsumerDashboard`, returns JWT.
  - **Login**:
    - Farmers authenticate with `phoneNumber` + `password`.
    - Consumers authenticate with `email` + `password`.
    - On farmer login, `syncFarmerInventory` recalculates dashboard stats based on inventory and orders.
    - For consumers, computes a `profileComplete` flag used by the frontend to redirect incomplete profiles to `/consumer/profile`.
  - **Password reset**:
    - `forgotPassword`, `verifyOTP`, and `resetPassword` implement an email-OTP-based reset flow.
    - `Utils/emailService.js` sends OTPs via Gmail; `rateLimiter.js` restricts OTP endpoints to 3 attempts/hour.
    - Resets are authorized via a short-lived JWT-like `resetToken` (also signed with `JWT_SECRET`).
- `Routes/authRoutes.js` wires these to `/api/auth/...`, also exposing `/states` and `/cities/:state` from `Utils/statesCitiesData.js` so the client can build location pickers.

### Domain model and dashboards

Key Mongoose models (not exhaustive):

- `Model/Farmer.js`:
  - Core farmer profile (`name`, `phoneNumber`, `password`, `location`, optional `state`/`city`).
  - `inventory` is an embedded array of items that reference `Product` by `productId` and track `quantity`, `price`, `estimatedHarvestDate`, `isAvailable`, and `qualityGrade`.
- `Model/Consumer.js`:
  - Consumer profile with required `email`, `password`, `phoneNumber`, `type` (e.g. Restaurant, Supermarket), `state`, `city`, and `address`.
- `Model/Order.js`, `Model/Product.js`, `Model/FarmerDashboard.js`, `Model/ConsumerDashboard.js` (not fully listed here) underpin the orders and analytics features.

Dashboard update responsibilities are split:

- `Utils/farmerUtils.js`:
  - `updateDashboardStats(farmerId)` queries `Farmer`, `Order`, and `FarmerDashboard` to compute:
    - `totalRevenue` from completed orders (`totalPrice`).
    - `activeListings` from inventory items that are available and have quantity > 0.
    - `completedOrders` and `pendingOrders` counts.
    - Last four months of revenue (`monthlyRevenue`) and most popular products (by order count).
  - `syncFarmerInventory(farmerId)` is a thin wrapper around `updateDashboardStats` used after logins.
- `Routes/farmerRoutes.js` and `Routes/consumerRoutes.js` each have their own helper functions that derive dashboard-level aggregates from `Order` and `Product` data (e.g. monthly spending for consumers, inventory summaries and pending orders for farmers).

### Farmer-facing API (`/api/farmer`)

Handled by `Routes/farmerRoutes.js`:

- Profile endpoints (`GET /profile`, `PUT /profile`) manage farmer profile and hashed password updates.
- Product inventory endpoints (`POST /products`, `GET /products`, `PUT /products/:id`, `DELETE /products/:id`) maintain the `Farmer.inventory` array and keep dashboards in sync via `updateDashboardStats`.
- Orders (`GET /orders`, `PUT /orders/:id/status`) retrieve and mutate farmer orders and auto-complete confirmed orders whose delivery date has passed.
- Dashboard (`GET /dashboard`) composes:
  - Aggregate stats.
  - Sorted `monthlyRevenue` array.
  - Top products.
  - Today/upcoming orders.
  - A flattened inventory view tailored for the React dashboard.

### Consumer-facing API (`/api/consumer`)

Handled by `Routes/consumerRoutes.js` and `Controllers/consumerController.js`:

- Profile and password update endpoints (`GET /profile`, `PUT /profile/update`, `PUT /profile/update-password`).
- Orders:
  - `GET /orders` returns fully populated and transformed order objects for the consumer dashboard.
  - `PUT /orders/:orderId/cancel` cancels pending orders and updates dashboard stats.
  - `POST /orders` creates new orders against a farmer's embedded inventory item and decrements the inventory, then recomputes consumer dashboard stats.
- Product discovery:
  - `GET /products` and `GET /market/products` aggregate available inventory across farmers, with options to filter by `state`/`city` or default to the consumer's location.
  - `GET /farmers/search` exposes a location-based search over farmers with available inventory and inlines summaries of their products.
- Dashboards:
  - `GET /consumer/dashboard` updates and then returns `ConsumerDashboard` stats, plus today/upcoming/recent orders and monthly spending time series.

### Chatbot and ML integration

- `Routes/chatbotRoutes.js` exposes POST `/api/chatbot` for the frontend chatbot component.
  - For each request, it:
    - Computes season/climate context from the location and current date.
    - First calls the ML service `/chat` endpoint with the raw message, location, and weather.
    - If `/chat` yields a specific Q&A response (not a generic fallback), it returns that plus the season/climate context.
    - Otherwise it falls back to `/predict`, building soil parameters from default values adjusted with weather; the ML service responds with crop recommendations and a summary message, which are relayed back to the client.
- `ml_service/app.py` implements the `/chat` and `/predict` endpoints:
  - `/chat`:
    - Tokenizes and lemmatizes the question, then scores it against `data/agricultural_qa.json` keyword entries.
    - Optionally enriches irrigation-related answers with climate-specific advice derived from the weather payload.
  - `/predict`:
    - Validates feature inputs against `data/feature_ranges.json`.
    - Scales features using the persisted `scaler` and predicts via the `crop_model.joblib` RandomForest model.
    - Returns the top 3 crops with their probabilities and a natural-language summary string.

## Frontend architecture (React SPA)

### Routing and layout

- `Client/src/App.jsx` configures `react-router-dom` routes:
  - Public routes: `/login`, `/signup/:userType`, `/forgot-password`.
  - Protected farmer routes: `/farmer/dashboard`, `/farmer/profile`, `/farmer/products`, `/farmer/orders`.
  - Protected consumer routes: `/consumer/dashboard`, `/consumer/profile`, `/consumer/orders`, `/consumer/market`.
  - The root path `/` redirects to `<Login />`.
- `components/ProtectedRoute.jsx` wraps protected routes:
  - Reads `token` and `userType` from `localStorage` and `user` from `AuthContext`.
  - Redirects unauthenticated users to `/login`.
  - Enforces route segregation: farmer routes redirect consumers to `/consumer/dashboard` and vice versa.

### Global state and theming

- `Context/AuthContext.jsx`:
  - Stores `user` and `loading` state.
  - On mount, decodes the JWT payload, then fetches the full profile from `/api/farmer/profile` or `/api/consumer/profile` using the shared `axios` instance.
  - Exposes `login(credentials, userType)`, `register(userData, userType)`, and `logout()` helpers.
  - `login`/`register` persist the token and then refresh `user` via `fetchUserData`.
- `Context/ThemeContext.jsx`:
  - Simple dark-mode toggle; persists state to `localStorage` and toggles the `dark` CSS class on the document root.
  - `resetTheme()` is called on logout to ensure a consistent light-mode default.

### HTTP clients

- `src/utils/axios.js`:
  - Primary HTTP client for authenticated app flows.
  - `baseURL` is derived from `REACT_APP_API_URL` or `http://localhost:5000` (with any trailing `/api` removed), and requests are sent with `withCredentials: true`.
  - Request interceptor attaches `Authorization: Bearer <token>` when present and logs outgoing requests.
  - Response interceptor logs responses and automatically clears the token and redirects to `/login` on `401`.
- `src/utils/axiosConfig.js`:
  - A legacy/global Axios interceptor setup that uses the `x-auth-token` header; newer components prefer the instance in `utils/axios.js`.

Be consistent: for new code, prefer using the shared `axios` instance from `utils/axios.js` so that auth headers and logging behave uniformly.

### Auth flows and dashboards

- `components/Auth/Login.jsx`:
  - Handles both farmer (phone + password) and consumer (email + password) login.
  - Calls `/api/auth/farmer/login` or `/api/auth/consumer/login` directly using Axios.
  - On success, persists `token` and `userType` in `localStorage` and:
    - For consumers with incomplete profiles, redirects to `/consumer/profile`.
    - Otherwise, redirects to the appropriate dashboard (`/farmer/dashboard` or `/consumer/dashboard`).
- `components/Auth/Signup.jsx`:
  - User-type-specific registration form; uses `REACT_APP_API_URL` directly instead of the shared Axios instance.
  - Pulls state and city options from `/api/auth/states` and `/api/auth/cities/:state`.
  - Validates phone, email, password, and location fields client-side before POSTing to `/api/auth/{userType}/register`.

Dashboards:

- `components/Farmer/FarmerDashboard.jsx`:
  - Uses the shared Axios instance to call `/api/farmer/dashboard` and `/api/farmer/orders`.
  - Assembles multiple charts (inventory distribution, monthly revenue) and cards from `dashboardData` and a filtered `pendingOrders` list.
- `components/Consumer/ConsumerDashboard.jsx`:
  - Calls `/api/consumer/consumer/dashboard` via the shared Axios instance.
  - Uses Chart.js to build a monthly spending time series, aligning server-side `monthlySpending` with front-end time filters (1M/3M/6M).
  - Renders summary cards for pending/total/completed orders, plus upcoming/today/recent orders.

### Chatbot UI

- `components/shared/Chatbot/Chatbot.jsx`:
  - Manages the floating chatbot widget rendered in farmer dashboards.
  - On mount:
    - Attempts to read browser geolocation.
    - Calls the OpenWeatherMap API directly using `REACT_APP_OPENWEATHER_API_KEY`.
    - Seeds the conversation with a welcome message and suggested questions, optionally annotated with the user's nearest city and current weather.
  - On each user query:
    - Sends `message`, optional `location`, and `weather` to the Express `/api/chatbot` endpoint.
    - Displays both the natural-language response and any structured `recommendations` as formatted text.

## How to extend this codebase safely

- For new backend routes, follow the existing pattern: add route files under `server/Routes`, use small helpers or utilities in `server/Utils`, and centralize cross-cutting concerns (auth, rate limiting, dashboards) in middleware or utility modules rather than duplicating logic in controllers.
- For new frontend flows, prefer using the `AuthContext` and `ThemeContext` providers and the shared `axios` instance to keep authentication and styling behavior consistent across pages.
- When integrating with the ML service, route all frontend calls through the Express `/api/chatbot` (or other dedicated Express endpoints) instead of calling the FastAPI app directly from the browser; that keeps cross-origin and authentication concerns centralized in the Node layer.
