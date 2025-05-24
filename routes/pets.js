const express = require('express');
const { createPetValidation, updatePetValidation, paginationValidation, mongoIdValidation } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/helpers');
const { uploadLimiter } = require('../middleware/rate-limiter');
const attachmentUpload = require('../middleware/attachment-upload');
const isAuth = require('../middleware/is-auth');
const petController = require('../controllers/petController');

const router = express.Router();

// Protected routes - require authentication
router.use(isAuth);

// POST /pets - Create a new pet
router.post('/',
  uploadLimiter,
  attachmentUpload,
  createPetValidation,
  handleValidationErrors,
  petController.createPet
);

// GET /pets - Get all pets with pagination and filters
router.get('/',
  paginationValidation,
  handleValidationErrors,
  petController.getAllPets
);

// GET /pets/:id - Get pet by ID
router.get('/:id',
  mongoIdValidation,
  handleValidationErrors,
  petController.getPetById
);

// PATCH /pets/:id - Update pet by ID
router.patch('/:id',
  uploadLimiter,
  attachmentUpload,
  mongoIdValidation,
  updatePetValidation,
  handleValidationErrors,
  petController.updatePet
);

// DELETE /pets/:id - Delete pet by ID
router.delete('/:id',
  mongoIdValidation,
  handleValidationErrors,
  petController.deletePet
);

module.exports = router;