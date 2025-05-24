const Report = require('../models/Report');
const Pet = require('../models/Pet');
const { paginate, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// Socket.io instance will be injected
let io;

exports.setSocketIO = (socketInstance) => {
  io = socketInstance;
};

exports.createReport = async (req, res, next) => {
  try {
    const { pet, status, description, location } = req.body;
    
    // Verify pet exists
    const petDoc = await Pet.findById(pet);
    if (!petDoc) {
      const error = new Error('Pet not found');
      error.statusCode = 404;
      throw error;
    }

    // Get photo URLs from uploaded files
    const photos = req.files ? req.files.map(file => file.cdnUrl) : [];

    const report = new Report({
      pet,
      reporter: req.userId,
      status,
      description,
      photos,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      }
    });

    const savedReport = await report.save();
    await savedReport.populate([
      { path: 'pet', populate: { path: 'owner', select: 'name email' } },
      { path: 'reporter', select: 'name email' }
    ]);

    logger.info(`New ${status} report created: ${savedReport._id} by user ${req.userId}`);

    // Emit real-time event
    if (io) {
      io.of('/reports').emit('newReport', savedReport);
    }

    res.status(201).json({
      message: 'Report created successfully',
      report: savedReport
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, petId, reporterId, dateFrom, dateTo, lat, lng, radius } = req.query;

    let query = Report.find()
      .populate([
        { path: 'pet', populate: { path: 'owner', select: 'name email' } },
        { path: 'reporter', select: 'name email' }
      ]);
    
    // Status filter
    if (status) {
      query = query.where('status').equals(status);
    }
    
    // Pet filter
    if (petId) {
      query = query.where('pet').equals(petId);
    }
    
    // Reporter filter
    if (reporterId) {
      query = query.where('reporter').equals(reporterId);
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      query = query.where('createdAt').gte(dateFilter.$gte || new Date(0)).lte(dateFilter.$lte || new Date());
    }
    
    // Geospatial filter
    if (lat && lng && radius) {
      const longitude = parseFloat(lng);
      const latitude = parseFloat(lat);
      const radiusInMeters = parseInt(radius);
      
      // Convert radius from meters to radians (divide by Earth's radius in meters)
      const radiusInRadians = radiusInMeters / 6378100;
      
      query = query.where({
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInRadians]
          }
        }
      });
    }

    const total = await Report.countDocuments(query.getFilter());
    const reports = await paginate(query, page, limit);

    res.status(200).json(
      buildPaginationResponse(reports, page, limit, total)
    );
  } catch (error) {
    next(error);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate([
        { path: 'pet', populate: { path: 'owner', select: 'name email' } },
        { path: 'reporter', select: 'name email' }
      ]);
      
    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'Report retrieved successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const { status, description } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the report
    if (report.reporter.toString() !== req.userId) {
      const error = new Error('Not authorized to update this report');
      error.statusCode = 403;
      throw error;
    }

    if (status !== undefined) report.status = status;
    if (description !== undefined) report.description = description;
    
    // Handle new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => file.cdnUrl);
      report.photos = [...report.photos, ...newPhotos];
    }

    const updatedReport = await report.save();
    await updatedReport.populate([
      { path: 'pet', populate: { path: 'owner', select: 'name email' } },
      { path: 'reporter', select: 'name email' }
    ]);

    logger.info(`Report updated: ${report._id} by user ${req.userId}`);

    // Emit real-time event
    if (io) {
      io.of('/reports').emit('updateReport', updatedReport);
    }

    res.status(200).json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the report
    if (report.reporter.toString() !== req.userId) {
      const error = new Error('Not authorized to delete this report');
      error.statusCode = 403;
      throw error;
    }

    await Report.findByIdAndDelete(req.params.id);

    logger.info(`Report deleted: ${report._id} by user ${req.userId}`);

    res.status(200).json({
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};