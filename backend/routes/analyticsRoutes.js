const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get venue owner dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (venue_owner, admin)
router.get('/dashboard', protect, authorize('venue_owner', 'admin'), async (req, res) => {
  try {
    // Get owner's venues
    const venues = await Venue.find({ owner: req.user._id });
    const venueIds = venues.map((v) => v._id);

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      venue: { $in: venueIds },
      status: { $in: ['confirmed', 'completed'] },
    });

    // Total revenue
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Average rating across venues
    const avgRating = venues.length > 0
      ? Math.round((venues.reduce((sum, v) => sum + v.rating, 0) / venues.length) * 10) / 10
      : 0;

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Sport-wise breakdown
    const sportBreakdown = await Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Recent bookings
    const recentBookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('user', 'username email')
      .populate('venue', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Today's bookings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      venue: { $in: venueIds },
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['pending', 'confirmed'] },
    });

    // AI-booked vs manual
    const aiBookings = await Booking.countDocuments({
      venue: { $in: venueIds },
      isAgentBooked: true,
      status: { $in: ['confirmed', 'completed'] },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalVenues: venues.length,
          totalBookings,
          totalRevenue,
          avgRating,
          todayBookings,
          aiBookings,
          aiBookingPercentage: totalBookings > 0 ? Math.round((aiBookings / totalBookings) * 100) : 0,
        },
        monthlyRevenue: monthlyRevenue.map((m) => ({
          month: monthNames[m._id] || m._id,
          revenue: m.revenue,
          bookings: m.bookings,
        })),
        sportBreakdown,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get heatmap data for venue crowd density
// @route   GET /api/analytics/heatmap
// @access  Public
router.get('/heatmap', async (req, res) => {
  try {
    const venues = await Venue.find({ isActive: true }).select('name location rating totalReviews sports');

    // Get today's booking count per venue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          date: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ['pending', 'confirmed'] },
        },
      },
      {
        $group: {
          _id: '$venue',
          count: { $sum: 1 },
        },
      },
    ]);

    const bookingMap = {};
    bookingCounts.forEach((b) => {
      bookingMap[b._id.toString()] = b.count;
    });

    const heatmapData = venues.map((v) => ({
      id: v._id,
      name: v.name,
      lat: v.location.coordinates[1],
      lng: v.location.coordinates[0],
      intensity: bookingMap[v._id.toString()] || 0,
      rating: v.rating,
      sports: v.sports.map((s) => s.name),
    }));

    res.json({ success: true, data: heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get platform-wide stats (for homepage)
// @route   GET /api/analytics/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalVenues = await Venue.countDocuments({ isActive: true });
    const totalBookings = await Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] } });
    const totalUsers = await User.countDocuments();

    // Count unique sports
    const sportsList = await Venue.distinct('sports.name');

    res.json({
      success: true,
      data: {
        totalVenues,
        totalBookings,
        totalUsers,
        totalSports: sportsList.length,
        sports: sportsList,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
