const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { venueId, sport, court, date, startTime, endTime, playerCount, players, notes, isAgentBooked } = req.body;

    if (!venueId || !sport || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide venueId, sport, date, startTime, and endTime',
      });
    }

    // Verify venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Check sport availability
    const sportConfig = venue.sports.find((s) => s.name === sport.toLowerCase());
    if (!sportConfig) {
      return res.status(400).json({ success: false, message: `Sport '${sport}' not available at this venue` });
    }

    // Check for conflicting bookings
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const conflicting = await Booking.findOne({
      venue: venueId,
      sport: sport.toLowerCase(),
      court: court || 1,
      date: bookingDate,
      startTime,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflicting) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }

    // Calculate duration and price
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;
    const totalPrice = sportConfig.pricePerHour * duration;

    const booking = await Booking.create({
      user: req.user._id,
      venue: venueId,
      sport: sport.toLowerCase(),
      court: court || 1,
      date: bookingDate,
      startTime,
      endTime,
      duration,
      totalPrice,
      playerCount: playerCount || 1,
      players: players || [],
      notes: notes || '',
      isAgentBooked: isAgentBooked || false,
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('venue', 'name address area sports images')
      .populate('user', 'username email');

    // Emit real-time update via Socket.IO if available
    if (req.app.get('io')) {
      req.app.get('io').emit('booking:new', {
        venueId,
        booking: populatedBooking,
      });
    }

    res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user's bookings
// @route   GET /api/bookings/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('venue', 'name address area sports images location')
      .sort({ date: -1, startTime: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('booking:cancelled', {
        venueId: booking.venue,
        bookingId: booking._id,
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get bookings for a venue (owner view)
// @route   GET /api/bookings/venue/:venueId
// @access  Private (venue_owner)
router.get('/venue/:venueId', protect, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    if (venue.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these bookings' });
    }

    const { date, status } = req.query;
    let query = { venue: req.params.venueId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email phone')
      .sort({ date: -1, startTime: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
