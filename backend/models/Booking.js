const mongoose = require('mongoose');

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
  ticketNumber: {
    type: String,
    unique: true,
  },
}, { timestamps: true });

// Index for querying bookings by venue and date (for slot availability)
BookingSchema.index({ venue: 1, date: 1, status: 1 });
BookingSchema.index({ user: 1, status: 1 });

// Pre-save hook to generate a unique ticket number
BookingSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    const dateStr = new Date(this.date || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketNumber = `TKT-${dateStr}-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
