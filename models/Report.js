const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  photos: [{
    type: String // URLs to uploaded images
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length === 2;
        },
        message: 'Coordinates must be an array of [longitude, latitude]'
      }
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);