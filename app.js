const mongoose = require("mongoose");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");

// Load environment variables
require('dotenv').config();

// Import utilities and middleware
const logger = require("./utils/logger");
const { generalLimiter } = require("./middleware/rate-limiter");
const { initializeSocket } = require("./config/socket");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const petRoutes = require("./routes/pets");
const reportRoutes = require("./routes/reports");

// Import controllers for Socket.io integration
const reportController = require("./controllers/reportController");

const app = express();
const server = http.createServer(app);

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@missingpet.mrdfzgj.mongodb.net/${process.env.DEFAULT_DATABASE}?authSource=admin&retryWrites=true&w=majority`;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true })); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// Rate limiting
app.use(generalLimiter);

// Static files
app.use("/attachments", express.static(path.join(__dirname, "attachments")));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/pets", petRoutes);
app.use("/reports", reportRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message || "Internal server error";
  const data = error.data;
  
  logger.error(`Error ${status}: ${message}`, {
    error: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(status).json({ 
    status,
    message, 
    data,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize Socket.io
const io = initializeSocket(server);
reportController.setSocketIO(io);

mongoose.connect(MONGODB_URI, {
  // Modern connection options
})
  .then(() => {
    logger.info("Connected to MongoDB");
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});