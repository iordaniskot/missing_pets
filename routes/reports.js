const express = require('express');
const { createReportValidation, updateReportValidation, paginationValidation, mongoIdValidation, geospatialValidation } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/helpers');
const { uploadLimiter } = require('../middleware/rate-limiter');
const attachmentUpload = require('../middleware/attachment-upload');
const isAuth = require('../middleware/is-auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Protected routes - require authentication
router.use(isAuth);

// POST /reports - Create a new report
router.post('/',
  uploadLimiter,
  attachmentUpload,
  createReportValidation,
  handleValidationErrors,
  reportController.createReport
);

// GET /reports - Get all reports with pagination, filters, and geospatial search
router.get('/',
  paginationValidation,
  geospatialValidation,
  handleValidationErrors,
  reportController.getAllReports
);

// GET /reports/:id - Get report by ID
router.get('/:id',
  mongoIdValidation,
  handleValidationErrors,
  reportController.getReportById
);

// PATCH /reports/:id - Update report by ID
router.patch('/:id',
  uploadLimiter,
  attachmentUpload,
  mongoIdValidation,
  updateReportValidation,
  handleValidationErrors,
  reportController.updateReport
);

// DELETE /reports/:id - Delete report by ID
router.delete('/:id',
  mongoIdValidation,
  handleValidationErrors,
  reportController.deleteReport
);

// PATCH /reports/:id/found - Mark report as found
router.patch('/:id/found',
  mongoIdValidation,
  handleValidationErrors,
  reportController.markAsFound
);

module.exports = router;