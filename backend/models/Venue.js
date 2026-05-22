const mongoose = require('../config/mongooseMock');

const SportConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'table-tennis', 'volleyball', 'squash', 'gym'],
  },
  courts: {
    type: Number,
    default: 1,
    min: 1,
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0,
  },
  maxPlayers: {
    type: Number,
    default: 10,
  },
}, { _id: false });

const VenueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a venue name'],
    trim: true,
    maxlength: [100, 'Venue name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  area: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: 'Lucknow',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  sports: {
    type: [SportConfigSchema],
    required: [true, 'Please add at least one sport'],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: 'A venue must have at least one sport',
    },
  },
  amenities: {
    type: [String],
    default: [],
    enum: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'first-aid', 'wifi', 'floodlights', 'coaching', 'equipment-rental', 'drinking-water', 'seating-area', 'ac'],
  },
  images: {
    type: [String],
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  operatingHours: {
    open: { type: String, default: '06:00' },
    close: { type: String, default: '23:00' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  contactPhone: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Geospatial index for proximity queries
VenueSchema.index({ location: '2dsphere' });

// Text index for search
VenueSchema.index({ name: 'text', description: 'text', area: 'text', address: 'text' });

module.exports = mongoose.model('Venue', VenueSchema);
