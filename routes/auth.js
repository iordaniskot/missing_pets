const express = require('express');
const { signupValidation, loginValidation } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/helpers');
const { authLimiter } = require('../middleware/rate-limiter');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /auth/signup
router.post('/signup', 
  authLimiter,
  signupValidation,
  handleValidationErrors,
  authController.signup
);

// POST /auth/login
router.post('/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

module.exports = router;