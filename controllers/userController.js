const User = require('../models/User');
const Pet = require('../models/Pet');
const Report = require('../models/Report');
const { paginate, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    const updatedUser = await user.save();

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Delete associated pets and reports
    await Pet.deleteMany({ owner: req.userId });
    await Report.deleteMany({ reporter: req.userId });
    
    // Delete user
    await User.findByIdAndDelete(req.userId);

    logger.info(`User account deleted: ${user.email}`);

    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints (optional)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { email } = req.query;

    let query = User.find();
    
    if (email) {
      query = query.where('email').regex(new RegExp(email, 'i'));
    }

    const total = await User.countDocuments(query.getFilter());
    const users = await paginate(query, page, limit);

    res.status(200).json(
      buildPaginationResponse(users, page, limit, total)
    );
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    const updatedUser = await user.save();

    logger.info(`Admin updated user: ${user.email}`);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Delete associated pets and reports
    await Pet.deleteMany({ owner: req.params.id });
    await Report.deleteMany({ reporter: req.params.id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);

    logger.info(`Admin deleted user: ${user.email}`);

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};