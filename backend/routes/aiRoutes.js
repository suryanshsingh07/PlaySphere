const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────
// AI Sports Copilot — Rule-based NLP Engine
// Parses natural language queries into structured
// venue search + booking operations
// ──────────────────────────────────────────────

/**
 * Extract structured intent from a natural language query
 * Examples:
 *   "Book badminton tomorrow 7 PM near Gomti Nagar"
 *   "Find football turf under ₹1200 near Chinhat"
 *   "Any cricket ground available Saturday morning?"
 */
function parseUserIntent(message, dynamicAreas = [], dynamicSports = []) {
  const msg = message.toLowerCase();

  const intent = {
    action: 'search',
    sport: null,
    location: null,
    date: null,
    time: null,
    budget: null,
    players: null,
  };

  // Detect action
  if (msg.includes('book') || msg.includes('reserve') || msg.includes('schedule')) {
    intent.action = 'book';
  } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('best')) {
    intent.action = 'recommend';
  } else if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    intent.action = 'info';
  }

  // Detect sport from dynamic DB list, fallback to common aliases
  const sportList = dynamicSports.length > 0 ? dynamicSports : ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'table-tennis', 'volleyball', 'squash', 'gym'];
  for (const sport of sportList) {
    if (msg.includes(sport)) {
      intent.sport = sport;
      break;
    }
  }
  if (!intent.sport) {
    if (msg.includes('turf') || msg.includes('soccer')) intent.sport = 'football';
    if (msg.includes('shuttle') || msg.includes('shuttlecock')) intent.sport = 'badminton';
    if (msg.includes('pool') || msg.includes('swim')) intent.sport = 'swimming';
    if (msg.includes('workout') || msg.includes('fitness')) intent.sport = 'gym';
    if (msg.includes('tt') || msg.includes('ping pong')) intent.sport = 'table-tennis';
  }

  // Detect location using dynamic areas from DB
  for (const area of dynamicAreas) {
    if (msg.includes(area)) {
      intent.location = area;
      break;
    }
  }
  // Generic "near" extraction fallback
  if (!intent.location) {
    const nearMatch = msg.match(/near\s+([a-z\s]+?)(?:\s+(?:tomorrow|today|tonight|morning|evening|for|under|at|in|\d|$))/);
    if (nearMatch) {
      intent.location = nearMatch[1].trim();
    }
  }

  // Detect date
  const today = new Date();
  if (msg.includes('today')) {
    intent.date = today.toISOString().split('T')[0];
  } else if (msg.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    intent.date = tomorrow.toISOString().split('T')[0];
  } else if (msg.includes('day after tomorrow') || msg.includes('day after')) {
    const dat = new Date(today);
    dat.setDate(dat.getDate() + 2);
    intent.date = dat.toISOString().split('T')[0];
  } else {
    // Check for day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (msg.includes(days[i])) {
        const currentDay = today.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7;
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + diff);
        intent.date = targetDate.toISOString().split('T')[0];
        break;
      }
    }
  }

  // Detect time
  const timeMatch = msg.match(/(\d{1,2})\s*(am|pm|:\d{2})/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const suffix = timeMatch[2].toLowerCase();
    if (suffix === 'pm' && hour !== 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    intent.time = `${hour.toString().padStart(2, '0')}:00`;
  } else if (msg.includes('morning')) {
    intent.time = '08:00';
  } else if (msg.includes('afternoon')) {
    intent.time = '14:00';
  } else if (msg.includes('evening')) {
    intent.time = '18:00';
  } else if (msg.includes('night')) {
    intent.time = '20:00';
  }

  // Detect budget
  const budgetMatch = msg.match(/(?:under|below|max|budget|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (budgetMatch) {
    intent.budget = parseInt(budgetMatch[1]);
  }
  const priceMatch = msg.match(/(?:₹|rs\.?|inr)\s*(\d+)/i);
  if (!intent.budget && priceMatch) {
    intent.budget = parseInt(priceMatch[1]);
  }

  // Detect players
  const playerMatch = msg.match(/(\d+)\s*(?:player|people|person|member|friend)/i);
  if (playerMatch) {
    intent.players = parseInt(playerMatch[1]);
  }

  return intent;
}

/**
 * Generate a smart AI response based on parsed intent and search results
 */
function generateResponse(intent, venues, bookingResult) {
  if (bookingResult) {
    return {
      message: `✅ **Booking Confirmed!**\n\n🏟️ **${bookingResult.venue}**\n🏅 ${bookingResult.sport}\n📅 ${bookingResult.date}\n⏰ ${bookingResult.startTime} — ${bookingResult.endTime}\n💰 ₹${bookingResult.totalPrice}\n\nYour slot has been reserved. Have a great game! 🎉`,
      type: 'booking_confirmed',
      data: bookingResult,
    };
  }

  if (venues.length === 0) {
    let suggestion = "I couldn't find any venues matching your criteria.";
    if (intent.sport) suggestion += ` Try searching for ${intent.sport} in a different area.`;
    if (intent.budget) suggestion += ` You could also try increasing your budget.`;
    suggestion += "\n\n💡 Try: *\"Show all badminton courts\"* or *\"Find venues near Gomti Nagar\"*";

    return {
      message: suggestion,
      type: 'no_results',
      data: [],
    };
  }

  let msg = '';

  if (intent.action === 'recommend') {
    msg = `🌟 **Top Recommendations${intent.sport ? ' for ' + intent.sport.charAt(0).toUpperCase() + intent.sport.slice(1) : ''}${intent.location ? ' near ' + intent.location.charAt(0).toUpperCase() + intent.location.slice(1) : ''}:**\n\n`;
  } else {
    msg = `🔍 **Found ${venues.length} venue${venues.length > 1 ? 's' : ''}${intent.sport ? ' for ' + intent.sport.charAt(0).toUpperCase() + intent.sport.slice(1) : ''}${intent.location ? ' near ' + intent.location.charAt(0).toUpperCase() + intent.location.slice(1) : ''}:**\n\n`;
  }

  venues.slice(0, 5).forEach((v, i) => {
    const sportInfo = intent.sport
      ? v.sports.find((s) => s.name === intent.sport)
      : v.sports[0];
    const price = sportInfo ? `₹${sportInfo.pricePerHour}/hr` : 'Price varies';

    msg += `**${i + 1}. ${v.name}** ⭐ ${v.rating}/5\n`;
    msg += `   📍 ${v.area || v.address}\n`;
    msg += `   💰 ${price} | 🏅 ${v.sports.map((s) => s.name).join(', ')}\n`;
    if (v.amenities.length > 0) {
      msg += `   ✨ ${v.amenities.slice(0, 4).join(', ')}\n`;
    }
    msg += '\n';
  });

  if (intent.action === 'book' && venues.length > 0) {
    msg += `\n💬 Would you like me to **book a slot** at any of these venues? Just say the venue number!`;
  }

  return {
    message: msg,
    type: 'venue_list',
    data: venues.slice(0, 5),
  };
}

// @desc    AI Sports Copilot — Chat endpoint
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    // Fetch dynamic areas and sports from DB for NLP matching
    const [dbAreas, dbSports] = await Promise.all([
      Venue.distinct('area', { isActive: true }),
      Venue.distinct('sports.name', { isActive: true }),
    ]);
    const intent = parseUserIntent(
      message,
      dbAreas.filter(Boolean).map(a => a.toLowerCase()),
      dbSports.filter(Boolean)
    );

    // Build venue query from intent
    let query = { isActive: true };
    if (intent.sport) {
      query['sports.name'] = intent.sport;
    }
    if (intent.location) {
      query.$or = [
        { area: { $regex: intent.location, $options: 'i' } },
        { address: { $regex: intent.location, $options: 'i' } },
        { name: { $regex: intent.location, $options: 'i' } },
      ];
    }

    let venues = await Venue.find(query).sort({ rating: -1 }).limit(10);

    // Apply budget filter
    if (intent.budget) {
      venues = venues.filter((v) =>
        v.sports.some((s) => s.pricePerHour <= intent.budget)
      );
    }

    // If booking action and we have enough info, attempt to create a booking
    let bookingResult = null;
    if (intent.action === 'book' && venues.length > 0 && intent.date && intent.time) {
      const venue = venues[0];
      const sportConfig = intent.sport
        ? venue.sports.find((s) => s.name === intent.sport)
        : venue.sports[0];

      if (sportConfig) {
        const startHour = parseInt(intent.time.split(':')[0]);
        const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

        const bookingDate = new Date(intent.date);
        bookingDate.setHours(0, 0, 0, 0);

        // Check for conflicts
        const conflicting = await Booking.findOne({
          venue: venue._id,
          sport: sportConfig.name,
          date: bookingDate,
          startTime: intent.time,
          status: { $in: ['pending', 'confirmed'] },
        });

        if (!conflicting) {
          const booking = await Booking.create({
            user: req.user._id,
            venue: venue._id,
            sport: sportConfig.name,
            court: 1,
            date: bookingDate,
            startTime: intent.time,
            endTime,
            duration: 1,
            totalPrice: sportConfig.pricePerHour,
            playerCount: intent.players || 1,
            isAgentBooked: true,
            status: 'confirmed',
            paymentStatus: 'pending',
          });

          bookingResult = {
            bookingId: booking._id,
            venue: venue.name,
            sport: sportConfig.name,
            date: intent.date,
            startTime: intent.time,
            endTime,
            totalPrice: sportConfig.pricePerHour,
          };
        }
      }
    }

    const response = generateResponse(intent, venues, bookingResult);

    res.json({
      success: true,
      data: {
        intent,
        response: response.message,
        type: response.type,
        venues: response.data,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get personalized recommendations
// @route   GET /api/ai/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    const user = req.user;

    // Build recommendation query based on user preferences
    let query = { isActive: true };
    if (user.preferredSports && user.preferredSports.length > 0) {
      query['sports.name'] = { $in: user.preferredSports };
    }

    const venues = await Venue.find(query)
      .sort({ rating: -1, totalReviews: -1 })
      .limit(10);

    // Score venues based on preferences
    const scoredVenues = venues.map((venue) => {
      let score = venue.rating * 20; // Base score from rating

      // Boost for matching preferred sports
      const matchingSports = venue.sports.filter(
        (s) => user.preferredSports && user.preferredSports.includes(s.name)
      ).length;
      score += matchingSports * 15;

      // Boost for amenities
      score += venue.amenities.length * 2;

      // Boost for more reviews (popularity)
      score += Math.min(venue.totalReviews, 10) * 3;

      return { ...venue.toObject(), recommendationScore: Math.round(score) };
    });

    // Sort by recommendation score
    scoredVenues.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({ success: true, data: scoredVenues.slice(0, 8) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Demand prediction — trending sports, peak times
// @route   GET /api/ai/demand-prediction
// @access  Public
router.get('/demand-prediction', async (req, res) => {
  try {
    // Aggregate booking data for demand insights
    const sportDemand = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$sport', count: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } },
      { $sort: { count: -1 } },
    ]);

    // Peak hours analysis
    const peakHours = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$startTime', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Day-wise demand
    const dayDemand = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: { $dayOfWeek: '$date' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    res.json({
      success: true,
      data: {
        trendingSports: sportDemand,
        peakHours: peakHours.map((h) => ({ time: h._id, bookings: h.count })),
        dayWiseDemand: dayDemand.map((d) => ({ day: dayNames[d._id] || 'N/A', bookings: d.count })),
        insights: {
          mostPopularSport: sportDemand[0]?._id || 'N/A',
          peakHour: peakHours[0]?._id || 'N/A',
          busiestDay: dayNames[dayDemand[0]?._id] || 'N/A',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Dynamic pricing suggestion for a venue
// @route   GET /api/ai/dynamic-pricing/:venueId
// @access  Private (venue_owner)
router.get('/dynamic-pricing/:venueId', protect, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Get booking count for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await Booking.countDocuments({
      venue: req.params.venueId,
      date: { $gte: today, $lte: nextWeek },
      status: { $in: ['pending', 'confirmed'] },
    });

    // Generate dynamic pricing suggestions
    const suggestions = venue.sports.map((sport) => {
      const basePrice = sport.pricePerHour;
      const demandMultiplier = upcomingBookings > 20 ? 1.3 : upcomingBookings > 10 ? 1.15 : 1.0;

      // Time-based adjustments
      const peakPrice = Math.round(basePrice * demandMultiplier * 1.2);
      const offPeakPrice = Math.round(basePrice * 0.8);
      const weekendPrice = Math.round(basePrice * demandMultiplier * 1.15);

      return {
        sport: sport.name,
        basePrice,
        suggestedPricing: {
          peakHours: { time: '17:00 — 21:00', price: peakPrice },
          offPeakHours: { time: '06:00 — 12:00', price: offPeakPrice },
          weekendSurcharge: { price: weekendPrice },
          lastMinuteDiscount: { price: Math.round(basePrice * 0.7), note: 'Within 2 hours of slot' },
          rainyDayDiscount: { price: Math.round(basePrice * 0.6), note: 'Auto-applied on rainy days' },
        },
        demandLevel: upcomingBookings > 20 ? 'High' : upcomingBookings > 10 ? 'Medium' : 'Low',
      };
    });

    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
