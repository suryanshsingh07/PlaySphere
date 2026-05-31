const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all venues with filters
// @route   GET /api/venues
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { sport, minPrice, maxPrice, minRating, area, search, sort } = req.query;
    let query = { isActive: true };

    // Filter by sport
    if (sport) {
      query['sports.name'] = sport.toLowerCase();
    }

    // Filter by area
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    // Filter by minimum rating
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort options
    let sortOption = { rating: -1 };
    if (sort === 'price_low') sortOption = { 'sports.pricePerHour': 1 };
    if (sort === 'price_high') sortOption = { 'sports.pricePerHour': -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    let venues = await Venue.find(query)
      .populate('owner', 'username email')
      .sort(sortOption);

    // Post-query price filter (since prices are nested in sports array)
    if (minPrice || maxPrice) {
      venues = venues.filter((venue) => {
        return venue.sports.some((s) => {
          const price = s.pricePerHour;
          if (minPrice && maxPrice) return price >= parseFloat(minPrice) && price <= parseFloat(maxPrice);
          if (minPrice) return price >= parseFloat(minPrice);
          if (maxPrice) return price <= parseFloat(maxPrice);
          return true;
        });
      });
    }

    res.json({ success: true, count: venues.length, data: venues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get distinct sports and areas from active venues
// @route   GET /api/venues/meta
// @access  Public
router.get('/meta', async (req, res) => {
  try {
    const [sports, areas] = await Promise.all([
      Venue.distinct('sports.name', { isActive: true }),
      Venue.distinct('area', { isActive: true }),
    ]);
    res.json({ success: true, data: { sports: sports.sort(), areas: areas.filter(Boolean).sort() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get venues near a location
// @route   GET /api/venues/nearby
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, radius, sport } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'Please provide longitude and latitude' });
    }

    const maxDistance = parseInt(radius) || 10000; // Default 10km in meters

    let query = {
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    if (sport) {
      query['sports.name'] = sport.toLowerCase();
    }

    const venues = await Venue.find(query).populate('owner', 'username email');

    res.json({ success: true, count: venues.length, data: venues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single venue
// @route   GET /api/venues/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('owner', 'username email phone');

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Get reviews for this venue
    const reviews = await Review.find({ venue: req.params.id })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: { ...venue.toObject(), reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a venue
// @route   POST /api/venues
// @access  Private (venue_owner, admin)
router.post('/', protect, authorize('venue_owner', 'admin'), async (req, res) => {
  try {
    const venueData = { ...req.body, owner: req.user._id };
    const venue = await Venue.create(venueData);
    res.status(201).json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a venue
// @route   PUT /api/venues/:id
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    if (venue.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this venue' });
    }

    venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get available time slots for a venue on a date
// @route   GET /api/venues/:id/slots
// @access  Public
router.get('/:id/slots', async (req, res) => {
  try {
    const { date, sport } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date' });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Get existing bookings for this venue on the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      venue: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
      ...(sport ? { sport: sport.toLowerCase() } : {}),
    });

    // Generate all possible time slots
    const openHour = parseInt(venue.operatingHours.open.split(':')[0]);
    const closeHour = parseInt(venue.operatingHours.close.split(':')[0]);
    const allSlots = [];

    for (let h = openHour; h < closeHour; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const endTimeStr = `${(h + 1).toString().padStart(2, '0')}:00`;

      // Check if this slot is booked
      const isBooked = bookings.some(
        (b) => b.startTime === timeStr || (h >= parseInt(b.startTime) && h < parseInt(b.endTime))
      );

      allSlots.push({
        startTime: timeStr,
        endTime: endTimeStr,
        available: !isBooked,
      });
    }

    res.json({ success: true, data: { slots: allSlots, venue: venue.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add review to a venue
// @route   POST /api/venues/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Please add a rating' });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ venue: req.params.id, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this venue' });
    }

    const review = await Review.create({
      user: req.user._id,
      venue: req.params.id,
      rating,
      comment: comment || '',
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'username avatar');

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
