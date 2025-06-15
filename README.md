# Missing Pets Backend API

A comprehensive RESTful API for a Missing Pets application built with Node.js, Express.js, MongoDB, and Socket.io. This backend enables users to register, manage pets, and report missing or found pets with real-time updates and geospatial search capabilities.

## 🚀 Features

- **User Management**: Registration, authentication (JWT), profile management (including admin routes).
- **Pet CRUD**: Create, read, update, delete pet records with detailed characteristics.
- **Report System**: Lost, found, and reunited pet reports with geospatial location.
- **Real-time Updates**: Socket.io integration for live notifications on report creation and updates within subscribed regions.
- **File Uploads**: Photo upload support for pets and reports, served via a CDN-like path.
- **Geospatial Search**: Radius-based search for nearby reports.
- **Security**: JWT authentication, password hashing (bcryptjs), rate limiting, input validation, CORS.
- **Logging**: Comprehensive logging with Winston.
- **Health Check**: Endpoint to monitor application status.

## 🛠️ Tech Stack

- **Runtime**: Node.js (as specified in `package.json`)
- **Framework**: Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Real-Time**: Socket.io
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Uploads**: Multer
- **Validation**: express-validator
- **Logging**: Winston
- **Environment Management**: dotenv
- **CORS**: cors package
- **HTTP Server**: Node.js `http` module

## 📋 Prerequisites

- Node.js (version as per `package.json` or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

## 🔧 Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd missing_pets
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root directory by copying `.env.example` (if available) or by creating a new one.
    ```env
    # Database Configuration
    MONGO_USER=your-mongo-username
    MONGO_PASSWORD=your-mongo-password
    DEFAULT_DATABASE=MissingPets # Or your preferred database name

    # Server Configuration
    PORT=3000
    HOST=0.0.0.0 # Binds to all available network interfaces
    NODE_ENV=development # or production

    # Authentication
    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

    # CORS Configuration
    CLIENT_URL=http://localhost:3001 # Frontend URL, or "*" for all

    # CDN Configuration (Base URL for served attachments)
    CDN_BASE_URL=http://localhost:3000 # Should match your server's public URL

    # Logging
    LOG_LEVEL=info # e.g., error, warn, info, http, verbose, debug, silly
    ```

4.  **Start the development server**
    ```bash
    npm start
    ```
    The server will typically start on `http://localhost:3000` (or your configured `PORT` and `HOST`).

## 📚 API Documentation

All API endpoints requiring authentication must include an `Authorization` header with a Bearer token: `Authorization: Bearer <your-jwt-token>`.

### Authentication Endpoints

#### `POST /auth/signup`
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
**Response (Success 201):**
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

#### `POST /auth/login`
Authenticate user and get an access token.
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response (Success 200):**
```json
{
  "message": "Logged in successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

### User Endpoints (Authentication Required)

#### `GET /users/me`
Get the profile of the currently authenticated user.
**Response (Success 200):** User object.

#### `PATCH /users/me`
Update the profile of the currently authenticated user.
**Request Body:** Fields to update (e.g., name, phone, password).
**Response (Success 200):** Updated user object.

#### `DELETE /users/me`
Delete the account of the currently authenticated user.
**Response (Success 200):** Confirmation message.

### Admin User Endpoints (Authentication Required, Admin Privileges)

#### `GET /users`
List all users (pagination available).
**Query Parameters:**
- `page` (number, optional): Page number for pagination.
- `limit` (number, optional): Number of items per page.
**Response (Success 200):** Array of user objects.

#### `GET /users/:id`
Get a specific user by ID.
**Response (Success 200):** User object.

#### `PATCH /users/:id`
Update a specific user by ID.
**Request Body:** Fields to update.
**Response (Success 200):** Updated user object.

#### `DELETE /users/:id`
Delete a specific user by ID.
**Response (Success 200):** Confirmation message.

### Pet Endpoints (Authentication Required)

#### `POST /pets`
Create a new pet record.
**Request Body (`multipart/form-data`):**
- `name` (String)
- `breed` (String, optional)
- `height` (Number, optional)
- `weight` (Number, optional)
- `color` (String, optional)
- `attachments` (File, optional): Pet photo(s).
**Response (Success 201):** Created pet object.

#### `GET /pets`
List pets (pagination and filters available).
**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `name` (String, optional): Filter by pet name.
- `breed` (String, optional): Filter by pet breed.
- `color` (String, optional): Filter by pet color.
- `hasOwner` (Boolean, optional): Filter pets that have an owner.
**Response (Success 200):** Array of pet objects.

#### `GET /pets/:id`
Get a specific pet by ID.
**Response (Success 200):** Pet object.

#### `PATCH /pets/:id`
Update a specific pet by ID.
**Request Body (`multipart/form-data`):** Fields to update (same as POST).
**Response (Success 200):** Updated pet object.

#### `DELETE /pets/:id`
Delete a specific pet by ID.
**Response (Success 200):** Confirmation message.

### Report Endpoints (Authentication Required)

#### `POST /reports`
Create a new missing/found pet report.
**Request Body (`multipart/form-data`):**
- `pet` (String, Pet ID)
- `status` (String, enum: `lost`, `found`, `reunited`)
- `description` (String, optional)
- `location` (Object): GeoJSON Point (e.g., `{ "type": "Point", "coordinates": [longitude, latitude] }`)
- `attachments` (File, optional): Report photo(s).
**Response (Success 201):** Created report object.

#### `GET /reports`
List reports (pagination, filters, geospatial search available).
**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (String, optional, enum: `lost`, `found`, `reunited`): Filter by report status.
- `petId` (String, optional): Filter by Pet ID.
- `reporterId` (String, optional): Filter by User ID of the reporter.
- `dateFrom` (String, optional, ISO Date): Filter reports from this date.
- `dateTo` (String, optional, ISO Date): Filter reports up to this date.
- `lat` (Number, optional): Latitude for geospatial search.
- `lng` (Number, optional): Longitude for geospatial search.
- `radius` (Number, optional): Search radius in meters (used with `lat` and `lng`).
**Response (Success 200):** Array of report objects.

#### `GET /reports/:id`
Get a specific report by ID.
**Response (Success 200):** Report object.

#### `PATCH /reports/:id`
Update a specific report by ID.
**Request Body (`multipart/form-data`):** Fields to update (same as POST).
**Response (Success 200):** Updated report object.

#### `PATCH /reports/:id/found`
Mark a specific report's pet as found (sets status to `reunited` or similar).
**Response (Success 200):** Updated report object.

#### `DELETE /reports/:id`
Delete a specific report by ID.
**Response (Success 200):** Confirmation message.

### File Upload Details
- Files are uploaded via `multipart/form-data`.
- The field name for file(s) should be `attachments`.
- Uploaded files are stored in the `/attachments` directory on the server and accessible via `/attachments/:filename` (e.g., `http://localhost:3000/attachments/yourfile.jpg`). The `CDN_BASE_URL` is used to construct the full URL in API responses.

### Health Check

#### `GET /health`
Provides the health status of the server.
**Response (Success 200):**
```json
{
  "status": "OK",
  "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "uptime": 1234.56 // seconds
}
```

## 🔌 WebSocket Events

The API uses Socket.io for real-time communication, primarily for report updates.

-   **Namespace**: `/reports`
-   **Authentication**: Connect to the namespace with a JWT token in the `auth` object:
    ```javascript
    const socket = io('http://your-server-url/reports', {
      auth: {
        token: 'your-jwt-token'
      }
    });
    ```

### Emitted Events (Server to Client)

-   `newReport`
    -   **Payload**: The newly created report object.
    -   **Description**: Emitted when a new report is successfully created and matches a client's subscribed region.
-   `updateReport`
    -   **Payload**: The updated report object.
    -   **Description**: Emitted when an existing report is updated and matches a client's subscribed region.

### Listened Events (Client to Server)

-   `subscribeRegion`
    -   **Payload**:
        ```json
        {
          "lat": 40.7128,    // Latitude of the center of the region
          "lng": -74.0060,   // Longitude of the center of the region
          "radius": 5000     // Radius in meters
        }
        ```
    -   **Description**: Allows a client to subscribe to real-time updates for reports within a specific geographical area. The server will then only send `newReport` and `updateReport` events relevant to this region.

## 📊 Data Models

All models include `createdAt` and `updatedAt` timestamps by default.

### User
- `name` (String, required)
- `email` (String, required, unique, lowercase, trim)
- `password` (String, required, minlength: 6) - Stored hashed.
- `phone` (String, optional, trim)
- `isAdmin` (Boolean, default: false)

### Pet
- `owner` (ObjectId, ref: 'User', optional, index: true) - The user who owns the pet.
- `createdBy` (ObjectId, ref: 'User', required, index: true) - The user who created the pet record.
- `name` (String, required, trim)
- `breed` (String, optional, trim)
- `height` (Number, optional, min: 0) - In cm.
- `weight` (Number, optional, min: 0) - In kg.
- `color` (String, optional, trim)
- `photos` (Array of String URLs, default: []) - URLs of pet photos.
- `isOwnedByCreator` (Boolean, default: true) - Indicates if the creator is the current owner.

### Report
- `pet` (ObjectId, ref: 'Pet', required, index: true) - The pet this report is about.
- `reporter` (ObjectId, ref: 'User', required, index: true) - The user who filed the report.
- `status` (String, required, enum: ['lost', 'found', 'reunited'], default: 'lost', index: true)
- `description` (String, optional, trim)
- `photos` (Array of String URLs, default: []) - URLs of report-specific photos.
- `location` (Object, required) - GeoJSON Point for the report's location.
    - `type` (String, enum: ['Point'], required)
    - `coordinates` (Array of Number, required, index: '2dsphere') - [longitude, latitude]
- `resolvedAt` (Date, optional) - When the report was marked as 'reunited'.

## 🧪 Testing

To run tests (if test scripts are configured in `package.json`, e.g., `npm test`):
```bash
npm test
# or specific test files if using a test runner like Jest or Mocha
```
The provided `test-api.js` seems to be a custom script. You can run it using:
```bash
node test-api.js
```
Ensure the server is running and configured correctly before executing `test-api.js`.

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication using JSON Web Tokens.
- **Password Hashing**: `bcryptjs` is used to hash passwords before storing.
- **Rate Limiting**: `express-rate-limit` is implemented to protect against brute-force attacks on various routes (general, authentication, uploads).
- **Input Validation**: `express-validator` is used to validate and sanitize request data.
- **CORS**: Configured using the `cors` package to control cross-origin requests.
- **Error Handling**: Centralized error handling middleware provides consistent error responses.
- **HTTPS**: Recommended for production (typically handled by a reverse proxy like Nginx).

## 📁 Project Structure

```
missing_pets/
├── app.js                 # Main application file, sets up Express, DB, Socket.io
├── package.json           # Project dependencies and scripts
├── nodemon.json           # Configuration for nodemon (if used)
├── .env                   # Environment variables (ignored by Git)
├── .env.example           # Template for environment variables
├── README.md              # This file
├── test-api.js            # Example API test script
├── attachments/           # Directory for uploaded files (ensure it's writable)
├── config/
│   └── socket.js          # Socket.io configuration
├── controllers/           # Route handlers (business logic)
│   ├── authController.js
│   ├── petController.js
│   ├── reportController.js
│   └── userController.js
├── docs/                  # API documentation files
│   ├── attachment-upload-documentation.html
│   ├── complete-api-documentation.html
│   └── index.html
├── logs/                  # Log files (ensure it's writable)
│   ├── combined.log
│   └── error.log
├── middleware/            # Custom Express middleware
│   ├── attachment-upload.js # Handles file uploads with Multer
│   ├── is-auth.js         # JWT authentication verification
│   └── rate-limiter.js    # Request rate limiting
├── models/                # Mongoose data models (schemas)
│   ├── Pet.js
│   ├── Report.js
│   └── User.js
├── routes/                # Express route definitions
│   ├── auth.js
│   ├── pets.js
│   ├── reports.js
│   └── users.js
└── utils/                 # Utility functions and helpers
    ├── helpers.js
    ├── logger.js          # Winston logger configuration
    └── validation.js      # Reusable validation schemas/rules
```

## 🚦 Error Handling

The API returns structured JSON error responses:
**Example (Validation Error):**
```json
{
  "status": 422, // Or other appropriate HTTP status code
  "message": "Validation failed.",
  "data": [ // Array of validation errors from express-validator
    {
      "type": "field",
      "value": "invalid_email",
      "msg": "Please enter a valid email.",
      "path": "email",
      "location": "body"
    }
  ]
}
```
**Example (General Error):**
```json
{
  "status": 500,
  "message": "Internal server error",
  // stack trace included in development mode
  "stack": "Error: ... at ..." 
}
```

## 📝 Logging

- Logs are managed by Winston.
- Configuration is in `utils/logger.js`.
- Default log files (in the `logs/` directory):
    - `combined.log`: All logs (based on `LOG_LEVEL`).
    - `error.log`: Only error logs.
- Console output is also active, especially in development.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## 📄 License

This project is likely under a common open-source license (e.g., MIT, ISC). Check `package.json` or for a `LICENSE` file if one exists. (Assuming ISC if not specified, common for Node.js projects).

## 🆘 Support & Common Issues

-   **MongoDB Connection Issues**:
    -   Verify `MONGO_USER`, `MONGO_PASSWORD`, and `DEFAULT_DATABASE` in `.env`.
    -   Ensure your IP address is whitelisted in MongoDB Atlas if applicable.
    -   Check MongoDB server status.
-   **JWT Errors**:
    -   Ensure `JWT_SECRET` is correctly set in `.env` and is a strong, unique key.
    -   Verify the token is not expired and is being sent correctly in the `Authorization` header.
-   **File Uploads**:
    -   Ensure the `attachments/` directory exists at the root of the project and is writable by the Node.js process.
    -   Check `CDN_BASE_URL` in `.env` to ensure generated file URLs are correct.
    -   Verify the client is sending `multipart/form-data` with the correct field name (`attachments`).
-   **CORS Errors**:
    -   Check `CLIENT_URL` in `.env`. For multiple origins or more complex setups, you might need to adjust the `cors` middleware options in `app.js`.
-   **Rate Limiting**: If you're getting blocked, you might be hitting rate limits. This is expected behavior to prevent abuse.

## 🚀 Deployment Considerations (Production)

-   Set `NODE_ENV=production` in your environment variables.
-   Use a strong, unique `JWT_SECRET`.
-   Configure `CLIENT_URL` specifically for your production frontend.
-   Use a process manager like PM2 or Supervisor to keep the application running.
-   Set up a reverse proxy (e.g., Nginx, Apache) to handle incoming traffic, SSL termination (HTTPS), and potentially serve static files or load balance.
-   Implement robust monitoring and alerting.
-   Ensure database backups are regularly performed.
-   Consider log rotation and management for production environments.
