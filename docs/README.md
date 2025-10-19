# Dial A Drink Kenya - Project Documentation

## Overview

Dial A Drink Kenya is a comprehensive e-commerce platform built with KeystoneJS for online alcohol delivery services in Kenya. The platform provides a complete solution for managing products, orders, payments, and deliveries with support for multiple payment gateways and delivery tracking.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Core Components](#core-components)
4. [Data Models](#data-models)
5. [API Documentation](#api-documentation)
6. [Payment Integration](#payment-integration)
7. [Deployment Guide](#deployment-guide)
8. [Development Setup](#development-setup)

## Architecture Overview

The application follows a traditional MVC architecture built on KeystoneJS (v4), which provides:

- **Content Management System**: Admin interface for managing products, orders, and users
- **RESTful APIs**: JSON APIs for mobile applications and web frontend
- **Background Workers**: Automated tasks for notifications, ETL processes, and maintenance
- **Multi-tenant Support**: Different app configurations for web, mobile, and rider applications

### Key Architectural Components

```
├── app-init.js          # Application initialization and configuration
├── app.js               # Main web application entry point
├── app-workers.js       # Background workers entry point
├── models/              # Data models and schema definitions
├── routes/              # Web routes and API endpoints
├── helpers/             # Utility classes and services
├── workers/             # Background processing tasks
├── templates/           # Handlebars templates for web views
└── public/              # Static assets (CSS, JS, images)
```

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **KeystoneJS 4.2.1** - CMS framework built on Express and MongoDB
- **MongoDB** (via Mongoose 5.13.5) - Database
- **Express.js** - Web framework
- **Handlebars** - Template engine

### Key Dependencies
- **Payment Gateways**: PesaPal, M-Pesa, CyberSource, Africa's Talking
- **Notifications**: SMS (Africa's Talking, MoveSMS), Email (Nodemailer), Push notifications (FCM)
- **Image Management**: Cloudinary
- **Caching**: Memory cache, LRU cache, Redis
- **Background Processing**: Custom worker system
- **Security**: bcrypt for password hashing, CSRF protection

## Core Components

### 1. Product Management System
- Product catalog with categories, subcategories, and brands
- Price options and inventory management
- Product search and filtering
- Related products recommendation system
- Popularity tracking and rating system

### 2. Order Management
- Shopping cart functionality
- Order placement and tracking
- Payment processing integration
- Delivery management with rider assignment
- Order state management (created, placed, dispatched, delivered, etc.)

### 3. User Management
- **AppUsers**: Admin users with role-based access
- **Clients**: Customer accounts with order history
- **Riders**: Delivery personnel with order assignment capabilities

### 4. Payment System
- Multiple payment gateway integration
- Payment state tracking
- Automatic payment notifications
- Promo code and discount system

### 5. Notification System
- SMS notifications for orders and payments
- Email notifications with templates
- Push notifications for mobile apps
- Automated notification retry system

## Data Models

### Core Models

#### Product Model
```javascript
// Key fields and relationships
{
  name: String,
  href: String,           // URL slug
  alcoholContent: Number,
  priceOptions: [ProductPriceOption],
  category: ProductCategory,
  subCategory: ProductSubCategory,
  brand: ProductBrand,
  state: 'draft|published|archived',
  onOffer: Boolean,
  isPopular: Boolean,
  inStock: Boolean,
  tags: [String],
  popularity: Number      // Tracking system for recommendations
}
```

#### Order Model
```javascript
{
  orderNumber: Number,
  state: 'created|placed|dispatched|delivered|pending|cancelled|paid',
  cart: [CartItem],
  client: Client,
  payment: {
    method: String,
    amount: Number,
    state: String,
    url: String,        // Payment gateway URL
    referenceId: String
  },
  delivery: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String,
    address: String,
    locationMeta: String  // JSON location data
  },
  promo: {
    code: String,
    discount: Number,
    discountType: String
  }
}
```

#### Client Model
```javascript
{
  firstName: String,
  lastName: String,
  phoneNumber: String,
  email: String,
  address: String,
  registrationDate: Date,
  clientIps: [String]     // Track user sessions
}
```

### Relationship Overview
- Products → Categories, Brands, Price Options
- Orders → Clients, Cart Items, Payments
- Cart Items → Products, Price Options
- Clients → Orders (one-to-many)

## API Documentation

### Base URL
```
https://dialadrinkkenya.com/api/
```

### Authentication
APIs require user authentication via session or API key. The middleware validates:
- Session-based authentication for web users
- API key authentication for mobile apps
- Role-based access control

### Core Endpoints

#### Products API (`/api/products`)

**GET /api/products**
```javascript
// Query products with pagination and search
GET /api/products?query=whisky&page=1&pageSize=20

Response:
{
  "response": "success",
  "data": [
    {
      "_id": "product-id",
      "name": "Product Name",
      "price": 1500,
      "offerPrice": 1200,
      "image": "https://cloudinary-url",
      "category": "Whisky",
      "brand": "Brand Name",
      "inStock": true,
      "ratings": 4.5,
      "options": [
        {
          "quantity": "750ml",
          "price": 1500,
          "offerPrice": 1200,
          "inStock": true
        }
      ]
    }
  ]
}
```

**GET /api/products/:query**
```javascript
// Search products by name, category, brand
GET /api/products/johnnie-walker

Response: Same as above with filtered results
```

**GET /api/products/related/:productId**
```javascript
// Get related products based on purchase history
GET /api/products/related/product-id

Response: Array of related products
```

**GET /api/products/categories**
```javascript
// Get all product categories
Response:
{
  "response": "success",
  "data": [
    {
      "_id": "category-id",
      "name": "Whisky",
      "key": "whisky",
      "menus": [...] // Navigation menu items
    }
  ]
}
```

#### Orders API (`/api/order`)

**GET /api/order**
```javascript
// Get user orders (authenticated)
GET /api/order?page=1&pageSize=10

Response:
{
  "response": "success",
  "data": [
    {
      "orderNumber": "W12345678",
      "state": "delivered",
      "orderDate": "2023-01-15T10:30:00Z",
      "total": 1695,
      "cart": [...],
      "delivery": {...},
      "payment": {...}
    }
  ]
}
```

**POST /api/order**
```javascript
// Place new order
POST /api/order
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "254712345678",
  "email": "john@example.com",
  "address": "Nairobi CBD",
  "paymentMethod": "Cash",
  "location": {
    "lat": -1.2921,
    "lng": 36.8219
  },
  "item_id": "product-id",
  "item_price": 1500,
  "item_pieces": 1
}

Response:
{
  "response": "success",
  "message": "Order placed successfully!",
  "data": {
    "orderNumber": "W12345678",
    // ... order details
  }
}
```

**GET /api/order/:orderNo**
```javascript
// Get specific order details
GET /api/order/12345678

Response: Single order object
```

#### Cart API (`/api/cart`)

**GET /api/cart**
- Get current session cart items

**POST /api/cart**
- Add item to cart

**DELETE /api/cart/:cartId**
- Remove item from cart

#### Client API (`/api/client`)

**GET /api/client**
- Get authenticated client profile

**POST /api/client**
- Update client information

### Error Responses
```javascript
{
  "response": "error",
  "message": "Error description",
  "code": "ERROR_CODE" // Optional
}
```

## Payment Integration

The platform supports multiple payment gateways:

### 1. M-Pesa Integration
```javascript
// Configuration in helpers/mpesa.js
{
  environment: "production|sandbox",
  consumerKey: process.env.MPESA_KEY,
  consumerSecret: process.env.MPESA_SECRET,
  shortCode: process.env.MPESA_SHOTCODE
}
```

### 2. PesaPal Integration
```javascript
// Configuration in helpers/PesaPal.js
{
  key: process.env.PESAPAL_KEY,
  secret: process.env.PESAPAL_SECRET,
  debug: false // in production
}
```

### 3. CyberSource Integration
- Enterprise payment gateway for card processing
- Integrated via custom helper class

### Payment Flow
1. User selects payment method during checkout
2. Order is created with payment state "Pending"
3. User is redirected to payment gateway
4. Webhook/callback updates payment state
5. Notifications sent to user and admin
6. Order state updated to "Paid"

## Deployment Guide

### Environment Variables
Create a `.env` file with required configuration:

```env
# Application
NODE_ENV=production
HTTP_PORT=4000
SITE_NAME=Dial A Drink Kenya
SITE_URL=https://dialadrinkkenya.com

# Database
MONGODB_URI=mongodb://localhost/dialadrink

# Cloudinary (Image hosting)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email Configuration
SMTP_SERVICE=Zoho
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=order@dialadrinkkenya.com
SMTP_PASS=your_password

# Payment Gateways
MPESA_KEY=your_mpesa_key
MPESA_SECRET=your_mpesa_secret
MPESA_SHOTCODE=your_shortcode

PESAPAL_KEY=your_pesapal_key
PESAPAL_SECRET=your_pesapal_secret

# SMS Services
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key

# Google Services
GOOGLE_API_KEY1=your_google_api_key

# URL Shortening
BITLY_ACCESS_TOKEN=your_bitly_token

# Contact Information
CONTACT_PHONE_NUMBER=254723688108
DEVELOPER_EMAIL=nmasuki@gmail.com
```

### Production Deployment Steps

1. **Server Setup**
   ```bash
   # Install Node.js and MongoDB
   curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   sudo apt-get install -y nodejs mongodb
   
   # Clone repository
   git clone https://github.com/your-repo/dial-a-drink-kenya.git
   cd dial-a-drink-kenya
   
   # Install dependencies
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   
   # Create database user (optional)
   mongo
   > use dialadrink
   > db.createUser({user: "dialadrink", pwd: "password", roles: ["readWrite"]})
   ```

4. **SSL Setup with Let's Encrypt**
   ```bash
   sudo apt-get install certbot
   sudo certbot certonly --webroot -w /path/to/public -d dialadrinkkenya.com
   ```

5. **Process Management with PM2**
   ```bash
   npm install -g pm2
   
   # Start main application
   pm2 start app.js --name "dialadrink-web"
   
   # Start workers
   pm2 start app-workers.js --name "dialadrink-workers"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

6. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name dialadrinkkenya.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl;
       server_name dialadrinkkenya.com;
       
       ssl_certificate /etc/letsencrypt/live/dialadrinkkenya.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/dialadrinkkenya.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### Monitoring and Maintenance

1. **Application Monitoring**
   ```bash
   # Check application status
   pm2 status
   
   # View logs
   pm2 logs dialadrink-web
   pm2 logs dialadrink-workers
   
   # Restart services
   pm2 restart all
   ```

2. **Database Backup**
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   mongodump --db dialadrink --out /backups/mongodb_$DATE
   ```

3. **Log Rotation**
   ```bash
   # Setup logrotate for PM2 logs
   pm2 install pm2-logrotate
   ```

## Development Setup

### Prerequisites
- Node.js 14+ 
- MongoDB 4+
- Git

### Local Setup Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-repo/dial-a-drink-kenya.git
   cd dial-a-drink-kenya
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure with development values
   ```

3. **Start Services**
   ```bash
   # Start MongoDB
   sudo service mongodb start
   
   # Start main application (port 4000)
   npm start
   
   # Start workers (separate terminal)
   npm run work
   ```

4. **Access Application**
   - Web Application: http://localhost:4000
   - Admin Panel: http://localhost:4000/admin
   - API: http://localhost:4000/api

### Development Tools

- **Build System**: Grunt for asset compilation
- **Code Quality**: ESLint with Keystone configuration
- **Testing**: Manual testing recommended (no automated tests currently)
- **Hot Reloading**: KeystoneJS auto-restart on file changes

### Contributing Guidelines

1. Follow existing code style and patterns
2. Test changes thoroughly in development
3. Update documentation for new features
4. Use meaningful commit messages
5. Create pull requests for review

## Additional Resources

- [KeystoneJS Documentation](https://keystonejs.com/documentation/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Handlebars Documentation](https://handlebarsjs.com/)