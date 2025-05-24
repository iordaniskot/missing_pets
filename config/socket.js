const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.io
  const socketAuth = (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  };

  // Reports namespace for real-time updates
  const reportsNamespace = io.of('/reports');
  
  reportsNamespace.use(socketAuth);

  reportsNamespace.on('connection', (socket) => {
    logger.info(`User connected to reports namespace: ${socket.email}`);

    // Handle region subscription for geospatial filtering
    socket.on('subscribeRegion', (data) => {
      try {
        const { lat, lng, radius } = data;
        
        if (!lat || !lng || !radius) {
          socket.emit('error', { message: 'lat, lng, and radius are required' });
          return;
        }

        // Store region data in socket for filtering
        socket.region = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius: parseInt(radius)
        };

        socket.join(`region_${lat}_${lng}_${radius}`);
        
        logger.info(`User ${socket.email} subscribed to region: ${lat}, ${lng}, radius: ${radius}m`);
        
        socket.emit('regionSubscribed', {
          message: 'Successfully subscribed to region updates',
          region: socket.region
        });
      } catch (error) {
        logger.error('Error in subscribeRegion:', error);
        socket.emit('error', { message: 'Invalid region data' });
      }
    });

    socket.on('unsubscribeRegion', () => {
      if (socket.region) {
        const { lat, lng, radius } = socket.region;
        socket.leave(`region_${lat}_${lng}_${radius}`);
        socket.region = null;
        
        logger.info(`User ${socket.email} unsubscribed from region updates`);
        
        socket.emit('regionUnsubscribed', {
          message: 'Successfully unsubscribed from region updates'
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from reports namespace: ${socket.email}`);
    });
  });

  // Helper function to check if a location is within a region
  const isLocationInRegion = (location, region) => {
    if (!location || !region) return false;
    
    const [lng, lat] = location.coordinates;
    const distance = calculateDistance(lat, lng, region.lat, region.lng);
    return distance <= region.radius;
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Override emit methods to include geospatial filtering
  const originalEmit = reportsNamespace.emit;
  reportsNamespace.emit = function(event, data) {
    if (event === 'newReport' || event === 'updateReport') {
      // Send to all connected clients first
      originalEmit.call(this, event, data);
      
      // Then send targeted events to users in specific regions
      this.sockets.forEach((socket) => {
        if (socket.region && data.location) {
          if (isLocationInRegion(data.location, socket.region)) {
            socket.emit(`${event}InRegion`, data);
          }
        }
      });
    } else {
      originalEmit.call(this, event, data);
    }
  };

  logger.info('Socket.io initialized successfully');
  
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};