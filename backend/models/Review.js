const mongoose = require('../config/mongooseMock');

const ReviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: '',
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
}, { timestamps: true });

// Prevent user from submitting more than one review per venue
ReviewSchema.index({ venue: 1, user: 1 }, { unique: true });

// Static method to recalculate venue rating
ReviewSchema.statics.calcAverageRating = async function (venueId) {
  const Venue = mongoose.model('Venue');
  const stats = await this.aggregate([
    { $match: { venue: venueId } },
    {
      $group: {
        _id: '$venue',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Venue.findByIdAndUpdate(venueId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    await Venue.findByIdAndUpdate(venueId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};

// Recalculate after save
ReviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.venue);
});

// Recalculate after remove
ReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calcAverageRating(this.venue);
});

module.exports = mongoose.model('Review', ReviewSchema);
