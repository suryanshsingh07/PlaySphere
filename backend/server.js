const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Clean up Client URL (CORS trailing slash fix)
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const productionOrigin = rawClientUrl.replace(/\/$/, '');

// Allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  productionOrigin,
].filter((v, i, a) => a.indexOf(v) === i); // dedupe

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const venueRoutes = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const httpServer = createServer(app);

// ── Socket.IO Setup ──────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('join:venue', (venueId) => {
    socket.join(`venue:${venueId}`);
  });

  socket.on('leave:venue', (venueId) => {
    socket.leave(`venue:${venueId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Bootstrap Admin User
const bootstrapAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.SUPERUSER_EMAIL || 'admin@playsphere.in';
    const adminPassword = process.env.SUPERUSER_PASSWORD || 'admin123';

    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      // Only update fields that don't trigger the password pre-save hook
      // Use direct DB update to avoid re-hashing an already-hashed password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.findByIdAndUpdate(adminUser._id, {
        email: adminEmail,
        password: hashedPassword,
        username: 'playsphere_admin',
        role: 'admin',
        isApproved: true,
        isActive: true,
      });
      console.log('✅ Superuser (Admin) account bootstrapped/updated successfully');
    } else {
      await User.create({
        username: 'playsphere_admin',
        email: adminEmail,
        password: adminPassword, // pre-save hook hashes this on create
        role: 'admin',
        phone: '9876543210',
        isApproved: true,
        isActive: true,
      });
      console.log('✅ Superuser (Admin) account created successfully');
    }
  } catch (err) {
    console.error('❌ Failed to bootstrap admin user:', err.message);
  }
};

// ── Connect to Database ──────────────────────────────────
connectDB().then(() => {
  bootstrapAdmin();
});

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (dev) ─────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    success: true,
    server: 'Running',
    database: dbState[mongoose.connection.readyState] || 'Unknown',
    platform: 'PlaySphere API v1.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       🏟️  PlaySphere API Server           ║
║  Port: ${PORT}   Environment: ${process.env.NODE_ENV || 'development'}    ║
║  Docs: http://localhost:${PORT}/api/health   ║
╚═══════════════════════════════════════════╝
  `);
});
