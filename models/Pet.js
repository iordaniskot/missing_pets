const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  breed: {
    type: String,
    trim: true
  },
  height: {
    type: Number,
    min: [0, 'Height must be a positive number'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || value > 0;
      },
      message: 'Height must be a positive number'
    }
  },
  weight: {
    type: Number,
    min: [0, 'Weight must be a positive number'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || value > 0;
      },
      message: 'Weight must be a positive number'
    }
  },
  color: {
    type: String,
    trim: true,
    lowercase: true
  },
  photos: [{
    type: String // URLs to uploaded images
  }],
  // Flag to indicate if the creator claims ownership
  isOwnedByCreator: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Custom validation: at least one field must be provided
petSchema.pre('save', function(next) {
  if (!this.name && !this.breed && (!this.photos || this.photos.length === 0)) {
    const error = new Error('At least one of name, breed, or photos must be provided');
    error.statusCode = 400;
    return next(error);
  }
  
  // If user claims ownership, set them as owner
  if (this.isOwnedByCreator && this.createdBy) {
    this.owner = this.createdBy;
  }
  
  next();
});

module.exports = mongoose.model('Pet', petSchema);