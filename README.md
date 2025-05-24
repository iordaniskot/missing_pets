# Missing Pets Backend API

A comprehensive RESTful API for a Missing Pets application built with Node.js, Express.js, MongoDB, and Socket.io. This backend enables users to register, manage pets, and report missing or found pets with real-time updates and geospatial search capabilities.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Pet CRUD**: Create, read, update, delete pet records
- **Report System**: Lost/found pet reports with geospatial location
- **Real-time Updates**: Socket.io integration for live notifications
- **File Uploads**: Photo upload support for pets and reports
- **Geospatial Search**: Radius-based search for nearby reports
- **Security**: JWT authentication, rate limiting, input validation
- **Logging**: Comprehensive logging with Winston

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB Atlas via Mongoose 8.x
- **Real-Time**: Socket.io 4.x
- **Authentication**: JWT (jsonwebtoken)
- **File Uploads**: Multer
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: bcrypt, rate limiting

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd missing_pets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   MONGO_USER=your-mongo-username
   MONGO_PASSWORD=your-mongo-password
   DEFAULT_DATABASE=MissingPets

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # CORS Configuration
   CLIENT_URL=http://localhost:3001

   # CDN Configuration
   CDN_BASE_URL=http://localhost:3000

   # Logging
   LOG_LEVEL=info
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:8080` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Endpoints

All user endpoints require authentication header: `Authorization: Bearer <token>`

- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile
- `DELETE /users/me` - Delete current user account

### Pet Endpoints

All pet endpoints require authentication.

- `POST /pets` - Create a new pet
- `GET /pets` - List all pets (with pagination and filters)
- `GET /pets/:id` - Get pet by ID
- `PATCH /pets/:id` - Update pet by ID
- `DELETE /pets/:id` - Delete pet by ID

**Query Parameters for GET /pets:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `name` - Filter by pet name
- `breed` - Filter by pet breed

### Report Endpoints

All report endpoints require authentication.

- `POST /reports` - Create a new report
- `GET /reports` - List all reports (with pagination, filters, and geospatial search)
- `GET /reports/:id` - Get report by ID
- `PATCH /reports/:id` - Update report by ID
- `DELETE /reports/:id` - Delete report by ID

**Query Parameters for GET /reports:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (`lost` or `found`)
- `petId` - Filter by pet ID
- `reporterId` - Filter by reporter ID
- `dateFrom` - Filter by date range (start)
- `dateTo` - Filter by date range (end)
- `lat` - Latitude for geospatial search
- `lng` - Longitude for geospatial search
- `radius` - Search radius in meters

**Create Report Example:**
```json
{
  "pet": "pet-id-here",
  "status": "lost",
  "description": "Lost near Central Park",
  "location": {
    "type": "Point",
    "coordinates": [-73.968285, 40.785091]
  }
}
```

### File Upload

File uploads are supported for pet photos and report photos. Send files as `multipart/form-data` with the field name `attachments`.

### Health Check

- `GET /health` - Server health status

## 🔌 WebSocket Events

Connect to the `/reports` namespace for real-time updates:

```javascript
const socket = io('http://localhost:8080/reports', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for new reports
socket.on('newReport', (report) => {
  console.log('New report:', report);
});

// Listen for report updates
socket.on('updateReport', (report) => {
  console.log('Updated report:', report);
});

// Subscribe to region-specific updates
socket.emit('subscribeRegion', {
  lat: 40.785091,
  lng: -73.968285,
  radius: 1000 // meters
});
```

## 📊 Data Models

### User
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required, hashed)
- `phone` (String, optional)

### Pet
- `owner` (ObjectId, optional, ref: User)
- `name` (String, optional)
- `breed` (String, optional)
- `photos` (Array of String URLs)

### Report
- `pet` (ObjectId, required, ref: Pet)
- `reporter` (ObjectId, required, ref: User)
- `status` (String, enum: ['lost', 'found'])
- `description` (String, optional)
- `photos` (Array of String URLs)
- `location` (GeoJSON Point, required)

## 🧪 Testing

Run the API test suite:

```bash
node test-api.js
```

This will test all major endpoints and functionality.

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with configurable expiration
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Different limits for auth, general, and upload endpoints
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Configuration**: Configurable origin policies
- **Error Handling**: Centralized error handling with logging

## 📁 Project Structure

```
missing_pets/
├── app.js                 # Main application file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── test-api.js           # API test suite
├── controllers/          # Route controllers
├── models/               # Mongoose schemas
├── routes/               # Express routes
├── middleware/           # Custom middleware
├── utils/                # Utility functions
├── config/               # Configuration files
├── logs/                 # Application logs
└── attachments/          # Uploaded files
```

## 🚦 Error Handling

The API returns structured error responses:

```json
{
  "status": 400,
  "message": "Validation failed",
  "data": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## 📝 Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please check the logs first:
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`

Common issues:
- MongoDB connection: Check your connection string and credentials
- JWT errors: Verify your JWT_SECRET is set
- File uploads: Ensure the attachments directory exists and is writable

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up reverse proxy (nginx)
5. Configure process manager (PM2)
6. Set up monitoring and logging
7. Configure backup strategy for MongoDB

## 📊 Performance Considerations

- Database indexes are automatically created for geospatial queries
- Pagination is implemented for all list endpoints
- File uploads are rate-limited
- Connection pooling is handled by Mongoose
- Static files are served efficiently
