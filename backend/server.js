const express = require('express');
const cors = require('cors');
const mongoose = require('./config/mongooseMock');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

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
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

// ── Connect to Database ──────────────────────────────────
connectDB();

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
