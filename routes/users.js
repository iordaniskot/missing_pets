const express = require('express');
const { updateUserValidation, paginationValidation, mongoIdValidation } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/helpers');
const isAuth = require('../middleware/is-auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Protected routes - require authentication
router.use(isAuth);

// GET /users/me - Get own profile
router.get('/me', userController.getProfile);

// PATCH /users/me - Update own profile
router.patch('/me',
  updateUserValidation,
  handleValidationErrors,
  userController.updateProfile
);

// DELETE /users/me - Delete own account
router.delete('/me', userController.deleteAccount);

// Admin routes (optional)
// GET /users - Get all users (admin)
router.get('/',
  paginationValidation,
  handleValidationErrors,
  userController.getAllUsers
);

// GET /users/:id - Get user by ID (admin)
router.get('/:id',
  mongoIdValidation,
  handleValidationErrors,
  userController.getUserById
);

// PATCH /users/:id - Update user by ID (admin)
router.patch('/:id',
  mongoIdValidation,
  updateUserValidation,
  handleValidationErrors,
  userController.updateUser
);

// DELETE /users/:id - Delete user by ID (admin)
router.delete('/:id',
  mongoIdValidation,
  handleValidationErrors,
  userController.deleteUser
);

module.exports = router;