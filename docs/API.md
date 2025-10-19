# API Reference Guide

## Overview
This document provides detailed API reference for the Dial A Drink Kenya platform. All APIs are RESTful and return JSON responses.

## Base Configuration

**Base URL:** `https://dialadrinkkenya.com/api/`  
**Content-Type:** `application/json`  
**Authentication:** Session-based or API key

## Authentication & Authorization

### Session Authentication
For web applications, authentication is handled via Express sessions:
```javascript
// Login required for protected endpoints
req.session.user // Contains authenticated user
```

### API Key Authentication
For mobile applications:
```javascript
// Header required
Authorization: Bearer <api_key>
// Or query parameter
?api_key=<api_key>
```

### User Roles
- **AppUser**: Admin users with CMS access
- **Client**: End customers
- **Rider**: Delivery personnel

## Products API

### GET /api/products
Retrieve products with search, pagination, and filtering.

**Parameters:**
- `query` (string, optional): Search term for product name, category, brand
- `page` (integer, default: 1): Page number for pagination
- `pageSize` (integer, default: 1500): Number of items per page
- `id` (string|array, optional): Specific product ID(s) to retrieve

**Example Request:**
```bash
curl -X GET "https://dialadrinkkenya.com/api/products?query=whisky&page=1&pageSize=20"
```

**Response:**
```json
{
  "response": "success",
  "data": [
    {
      "_id": "product-123",
      "name": "Johnnie Walker Black Label",
      "price": 3500,
      "offerPrice": 3200,
      "currency": "KES",
      "image": "https://res.cloudinary.com/nmasuki/image/upload/products/whisky.jpg",
      "imageSmallSize": "https://res.cloudinary.com/nmasuki/image/upload/c_fill,h_24,w_24/products/whisky.jpg",
      "category": "Whisky",
      "brand": "Johnnie Walker",
      "inStock": true,
      "onOffer": true,
      "ratings": 4.6,
      "ratingCount": 15,
      "quantity": "750ml",
      "url": "https://dialadrinkkenya.com/product/johnnie-walker-black-label",
      "options": [
        {
          "id": "opt-1",
          "quantity": "750ml",
          "price": 3500,
          "offerPrice": 3200,
          "currency": "KES",
          "inStock": true
        }
      ]
    }
  ]
}
```

### GET /api/products/categories
Retrieve all product categories.

**Response:**
```json
{
  "response": "success",
  "data": [
    {
      "_id": "cat-1",
      "name": "Whisky",
      "key": "whisky",
      "menus": [...]
    }
  ]
}
```

### GET /api/products/category/:category
Get products by category.

**Parameters:**
- `category` (string): Category key (e.g., "whisky", "beer")

### GET /api/products/:query
Search products by query string.

**Parameters:**
- `query` (string): Search term

### GET /api/products/related/:productId
Get related products based on purchase patterns.

**Parameters:**
- `productId` (string): Product ID

## Orders API

### GET /api/order
Get orders for authenticated user.

**Parameters:**
- `page` (integer, default: 1): Page number
- `pageSize` (integer, default: 1500): Items per page

**Response:**
```json
{
  "response": "success",
  "data": [
    {
      "id": "order-123",
      "orderNumber": "W12345678",
      "state": "delivered",
      "status": "3",
      "orderDate": "2023-01-15T10:30:00Z",
      "modifiedDate": "2023-01-15T14:30:00Z",
      "subtotal": 3500,
      "total": 3695,
      "currency": "KES",
      "delivery": {
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "254712345678",
        "email": "john@example.com",
        "address": "Nairobi CBD",
        "platform": "WEB"
      },
      "payment": {
        "method": "Cash",
        "amount": 3695,
        "state": "Pending"
      },
      "cart": [
        {
          "product": {
            "name": "Johnnie Walker Black Label",
            "image": "https://...",
            "category": "Whisky"
          },
          "quantity": "750ml",
          "pieces": 1,
          "price": 3500
        }
      ]
    }
  ]
}
```

### POST /api/order
Place a new order.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "254712345678",
  "email": "john@example.com",
  "address": "Nairobi CBD, Kenya",
  "building": "Times Tower",
  "houseNumber": "Floor 5",
  "paymentMethod": "Cash",
  "location": {
    "lat": -1.2921,
    "lng": 36.8219,
    "url": "https://maps.google.com/..."
  },
  "item_id": "product-123",
  "item_price": 3500,
  "item_opt": "750ml",
  "item_pieces": 1
}
```

**Multiple Items:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "254712345678",
  "email": "john@example.com",
  "paymentMethod": "PesaPal",
  "item_id": ["product-1", "product-2"],
  "item_price": [3500, 2500],
  "item_opt": ["750ml", "500ml"],
  "item_pieces": [1, 2]
}
```

**Response:**
```json
{
  "response": "success",
  "message": "Order placed successfully!",
  "data": {
    "orderNumber": "W12345678",
    "total": 3695,
    "state": "placed"
  },
  "redirect": "https://pesapal.com/pay/..." // If payment gateway
}
```

### GET /api/order/:orderNo
Get specific order details.

**Parameters:**
- `orderNo` (string): Order number or ID

### POST /api/order/cancel/:orderNo
Cancel an order.

**Parameters:**
- `orderNo` (string): Order number to cancel

## Cart API

### GET /api/cart
Get current session cart contents.

**Response:**
```json
{
  "response": "success",
  "data": {
    "items": [
      {
        "cartId": "product-123|750ml",
        "product": {...},
        "quantity": "750ml",
        "pieces": 1,
        "price": 3500
      }
    ],
    "total": 3500,
    "count": 1
  }
}
```

### POST /api/cart
Add item to cart.

**Request Body:**
```json
{
  "productId": "product-123",
  "quantity": "750ml",
  "pieces": 2
}
```

### PUT /api/cart
Update cart item quantity.

### DELETE /api/cart/:cartId
Remove item from cart.

**Parameters:**
- `cartId` (string): Cart item ID (format: "productId|quantity")

## Client API

### GET /api/client
Get authenticated client profile.

**Response:**
```json
{
  "response": "success",
  "data": {
    "id": "client-123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "254712345678",
    "email": "john@example.com",
    "address": "Nairobi CBD",
    "registrationDate": "2023-01-01T00:00:00Z"
  }
}
```

### POST /api/client
Update client information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "address": "New Address"
}
```

## Configurations API

### GET /api/configs
Get application configuration and settings.

**Response:**
```json
{
  "response": "success",
  "data": {
    "minPurchase": 500,
    "maxPurchase": 75000,
    "deliveryFee": 195,
    "currency": "KES",
    "paymentMethods": ["Cash", "PesaPal", "Mpesa"],
    "contactPhone": "254723688108",
    "supportEmail": "order@dialadrinkkenya.com"
  }
}
```

## Locations API

### GET /api/locations
Get delivery locations and zones.

### POST /api/locations/validate
Validate delivery address and calculate fees.

## Options API

### GET /api/options
Get product options (sizes, variants).

**Response:**
```json
{
  "response": "success",
  "data": [
    {
      "_id": "opt-1",
      "quantity": "750ml",
      "name": "750 ml",
      "category": "size"
    }
  ]
}
```

## Error Handling

### Standard Error Response
```json
{
  "response": "error",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_REQUIRED`: User not authenticated
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `OUT_OF_STOCK`: Product unavailable
- `PAYMENT_FAILED`: Payment processing error
- `SERVER_ERROR`: Internal server error

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API requests are subject to rate limiting:
- **General APIs**: 100 requests per minute per IP
- **Search APIs**: 50 requests per minute per IP
- **Order APIs**: 10 requests per minute per user

## Response Caching

Certain endpoints implement caching:
- **Product catalogs**: 5 minutes
- **Categories**: 30 minutes
- **User orders**: No caching
- **Cart data**: Session-based

## Webhooks

### Payment Gateway Callbacks
The system handles callbacks from payment gateways:

**PesaPal Callback**: `/pesapal/:orderNumber`  
**M-Pesa Callback**: `/mpesa/callback`  
**CyberSource Callback**: `/cybersource/callback`

### SMS Delivery Reports
**Africa's Talking**: `/africastalking/callback`

## SDKs and Libraries

### JavaScript/Node.js
```javascript
const axios = require('axios');

class DialaDrinkAPI {
  constructor(baseURL = 'https://dialadrinkkenya.com/api') {
    this.baseURL = baseURL;
    this.session = null; // Manage session cookies
  }

  async getProducts(query = '', page = 1, pageSize = 20) {
    const response = await axios.get(`${this.baseURL}/products`, {
      params: { query, page, pageSize }
    });
    return response.data;
  }

  async placeOrder(orderData) {
    const response = await axios.post(`${this.baseURL}/order`, orderData);
    return response.data;
  }
}
```

### Mobile App Integration
For mobile applications, implement:
1. Session management
2. Offline cart storage
3. Push notification handling
4. Location services integration

## Testing

### API Testing with cURL
```bash
# Test product search
curl -X GET "https://dialadrinkkenya.com/api/products?query=beer"

# Test order placement
curl -X POST "https://dialadrinkkenya.com/api/order" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "254700000000",
    "paymentMethod": "Cash",
    "item_id": "product-id",
    "item_pieces": 1
  }'
```

### Postman Collection
A Postman collection is available with pre-configured requests for all endpoints.

## Support and Contact

For API support and questions:
- **Email**: support@dialadrinkkenya.com
- **Phone**: +254 723 688 108
- **Documentation**: https://dialadrinkkenya.com/docs