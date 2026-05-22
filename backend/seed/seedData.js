require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('../config/mongooseMock');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// ── Seed Data ────────────────────────────────────────────

const users = [
  {
    username: 'playsphere_admin',
    email: 'admin@playsphere.in',
    password: 'admin123',
    role: 'admin',
    phone: '9876543210',
    preferredSports: ['football', 'cricket'],
    skillLevel: 'professional',
  },
  {
    username: 'rahul_sports',
    email: 'rahul@playsphere.in',
    password: 'password123',
    role: 'venue_owner',
    phone: '9123456789',
    preferredSports: ['badminton', 'tennis'],
    skillLevel: 'advanced',
  },
  {
    username: 'priya_athlete',
    email: 'priya@playsphere.in',
    password: 'password123',
    role: 'venue_owner',
    phone: '9234567890',
    preferredSports: ['swimming', 'gym'],
    skillLevel: 'advanced',
  },
  {
    username: 'arjun_player',
    email: 'arjun@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9345678901',
    preferredSports: ['football', 'badminton'],
    skillLevel: 'intermediate',
  },
  {
    username: 'sneha_sports',
    email: 'sneha@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9456789012',
    preferredSports: ['tennis', 'swimming'],
    skillLevel: 'beginner',
  },
];

const getVenues = (ownerIds) => [
  {
    name: 'Gomti Nagar Sports Arena',
    description: 'Premium multi-sport complex in the heart of Gomti Nagar with professional-grade courts and top-notch amenities.',
    address: 'Sector 8, Gomti Nagar, Lucknow',
    area: 'Gomti Nagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9933, 26.8554] },
    sports: [
      { name: 'badminton', courts: 4, pricePerHour: 400, maxPlayers: 4 },
      { name: 'table-tennis', courts: 2, pricePerHour: 200, maxPlayers: 2 },
      { name: 'squash', courts: 2, pricePerHour: 500, maxPlayers: 2 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'ac', 'floodlights'],
    owner: ownerIds[0],
    rating: 4.7,
    totalReviews: 128,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876540001',
    contactEmail: 'gomtisports@playsphere.in',
  },
  {
    name: 'Hazratganj Cricket Ground',
    description: 'Historical cricket venue near Hazratganj with well-maintained pitches, professional coaching, and a great atmosphere for serious cricket lovers.',
    address: 'Near Gandhi Park, Hazratganj, Lucknow',
    area: 'Hazratganj',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9462, 26.8508] },
    sports: [
      { name: 'cricket', courts: 2, pricePerHour: 800, maxPlayers: 22 },
    ],
    amenities: ['parking', 'changing-rooms', 'first-aid', 'coaching', 'seating-area', 'drinking-water'],
    owner: ownerIds[1],
    rating: 4.5,
    totalReviews: 89,
    operatingHours: { open: '05:00', close: '20:00' },
    contactPhone: '9876540002',
    contactEmail: 'hazratganj.cricket@playsphere.in',
  },
  {
    name: 'Indira Nagar Football Hub',
    description: 'Top-rated artificial turf football facility with FIFA-quality playing surface, full floodlights for night games and tournament infrastructure.',
    address: 'Sector B, Indira Nagar, Lucknow',
    area: 'Indira Nagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9700, 26.8755] },
    sports: [
      { name: 'football', courts: 2, pricePerHour: 1200, maxPlayers: 22 },
      { name: 'volleyball', courts: 1, pricePerHour: 500, maxPlayers: 12 },
    ],
    amenities: ['parking', 'floodlights', 'changing-rooms', 'first-aid', 'equipment-rental', 'seating-area'],
    owner: ownerIds[0],
    rating: 4.8,
    totalReviews: 212,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876540003',
    contactEmail: 'indiranagar.football@playsphere.in',
  },
  {
    name: 'Aliganj Aquatic Centre',
    description: 'Olympic-standard swimming pool and aquatic training center with heated pool, lanes for competitive swimming and water aerobics.',
    address: 'Sector C, Aliganj, Lucknow',
    area: 'Aliganj',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9524, 26.8846] },
    sports: [
      { name: 'swimming', courts: 1, pricePerHour: 300, maxPlayers: 20 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'coaching', 'first-aid', 'drinking-water', 'ac'],
    owner: ownerIds[1],
    rating: 4.6,
    totalReviews: 176,
    operatingHours: { open: '05:30', close: '21:00' },
    contactPhone: '9876540004',
    contactEmail: 'aliganj.aquatic@playsphere.in',
  },
  {
    name: 'Chinhat Tennis Club',
    description: 'Exclusive tennis club with clay and hard courts, professional coaching for all age groups, and a vibrant tennis community.',
    address: 'Main Road, Chinhat, Lucknow',
    area: 'Chinhat',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [81.0372, 26.8467] },
    sports: [
      { name: 'tennis', courts: 3, pricePerHour: 600, maxPlayers: 4 },
      { name: 'badminton', courts: 2, pricePerHour: 350, maxPlayers: 4 },
    ],
    amenities: ['parking', 'coaching', 'changing-rooms', 'cafeteria', 'equipment-rental', 'floodlights'],
    owner: ownerIds[0],
    rating: 4.4,
    totalReviews: 93,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876540005',
    contactEmail: 'chinhat.tennis@playsphere.in',
  },
  {
    name: 'Jankipuram Fitness & Sports Hub',
    description: 'Modern fitness center with a state-of-the-art gym, indoor basketball court and yoga studio in a premium setting.',
    address: 'Vikas Khand, Jankipuram, Lucknow',
    area: 'Jankipuram',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9200, 26.9150] },
    sports: [
      { name: 'gym', courts: 1, pricePerHour: 150, maxPlayers: 30 },
      { name: 'basketball', courts: 1, pricePerHour: 700, maxPlayers: 10 },
    ],
    amenities: ['parking', 'ac', 'changing-rooms', 'showers', 'coaching', 'drinking-water', 'wifi'],
    owner: ownerIds[1],
    rating: 4.3,
    totalReviews: 141,
    operatingHours: { open: '05:00', close: '23:00' },
    contactPhone: '9876540006',
    contactEmail: 'jankipuram.fitness@playsphere.in',
  },
  {
    name: 'Mahanagar Multi-Sports Complex',
    description: 'A versatile sports complex offering a wide range of indoor and outdoor sports, ideal for families and competitive players.',
    address: 'Mahanagar Extension, Lucknow',
    area: 'Mahanagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9650, 26.8600] },
    sports: [
      { name: 'badminton', courts: 6, pricePerHour: 350, maxPlayers: 4 },
      { name: 'table-tennis', courts: 4, pricePerHour: 180, maxPlayers: 2 },
      { name: 'volleyball', courts: 2, pricePerHour: 450, maxPlayers: 12 },
    ],
    amenities: ['parking', 'changing-rooms', 'cafeteria', 'first-aid', 'floodlights', 'drinking-water'],
    owner: ownerIds[0],
    rating: 4.5,
    totalReviews: 167,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876540007',
    contactEmail: 'mahanagar.sports@playsphere.in',
  },
  {
    name: 'Rajajipuram Cricket Academy',
    description: 'Professional cricket academy with net practice facilities, bowling machines, and expert coaching for budding cricketers.',
    address: 'Block D, Rajajipuram, Lucknow',
    area: 'Rajajipuram',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9150, 26.8300] },
    sports: [
      { name: 'cricket', courts: 3, pricePerHour: 700, maxPlayers: 22 },
    ],
    amenities: ['parking', 'coaching', 'equipment-rental', 'changing-rooms', 'first-aid', 'drinking-water'],
    owner: ownerIds[1],
    rating: 4.6,
    totalReviews: 88,
    operatingHours: { open: '05:00', close: '21:00' },
    contactPhone: '9876540008',
    contactEmail: 'rajajipuram.cricket@playsphere.in',
  },
  {
    name: 'Eldeco Badminton Academy',
    description: 'Specialized badminton academy with BWF-standard synthetic courts, LED lighting and high-performance coaching programs.',
    address: 'Eldeco Colony, Lucknow',
    area: 'Eldeco',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9850, 26.8000] },
    sports: [
      { name: 'badminton', courts: 8, pricePerHour: 450, maxPlayers: 4 },
    ],
    amenities: ['parking', 'ac', 'changing-rooms', 'showers', 'coaching', 'equipment-rental', 'cafeteria'],
    owner: ownerIds[0],
    rating: 4.9,
    totalReviews: 245,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876540009',
    contactEmail: 'eldeco.badminton@playsphere.in',
  },
  {
    name: 'Vikas Nagar Football & Basketball Arena',
    description: 'Multi-purpose arena featuring football turf and basketball courts, perfect for team sports and tournaments.',
    address: 'Sector 12, Vikas Nagar, Lucknow',
    area: 'Vikas Nagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9350, 26.9000] },
    sports: [
      { name: 'football', courts: 1, pricePerHour: 1000, maxPlayers: 22 },
      { name: 'basketball', courts: 2, pricePerHour: 600, maxPlayers: 10 },
    ],
    amenities: ['parking', 'floodlights', 'changing-rooms', 'first-aid', 'seating-area'],
    owner: ownerIds[1],
    rating: 4.2,
    totalReviews: 72,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876540010',
    contactEmail: 'vikasnagar.arena@playsphere.in',
  },
  {
    name: 'Sahara Sports Village',
    description: 'Sprawling sports village with 15+ facilities, from cricket to squash, a favorite for corporate tournaments and weekend leagues.',
    address: 'Sahara Estate, Lucknow',
    area: 'Sahara',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9050, 26.8200] },
    sports: [
      { name: 'cricket', courts: 2, pricePerHour: 900, maxPlayers: 22 },
      { name: 'football', courts: 1, pricePerHour: 1100, maxPlayers: 22 },
      { name: 'squash', courts: 3, pricePerHour: 500, maxPlayers: 2 },
      { name: 'tennis', courts: 2, pricePerHour: 600, maxPlayers: 4 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'first-aid', 'coaching', 'floodlights', 'seating-area', 'wifi'],
    owner: ownerIds[0],
    rating: 4.7,
    totalReviews: 319,
    operatingHours: { open: '05:00', close: '23:00' },
    contactPhone: '9876540011',
    contactEmail: 'sahara.sports@playsphere.in',
  },
  {
    name: 'Kapoorthala Squash & Racket Club',
    description: 'Dedicated racket sports club with glass-backed squash courts, table tennis and a loyal community of racket sport enthusiasts.',
    address: 'Kapoorthala Complex, Lucknow',
    area: 'Kapoorthala',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9420, 26.8480] },
    sports: [
      { name: 'squash', courts: 4, pricePerHour: 450, maxPlayers: 2 },
      { name: 'table-tennis', courts: 6, pricePerHour: 200, maxPlayers: 2 },
      { name: 'badminton', courts: 3, pricePerHour: 380, maxPlayers: 4 },
    ],
    amenities: ['parking', 'ac', 'changing-rooms', 'showers', 'cafeteria', 'coaching', 'equipment-rental'],
    owner: ownerIds[1],
    rating: 4.4,
    totalReviews: 104,
    operatingHours: { open: '07:00', close: '22:00' },
    contactPhone: '9876540012',
    contactEmail: 'kapoorthala.racket@playsphere.in',
  },
  {
    name: 'Aashiana Swimming & Wellness',
    description: 'Serene wellness centre with an indoor heated pool, sauna, yoga studio and aqua aerobics sessions for all fitness levels.',
    address: 'Aashiana Colony, Lucknow',
    area: 'Aashiana',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9300, 26.8150] },
    sports: [
      { name: 'swimming', courts: 1, pricePerHour: 350, maxPlayers: 15 },
      { name: 'gym', courts: 1, pricePerHour: 120, maxPlayers: 25 },
    ],
    amenities: ['parking', 'ac', 'changing-rooms', 'showers', 'coaching', 'drinking-water', 'first-aid'],
    owner: ownerIds[0],
    rating: 4.5,
    totalReviews: 131,
    operatingHours: { open: '05:30', close: '21:30' },
    contactPhone: '9876540013',
    contactEmail: 'aashiana.wellness@playsphere.in',
  },
  {
    name: 'Aminabad Basketball Court',
    description: 'Outdoor and indoor basketball courts in central Lucknow, hosting regular 3v3 and 5v5 leagues for all skill levels.',
    address: 'Near Aminabad Market, Lucknow',
    area: 'Aminabad',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9380, 26.8425] },
    sports: [
      { name: 'basketball', courts: 3, pricePerHour: 650, maxPlayers: 10 },
    ],
    amenities: ['parking', 'floodlights', 'drinking-water', 'seating-area', 'first-aid'],
    owner: ownerIds[1],
    rating: 4.1,
    totalReviews: 57,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876540014',
    contactEmail: 'aminabad.basketball@playsphere.in',
  },
  {
    name: 'Cantt Sports Ground',
    description: 'Historic cantonment sports ground with premium cricket and football facilities, maintained to military precision standards.',
    address: 'Cantonment Area, Lucknow',
    area: 'Cantt',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9580, 26.8280] },
    sports: [
      { name: 'cricket', courts: 1, pricePerHour: 1000, maxPlayers: 22 },
      { name: 'football', courts: 1, pricePerHour: 1300, maxPlayers: 22 },
    ],
    amenities: ['parking', 'changing-rooms', 'first-aid', 'seating-area', 'coaching', 'drinking-water'],
    owner: ownerIds[0],
    rating: 4.6,
    totalReviews: 143,
    operatingHours: { open: '06:00', close: '20:00' },
    contactPhone: '9876540015',
    contactEmail: 'cantt.sports@playsphere.in',
  },
];

async function seedData() {
  try {
    await connectDB();

    console.log('🌱 Starting PlaySphere database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Map roles to user IDs for venue owners
    const owners = createdUsers.filter((u) => u.role === 'venue_owner' || u.role === 'admin');
    const ownerIds = [owners[0]._id, owners[1]._id];

    // Create venues
    const venueData = getVenues(ownerIds);
    const createdVenues = await Venue.create(venueData);
    console.log(`✅ Created ${createdVenues.length} venues in Lucknow`);

    // Create sample reviews
    const regularUsers = createdUsers.filter((u) => u.role === 'user');
    const reviewData = [];

    createdVenues.slice(0, 6).forEach((venue, vi) => {
      regularUsers.forEach((user, ui) => {
        reviewData.push({
          user: user._id,
          venue: venue._id,
          rating: 4 + Math.floor(Math.random() * 2),
          comment: [
            'Excellent facilities and very well maintained!',
            'Great experience, will definitely come back.',
            'Loved the amenities and professional staff.',
            'Best sports complex in Lucknow!',
          ][ui % 4],
        });
      });
    });

    // Skip Review model's post-save hook during seeding by inserting directly
    await Review.insertMany(reviewData);
    console.log(`✅ Created ${reviewData.length} reviews`);

    // Create sample bookings
    const bookingData = [];
    const sports = ['football', 'cricket', 'badminton', 'tennis', 'swimming'];
    const times = ['08:00', '10:00', '14:00', '17:00', '19:00'];

    for (let i = 0; i < 30; i++) {
      const venue = createdVenues[i % createdVenues.length];
      const user = regularUsers[i % regularUsers.length];
      const date = new Date();
      date.setDate(date.getDate() + (i % 14) - 7);
      date.setHours(0, 0, 0, 0);

      const availableSport = venue.sports[0];
      const startTime = times[i % times.length];
      const startHour = parseInt(startTime.split(':')[0]);
      const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

      bookingData.push({
        user: user._id,
        venue: venue._id,
        sport: availableSport.name,
        court: 1,
        date,
        startTime,
        endTime,
        duration: 1,
        totalPrice: availableSport.pricePerHour,
        playerCount: Math.floor(Math.random() * 4) + 1,
        status: i < 20 ? 'confirmed' : i < 25 ? 'completed' : 'cancelled',
        paymentStatus: i < 20 ? 'paid' : 'pending',
        isAgentBooked: i % 3 === 0,
      });
    }

    await Booking.insertMany(bookingData);
    console.log(`✅ Created ${bookingData.length} sample bookings`);

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 PlaySphere seed complete!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin:       admin@playsphere.in       / admin123');
    console.log('   Venue Owner: rahul@playsphere.in       / password123');
    console.log('   Player:      arjun@playsphere.in       / password123');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedData();
