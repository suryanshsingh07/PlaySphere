const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'playsphere_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, phone, preferredSports } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password' });
    }

    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',
      phone: phone || '',
      preferredSports: preferredSports || [],
      isApproved: role === 'venue_owner' ? false : true,
    });

    if (user) {
      if (user.role === 'venue_owner' && !user.isApproved) {
        return res.status(201).json({
          success: true,
          message: 'Registration successful! Your owner account is pending admin approval.',
          pendingApproval: true,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          preferredSports: user.preferredSports,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }
      if (user.role === 'venue_owner' && !user.isApproved) {
        return res.status(403).json({ success: false, message: 'Your venue owner account is pending approval by the Admin.' });
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          preferredSports: user.preferredSports,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const { authorize } = require('../middleware/authMiddleware');

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve/Reject owner account (Admin only)
// @route   PUT /api/auth/users/:id/approve
// @access  Private/Admin
router.put('/users/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'venue_owner') {
      return res.status(400).json({ success: false, message: 'User is not a venue owner' });
    }

    user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : true;
    await user.save();

    res.json({ success: true, message: `Owner account ${user.isApproved ? 'approved' : 'unapproved'} successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle active status of user profile (Admin only)
// @route   PUT /api/auth/users/:id/toggle-active
// @access  Private/Admin
router.put('/users/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect against self-deactivation
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User profile ${user.isActive ? 'activated' : 'deactivated'} successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete user profile & cascade data (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect against self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const Venue = require('../models/Venue');
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');

    // If owner, delete all owned venues and their bookings
    if (user.role === 'venue_owner') {
      const venues = await Venue.find({ owner: user._id });
      const venueIds = venues.map(v => v._id);
      
      await Booking.deleteMany({ venue: { $in: venueIds } });
      await Venue.deleteMany({ owner: user._id });
    }

    // Delete bookings and reviews created by this user
    await Booking.deleteMany({ user: user._id });
    await Review.deleteMany({ user: user._id });

    // Finally delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User profile and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { username, phone, preferredSports } = req.body;
    
    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (phone !== undefined) user.phone = phone;
    if (preferredSports !== undefined) user.preferredSports = preferredSports;

    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferredSports: user.preferredSports,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Get all venues
// @route   GET /api/auth/admin/venues
// @access  Private/Admin
router.get('/admin/venues', protect, authorize('admin'), async (req, res) => {
  try {
    const Venue = require('../models/Venue');
    const venues = await Venue.find({}).populate('owner', 'username email').sort({ createdAt: -1 });
    res.json({ success: true, count: venues.length, data: venues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Toggle venue active status
// @route   PUT /api/auth/admin/venues/:id/toggle-active
// @access  Private/Admin
router.put('/admin/venues/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const Venue = require('../models/Venue');
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
    venue.isActive = !venue.isActive;
    await venue.save();
    res.json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Delete a venue and its bookings/reviews
// @route   DELETE /api/auth/admin/venues/:id
// @access  Private/Admin
router.delete('/admin/venues/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Venue = require('../models/Venue');
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
    await Booking.deleteMany({ venue: venue._id });
    await Review.deleteMany({ venue: venue._id });
    await Venue.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Venue and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Get all bookings
// @route   GET /api/auth/admin/bookings
// @access  Private/Admin
router.get('/admin/bookings', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({})
      .populate('user', 'username email')
      .populate('venue', 'name area')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Update booking status
// @route   PUT /api/auth/admin/bookings/:id/status
// @access  Private/Admin
router.put('/admin/bookings/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'cancelled' ? { paymentStatus: 'refunded' } : status === 'confirmed' ? { paymentStatus: 'paid' } : {}) },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin: Delete a booking
// @route   DELETE /api/auth/admin/bookings/:id
// @access  Private/Admin
router.delete('/admin/bookings/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
