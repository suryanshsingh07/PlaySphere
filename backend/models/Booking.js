const mongoose = require('../config/mongooseMock');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },
  sport: {
    type: String,
    required: [true, 'Please specify the sport'],
  },
  court: {
    type: Number,
    default: 1,
  },
  date: {
    type: Date,
    required: [true, 'Please specify the booking date'],
  },
  startTime: {
    type: String,
    required: [true, 'Please specify start time'],
  },
  endTime: {
    type: String,
    required: [true, 'Please specify end time'],
  },
  duration: {
    type: Number, // in hours
    default: 1,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  players: [{
    name: String,
    phone: String,
  }],
  playerCount: {
    type: Number,
    default: 1,
  },
  isAgentBooked: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Index for querying bookings by venue and date (for slot availability)
BookingSchema.index({ venue: 1, date: 1, status: 1 });
BookingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
