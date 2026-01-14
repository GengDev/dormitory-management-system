# 📚 API Documentation - Dormitory Management System

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "0812345678",
  "role": "tenant"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "tenant"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "tenant" },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

---

## 🏢 Building Endpoints

### Get All Buildings

```http
GET /api/buildings
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Building A",
      "address": "123 Street",
      "totalFloors": 5,
      "amenities": ["WiFi", "Parking"],
      "images": ["url1", "url2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

### Create Building

```http
POST /api/buildings
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "name": "Building A",
  "address": "123 Street",
  "description": "Modern building",
  "totalFloors": 5,
  "amenities": ["WiFi", "Parking", "Security"],
  "images": []
}
```

### Update Building

```http
PUT /api/buildings/:id
```

**Auth Required:** Admin

### Delete Building

```http
DELETE /api/buildings/:id
```

**Auth Required:** Admin

---

## 🚪 Room Endpoints

### Get All Rooms

```http
GET /api/rooms
```

**Query Parameters:**
- `buildingId` (optional): Filter by building
- `status` (optional): available, occupied, maintenance
- `roomType` (optional): single, double, suite, studio

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "roomNumber": "101",
      "floorNumber": 1,
      "roomType": "single",
      "monthlyRent": 3000,
      "deposit": 3000,
      "status": "available",
      "building": {
        "id": "uuid",
        "name": "Building A"
      }
    }
  ]
}
```

### Create Room

```http
POST /api/rooms
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "buildingId": "uuid",
  "roomNumber": "101",
  "floorNumber": 1,
  "roomType": "single",
  "monthlyRent": 3000,
  "deposit": 3000,
  "areaSqm": 20,
  "maxOccupancy": 1,
  "amenities": ["AC", "WiFi"],
  "status": "available"
}
```

---

## 👥 Tenant Endpoints

### Get All Tenants

```http
GET /api/tenants
```

**Auth Required:** Admin

**Query Parameters:**
- `status` (optional): active, inactive, moved_out
- `roomId` (optional): Filter by room

### Get Tenant by ID

```http
GET /api/tenants/:id
```

**Auth Required:** Admin or Self

### Create Tenant

```http
POST /api/tenants
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "0812345678",
  "idCardNumber": "1234567890123",
  "roomId": "uuid",
  "contractStartDate": "2024-01-01",
  "contractEndDate": "2024-12-31",
  "status": "active"
}
```

### Update Tenant

```http
PUT /api/tenants/:id
```

**Auth Required:** Admin

### Reset Tenant Password

```http
POST /api/tenants/:id/reset-password
```

**Auth Required:** Admin

**Response:** New password will be sent via LINE notification

---

## 💰 Bill Endpoints

### Get All Bills

```http
GET /api/bills
```

**Auth Required:** Admin (all bills) or Tenant (own bills)

**Query Parameters:**
- `tenantId` (optional): Filter by tenant
- `status` (optional): pending, verifying, paid, overdue, cancelled
- `month` (optional): Filter by billing month (YYYY-MM)

### Get Bill by ID

```http
GET /api/bills/:id
```

### Create Bill

```http
POST /api/bills
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "tenantId": "uuid",
  "roomId": "uuid",
  "billingMonth": "2024-01-01",
  "dueDate": "2024-01-31",
  "rentAmount": 3000,
  "waterUsage": 10,
  "waterRate": 15,
  "electricityUsage": 100,
  "electricityRate": 8
}
```

### Update Bill Status

```http
PATCH /api/bills/:id/status
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "status": "paid"
}
```

---

## 💳 Payment Endpoints

### Get All Payments

```http
GET /api/payments
```

**Auth Required:** Admin (all) or Tenant (own)

### Create Payment

```http
POST /api/payments
```

**Auth Required:** Tenant

**Request Body:**
```json
{
  "billId": "uuid",
  "amount": 3950,
  "paymentMethod": "bank_transfer",
  "paymentDate": "2024-01-15",
  "referenceNumber": "REF123456",
  "receiptUrl": "https://storage.url/receipt.jpg"
}
```

### Approve/Reject Payment

```http
PATCH /api/payments/:id/approve
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Payment verified"
}
```

---

## 🔧 Maintenance Endpoints

### Get All Maintenance Requests

```http
GET /api/maintenance
```

**Query Parameters:**
- `status` (optional): pending, in_progress, completed, cancelled
- `priority` (optional): low, medium, high, urgent

### Create Maintenance Request

```http
POST /api/maintenance
```

**Auth Required:** Tenant

**Request Body:**
```json
{
  "tenantId": "uuid",
  "roomId": "uuid",
  "title": "AC not working",
  "description": "The air conditioner stopped working",
  "category": "electrical",
  "priority": "high",
  "images": ["url1", "url2"]
}
```

### Update Maintenance Status

```http
PATCH /api/maintenance/:id
```

**Auth Required:** Admin

**Request Body:**
```json
{
  "status": "in_progress",
  "assignedTo": "Technician Name",
  "estimatedCost": 500,
  "scheduledDate": "2024-01-20"
}
```

---

## 💬 Chat Endpoints

### Get Chat Rooms

```http
GET /api/chat/rooms
```

**Auth Required:** Yes

### Get Messages

```http
GET /api/chat/rooms/:roomId/messages
```

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `before` (optional): Get messages before this timestamp

### Send Message

```http
POST /api/chat/rooms/:roomId/messages
```

**Request Body:**
```json
{
  "content": "Hello, I have a question",
  "messageType": "text"
}
```

### Mark as Read

```http
PATCH /api/chat/messages/:id/read
```

---

## 📊 Report Endpoints

### Get Dashboard Stats

```http
GET /api/reports/dashboard
```

**Auth Required:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRooms": 100,
    "occupiedRooms": 85,
    "availableRooms": 15,
    "totalTenants": 85,
    "pendingBills": 20,
    "totalRevenue": 255000,
    "pendingMaintenance": 5
  }
}
```

### Get Revenue Report

```http
GET /api/reports/revenue
```

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

### Get Occupancy Report

```http
GET /api/reports/occupancy
```

---

## 📱 LINE Integration Endpoints

### LINE Webhook

```http
POST /api/line/webhook
```

**Note:** This endpoint is called by LINE platform

### Link LINE Account

```http
POST /api/line/link
```

**Request Body:**
```json
{
  "lineUserId": "U1234567890abcdef",
  "tenantId": "uuid"
}
```

---

## 🏥 Health Check Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Readiness Check

```http
GET /api/health/ready
```

### Liveness Check

```http
GET /api/health/live
```

### Metrics

```http
GET /api/health/metrics
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "errors": [] // Optional validation errors
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `AUTHENTICATION_ERROR` (401): Invalid or missing token
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): Server error

---

## Rate Limiting

- **API Endpoints**: 10 requests per second
- **General Endpoints**: 30 requests per second
- **Per User**: 100 requests per 15 minutes

When rate limit is exceeded, you'll receive a 429 status code.

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## WebSocket Events (Socket.io)

### Connection

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

**Client → Server:**
- `join_room`: Join a chat room
- `send_message`: Send a message
- `typing`: User is typing
- `read_message`: Mark message as read

**Server → Client:**
- `new_message`: New message received
- `user_typing`: Another user is typing
- `message_read`: Message was read
- `notification`: New notification
