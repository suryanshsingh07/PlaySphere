require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// ── Lucknow venues — real areas from PS-25 ───────────────
const VENUES = [
  {
    name: 'Gomti Nagar Sports Arena',
    description: 'Premium multi-sport complex in the heart of Gomti Nagar with world-class badminton courts, table tennis tables, and squash courts.',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow',
    area: 'Gomti Nagar', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9983, 26.8467] },
    sports: [
      { name: 'badminton', courts: 4, pricePerHour: 300, maxPlayers: 4 },
      { name: 'table-tennis', courts: 3, pricePerHour: 200, maxPlayers: 4 },
      { name: 'squash', courts: 2, pricePerHour: 350, maxPlayers: 2 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'floodlights', 'coaching', 'drinking-water'],
    rating: 4.7, totalReviews: 48,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876501001', contactEmail: 'gomtinagar@playsphere.in',
  },
  {
    name: 'Hazratganj Cricket Ground',
    description: 'Historic cricket ground near Hazratganj with full-size turf pitch, practice nets, and professional coaching facilities.',
    address: 'Near Hazratganj Market, Lucknow',
    area: 'Hazratganj', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9462, 26.8467] },
    sports: [
      { name: 'cricket', courts: 2, pricePerHour: 800, maxPlayers: 22 },
    ],
    amenities: ['parking', 'changing-rooms', 'floodlights', 'coaching', 'equipment-rental', 'seating-area', 'drinking-water'],
    rating: 4.5, totalReviews: 36,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501002', contactEmail: 'hazratganj@playsphere.in',
  },
  {
    name: 'Indira Nagar Football Hub',
    description: 'Top-rated football turf in Indira Nagar with FIFA-standard artificial grass, floodlights for night games, and changing rooms.',
    address: 'Sector 18, Indira Nagar, Lucknow',
    area: 'Indira Nagar', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9962, 26.8767] },
    sports: [
      { name: 'football', courts: 2, pricePerHour: 1200, maxPlayers: 22 },
      { name: 'volleyball', courts: 1, pricePerHour: 400, maxPlayers: 12 },
    ],
    amenities: ['parking', 'changing-rooms', 'floodlights', 'first-aid', 'drinking-water', 'seating-area'],
    rating: 4.8, totalReviews: 62,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876501003', contactEmail: 'indiranagar@playsphere.in',
  },
  {
    name: 'Aliganj Aquatic Centre',
    description: 'Olympic-size swimming pool with heated water, professional coaching, and separate lanes for competitive and recreational swimmers.',
    address: 'Aliganj Sector C, Lucknow',
    area: 'Aliganj', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9562, 26.8867] },
    sports: [
      { name: 'swimming', courts: 1, pricePerHour: 250, maxPlayers: 30 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'first-aid', 'coaching', 'drinking-water', 'ac'],
    rating: 4.6, totalReviews: 29,
    operatingHours: { open: '05:30', close: '21:00' },
    contactPhone: '9876501004', contactEmail: 'aliganj@playsphere.in',
  },
  {
    name: 'Chinhat Turf & Tennis Club',
    description: 'Modern sports facility in Chinhat with synthetic tennis courts and badminton halls. Popular with IT professionals from nearby tech parks.',
    address: 'Chinhat Industrial Area, Lucknow',
    area: 'Chinhat', city: 'Lucknow',
    location: { type: 'Point', coordinates: [81.0562, 26.8367] },
    sports: [
      { name: 'tennis', courts: 3, pricePerHour: 500, maxPlayers: 4 },
      { name: 'badminton', courts: 2, pricePerHour: 280, maxPlayers: 4 },
    ],
    amenities: ['parking', 'changing-rooms', 'cafeteria', 'coaching', 'equipment-rental', 'floodlights'],
    rating: 4.4, totalReviews: 21,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501005', contactEmail: 'chinhat@playsphere.in',
  },
  {
    name: 'Jankipuram Fitness & Basketball Hub',
    description: 'Multi-purpose sports hub with professional basketball courts and a fully equipped gym. Ideal for fitness enthusiasts and team sports.',
    address: 'Jankipuram Extension, Lucknow',
    area: 'Jankipuram', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9262, 26.9067] },
    sports: [
      { name: 'basketball', courts: 2, pricePerHour: 600, maxPlayers: 10 },
      { name: 'gym', courts: 1, pricePerHour: 150, maxPlayers: 20 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'coaching', 'equipment-rental', 'drinking-water', 'ac'],
    rating: 4.3, totalReviews: 18,
    operatingHours: { open: '05:00', close: '22:00' },
    contactPhone: '9876501006', contactEmail: 'jankipuram@playsphere.in',
  },
  {
    name: 'Mahanagar Multi-Sports Complex',
    description: 'Comprehensive sports complex in Mahanagar offering badminton, table tennis, and volleyball under one roof with professional coaching.',
    address: 'Mahanagar Colony, Lucknow',
    area: 'Mahanagar', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9362, 26.8667] },
    sports: [
      { name: 'badminton', courts: 3, pricePerHour: 260, maxPlayers: 4 },
      { name: 'table-tennis', courts: 4, pricePerHour: 180, maxPlayers: 4 },
      { name: 'volleyball', courts: 1, pricePerHour: 350, maxPlayers: 12 },
    ],
    amenities: ['parking', 'changing-rooms', 'cafeteria', 'coaching', 'drinking-water', 'floodlights'],
    rating: 4.5, totalReviews: 33,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501007', contactEmail: 'mahanagar@playsphere.in',
  },
  {
    name: 'Rajajipuram Cricket Academy',
    description: 'Dedicated cricket academy with turf pitches, bowling machines, video analysis, and professional coaching for all skill levels.',
    address: 'Rajajipuram Block C, Lucknow',
    area: 'Rajajipuram', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.8962, 26.8367] },
    sports: [
      { name: 'cricket', courts: 3, pricePerHour: 700, maxPlayers: 22 },
    ],
    amenities: ['parking', 'changing-rooms', 'coaching', 'equipment-rental', 'floodlights', 'seating-area', 'drinking-water'],
    rating: 4.6, totalReviews: 41,
    operatingHours: { open: '06:00', close: '21:00' },
    contactPhone: '9876501008', contactEmail: 'rajajipuram@playsphere.in',
  },
  {
    name: 'Eldeco Badminton Academy',
    description: 'Elite badminton academy in Eldeco with BWF-standard courts, professional coaching, and regular tournaments. Highest rated in Lucknow.',
    address: 'Eldeco Greens, Lucknow',
    area: 'Eldeco', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9762, 26.8167] },
    sports: [
      { name: 'badminton', courts: 6, pricePerHour: 350, maxPlayers: 4 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'coaching', 'equipment-rental', 'ac', 'floodlights'],
    rating: 4.9, totalReviews: 87,
    operatingHours: { open: '05:30', close: '23:00' },
    contactPhone: '9876501009', contactEmail: 'eldeco@playsphere.in',
  },
  {
    name: 'Vikas Nagar Sports Arena',
    description: 'Affordable multi-sport facility in Vikas Nagar with football turf and basketball courts. Great for casual games and weekend tournaments.',
    address: 'Vikas Nagar Sector 4, Lucknow',
    area: 'Vikas Nagar', city: 'Lucknow',
    location: { type: 'Point', coordinates: [81.0162, 26.8967] },
    sports: [
      { name: 'football', courts: 1, pricePerHour: 900, maxPlayers: 22 },
      { name: 'basketball', courts: 1, pricePerHour: 450, maxPlayers: 10 },
    ],
    amenities: ['parking', 'floodlights', 'drinking-water', 'first-aid'],
    rating: 4.2, totalReviews: 15,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501010', contactEmail: 'vikasnagar@playsphere.in',
  },
  {
    name: 'Sahara Sports Village',
    description: 'Massive sports complex near Sahara with cricket, football, squash, and tennis. One of the largest multi-sport venues in Lucknow.',
    address: 'Sahara City Homes, Lucknow',
    area: 'Sahara', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9662, 26.7967] },
    sports: [
      { name: 'cricket', courts: 2, pricePerHour: 900, maxPlayers: 22 },
      { name: 'football', courts: 2, pricePerHour: 1100, maxPlayers: 22 },
      { name: 'squash', courts: 3, pricePerHour: 400, maxPlayers: 2 },
      { name: 'tennis', courts: 4, pricePerHour: 550, maxPlayers: 4 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'coaching', 'equipment-rental', 'floodlights', 'seating-area', 'first-aid', 'wifi'],
    rating: 4.7, totalReviews: 74,
    operatingHours: { open: '06:00', close: '23:00' },
    contactPhone: '9876501011', contactEmail: 'sahara@playsphere.in',
  },
  {
    name: 'Kapoorthala Racket Club',
    description: 'Specialist racket sports club in Kapoorthala with squash, table tennis, and badminton. Known for competitive leagues and coaching.',
    address: 'Kapoorthala Complex, Lucknow',
    area: 'Kapoorthala', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9162, 26.8567] },
    sports: [
      { name: 'squash', courts: 4, pricePerHour: 380, maxPlayers: 2 },
      { name: 'table-tennis', courts: 5, pricePerHour: 200, maxPlayers: 4 },
      { name: 'badminton', courts: 3, pricePerHour: 290, maxPlayers: 4 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'coaching', 'equipment-rental', 'drinking-water', 'ac'],
    rating: 4.4, totalReviews: 27,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501012', contactEmail: 'kapoorthala@playsphere.in',
  },
  {
    name: 'Aashiana Swimming & Wellness',
    description: 'Premium aquatic and wellness centre in Aashiana with Olympic pool, gym, and yoga studio. Best swimming facility in south Lucknow.',
    address: 'Aashiana Colony, Lucknow',
    area: 'Aashiana', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9062, 26.8167] },
    sports: [
      { name: 'swimming', courts: 1, pricePerHour: 300, maxPlayers: 25 },
      { name: 'gym', courts: 1, pricePerHour: 120, maxPlayers: 30 },
    ],
    amenities: ['parking', 'changing-rooms', 'showers', 'cafeteria', 'coaching', 'first-aid', 'ac', 'drinking-water'],
    rating: 4.5, totalReviews: 39,
    operatingHours: { open: '05:00', close: '21:30' },
    contactPhone: '9876501013', contactEmail: 'aashiana@playsphere.in',
  },
  {
    name: 'Aminabad Basketball Court',
    description: 'Community basketball court in Aminabad with professional flooring, scoreboards, and evening floodlights for night games.',
    address: 'Aminabad Park Road, Lucknow',
    area: 'Aminabad', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9262, 26.8467] },
    sports: [
      { name: 'basketball', courts: 2, pricePerHour: 400, maxPlayers: 10 },
    ],
    amenities: ['parking', 'floodlights', 'drinking-water', 'seating-area'],
    rating: 4.1, totalReviews: 12,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '9876501014', contactEmail: 'aminabad@playsphere.in',
  },
  {
    name: 'Cantt Sports Ground',
    description: 'Well-maintained sports ground in the Cantonment area with cricket and football facilities. Popular with defence personnel and families.',
    address: 'Cantonment Area, Lucknow',
    area: 'Cantt', city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9362, 26.8267] },
    sports: [
      { name: 'cricket', courts: 2, pricePerHour: 650, maxPlayers: 22 },
      { name: 'football', courts: 1, pricePerHour: 1000, maxPlayers: 22 },
    ],
    amenities: ['parking', 'changing-rooms', 'floodlights', 'seating-area', 'drinking-water', 'first-aid'],
    rating: 4.6, totalReviews: 31,
    operatingHours: { open: '06:00', close: '21:00' },
    contactPhone: '9876501015', contactEmail: 'cantt@playsphere.in',
  },
];

const USERS = [
  {
    username: 'arjun_striker',
    email: 'arjun@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9876500001',
    preferredSports: ['football', 'cricket'],
    skillLevel: 'intermediate',
    isApproved: true, isActive: true,
  },
  {
    username: 'priya_smash',
    email: 'priya@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9876500002',
    preferredSports: ['badminton', 'swimming'],
    skillLevel: 'advanced',
    isApproved: true, isActive: true,
  },
  {
    username: 'rahul_venues',
    email: 'rahul@playsphere.in',
    password: 'password123',
    role: 'venue_owner',
    phone: '9876500003',
    preferredSports: [],
    skillLevel: 'intermediate',
    isApproved: true, isActive: true,
  },
  {
    username: 'sneha_player',
    email: 'sneha@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9876500004',
    preferredSports: ['tennis', 'basketball'],
    skillLevel: 'beginner',
    isApproved: true, isActive: true,
  },
  {
    username: 'vikram_sports',
    email: 'vikram@playsphere.in',
    password: 'password123',
    role: 'user',
    phone: '9876500005',
    preferredSports: ['cricket', 'badminton', 'squash'],
    skillLevel: 'professional',
    isApproved: true, isActive: true,
  },
];

const REVIEWS = [
  { venueIdx: 0, userIdx: 0, rating: 5, comment: 'Best badminton courts in Lucknow! Excellent flooring and lighting.' },
  { venueIdx: 0, userIdx: 1, rating: 4, comment: 'Great facility, staff is helpful. Parking can be tight on weekends.' },
  { venueIdx: 1, userIdx: 0, rating: 5, comment: 'Amazing cricket ground. The pitch is well-maintained and coaching is top-notch.' },
  { venueIdx: 1, userIdx: 4, rating: 4, comment: 'Good ground but booking process could be smoother. PlaySphere made it easy!' },
  { venueIdx: 2, userIdx: 0, rating: 5, comment: 'Best football turf in Indira Nagar. Artificial grass is FIFA quality.' },
  { venueIdx: 2, userIdx: 3, rating: 5, comment: 'Loved the floodlights for night games. Will definitely come back!' },
  { venueIdx: 3, userIdx: 1, rating: 5, comment: 'Olympic-size pool with crystal clear water. Coaching is excellent.' },
  { venueIdx: 4, userIdx: 3, rating: 4, comment: 'Good tennis courts. Slightly expensive but worth it for the quality.' },
  { venueIdx: 5, userIdx: 4, rating: 4, comment: 'Solid basketball courts. Gym equipment is modern and well-maintained.' },
  { venueIdx: 8, userIdx: 1, rating: 5, comment: 'Eldeco is simply the best badminton academy in Lucknow. Period.' },
  { venueIdx: 8, userIdx: 4, rating: 5, comment: 'Professional-grade courts, excellent coaching. Worth every rupee.' },
  { venueIdx: 10, userIdx: 0, rating: 5, comment: 'Sahara Sports Village is massive! Great for all sports under one roof.' },
];

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting PlaySphere database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create ONLY admin/superuser
    const adminUser = await User.create({
      username: 'playsphere_admin',
      email: 'admin@playsphere.in',
      password: 'admin123',
      role: 'admin',
      phone: '9876543210',
      isApproved: true,
      isActive: true,
    });
    console.log('✅ Admin user created');

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 PlaySphere seed complete!\n');
    console.log('📋 Superuser Credentials:');
    console.log('   Admin:       admin@playsphere.in       / admin123');
    console.log('\n💡 All other data (users, venues, bookings) will be created dynamically by users.');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
