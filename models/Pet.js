const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    trim: true
  },
  breed: {
    type: String,
    trim: true
  },
  photos: [{
    type: String // URLs to uploaded images
  }]
}, {
  timestamps: true
});

// Custom validation: at least one field must be provided
petSchema.pre('save', function(next) {
  if (!this.owner && !this.name && !this.breed && (!this.photos || this.photos.length === 0)) {
    const error = new Error('At least one of owner, name, breed, or photos must be provided');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Pet', petSchema);