const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/database');
const { identifyGym } = require('./middleware/gymContext');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test database
testConnection();

// Apply gym context middleware to all API routes
app.use('/api', identifyGym);

// Import routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const subscriptionRoutes = require('./routes/subscriptions');
const attendanceRoutes = require('./routes/attendance');
const gymQRRoutes = require('./routes/gymQR');
const staffRoutes = require('./routes/staff');
const gymRoutes = require('./routes/gyms');
const planRoutes = require('./routes/plans');

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ATOM FITNESS API', status: 'running', version: '2.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ATOM FITNESS API is running',
    timestamp: new Date().toISOString(),
    features: ['Multi-tenant', 'RBAC', 'Gym QR Validation']
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gym-qr', gymQRRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/plans', planRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('=================================');
  console.log('Available routes:');
  console.log('  GET  / - API Info');
  console.log('  GET  /api/health - Health Check');
  console.log('  POST /api/auth/login - Login');
  console.log('  GET  /api/members - List Members');
  console.log('  POST /api/staff - Create Staff');
  console.log('  GET  /api/gyms/current - Gym Details');
  console.log('=================================');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  console.log(`✅ Server is listening on ${addr.address}:${addr.port}`);
});