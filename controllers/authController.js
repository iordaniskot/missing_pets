const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 422;
      throw error;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: savedUser._id.toString(), email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: savedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};