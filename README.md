# Dial A Drink Kenya

A comprehensive e-commerce platform for online alcohol delivery services in Kenya, built with KeystoneJS.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ or 16+
- MongoDB 4.4+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/dial-a-drink-kenya.git
   cd dial-a-drink-kenya
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo service mongodb start
   
   # macOS with Homebrew
   brew services start mongodb-community
   ```

5. **Run the application**
   ```bash
   # Start web application (port 4000)
   npm start
   
   # Start background workers (separate terminal)
   npm run work
   ```

6. **Access the application**
   - **Web Application**: http://localhost:4000
   - **Admin Panel**: http://localhost:4000/admin
   - **API**: http://localhost:4000/api

## 📋 Features

### Core Functionality
- **Product Management**: Comprehensive catalog with categories, brands, and variants
- **Order Processing**: End-to-end order management with state tracking
- **Payment Integration**: Multiple gateways (M-Pesa, PesaPal, CyberSource)
- **Delivery Management**: Location-based delivery with rider assignment
- **User Management**: Customer accounts and admin dashboard

### Technical Features
- **RESTful APIs**: JSON APIs for mobile and web applications
- **Real-time Notifications**: SMS, Email, and Push notifications
- **Search & Filtering**: Advanced product search with recommendations
- **Background Processing**: Automated tasks and data processing
- **Multi-tenant Support**: Different app configurations (web, mobile, rider)

## 🏗️ Architecture

Built on **KeystoneJS 4.x** with:
- **Express.js** for web server
- **MongoDB** with Mongoose ODM
- **Handlebars** templating
- **PM2** process management
- **Nginx** reverse proxy (production)

### Key Components
```
├── app.js              # Web application entry
├── app-workers.js      # Background workers
├── models/            # Data models (Mongoose)
├── routes/            # Express routes & APIs
├── helpers/           # Services & utilities
├── templates/         # Handlebars views
└── public/           # Static assets
```

## 🔧 Environment Configuration

Create a `.env` file with required variables:

```env
# Application
NODE_ENV=development
HTTP_PORT=4000
SITE_NAME=Dial A Drink Kenya
SITE_URL=http://localhost:4000

# Database
MONGODB_URI=mongodb://localhost/dialadrink

# Cloudinary (Images)
CLOUDINARY_URL=cloudinary://key:secret@cloud

# Email
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password

# Payment Gateways
MPESA_KEY=your-mpesa-key
MPESA_SECRET=your-mpesa-secret
PESAPAL_KEY=your-pesapal-key
PESAPAL_SECRET=your-pesapal-secret

# SMS Services  
AFRICASTALKING_API_KEY=your-api-key
CONTACT_PHONE_NUMBER=254723688108
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Project Overview](docs/README.md)** - Complete project documentation
- **[API Reference](docs/API.md)** - REST API documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System architecture details
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Improvements](docs/IMPROVEMENTS.md)** - Recommended enhancements

## 🚀 Deployment

### Production Deployment

1. **Server Setup**
   ```bash
   # Install Node.js, MongoDB, Nginx
   # See docs/DEPLOYMENT.md for details
   ```

2. **Environment Configuration**
   ```bash
   NODE_ENV=production
   # Configure production environment variables
   ```

3. **Process Management**
   ```bash
   # Using PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Web Server**
   ```bash
   # Configure Nginx reverse proxy
   # Setup SSL with Let's Encrypt
   ```

See [Deployment Guide](docs/DEPLOYMENT.md) for complete instructions.

## 📊 API Usage

### Authentication
```javascript
// Session-based for web apps
// API key for mobile apps
Authorization: Bearer <api_key>
```

### Common Endpoints
```javascript
// Get products
GET /api/products?query=whisky&page=1&pageSize=20

// Place order
POST /api/order
{
  "firstName": "John",
  "phoneNumber": "254712345678",
  "paymentMethod": "Cash",
  "item_id": "product-id",
  "item_pieces": 1
}

// Get user orders
GET /api/order
```

See [API Documentation](docs/API.md) for complete reference.

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start web application
npm run work       # Start background workers
npm test           # Run tests (manual testing recommended)
```

### Build System

```bash
# Asset compilation with Grunt
npx grunt          # Build all assets
npx grunt watch    # Watch for changes
```

### Code Quality

- **ESLint**: Configured with Keystone standards
- **Git Hooks**: Pre-commit validation (optional)
- **Manual Testing**: Comprehensive test scenarios

## 🔍 Monitoring

### Application Monitoring
- **PM2 Dashboard**: `pm2 monit`
- **Logs**: `/home/dialadrink/logs/`
- **Health Checks**: `/health` endpoint

### Performance Metrics
- Response times
- Order completion rates
- Payment success rates
- Notification delivery rates

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and ESLint rules
2. **Documentation**: Update docs for new features
3. **Testing**: Test thoroughly in development environment
4. **Pull Requests**: Create PRs for review

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm start  # Test web app
npm run work  # Test workers

# Commit and push
git commit -m "Add new feature"
git push origin feature/new-feature
```

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check MongoDB connection
sudo systemctl status mongodb

# Check environment variables
cat .env

# Check logs
pm2 logs  # Production
tail -f logs/error.log  # Development
```

**Database connection errors:**
```bash
# Verify MongoDB is running
mongo --eval 'db.stats()'

# Check connection string in .env
```

**Payment gateway issues:**
- Verify API credentials in environment
- Check sandbox vs production mode
- Review payment gateway logs

## 📞 Support

- **Email**: support@dialadrinkkenya.com
- **Phone**: +254 723 688 108
- **Documentation**: [Project Docs](docs/)

## 📄 License

This project is proprietary software for Dial A Drink Kenya.

---

### Running KeystoneJS in Production

When you deploy your KeystoneJS app to production, be sure to set your `ENV` environment variable to `production`.

You can do this by setting `NODE_ENV=production` in your `.env` file, which gets handled by [dotenv](https://github.com/motdotla/dotenv).

Setting your environment enables certain features (including template caching, simpler error reporting, and HTML minification) that are important in production but annoying in development.
