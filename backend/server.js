const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS - Allow all origins
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ATOM FITNESS API', status: 'running' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ATOM FITNESS API is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
const { testConnection } = require('./config/database');
testConnection();

// Import and mount routes
try {
  const authRoutes = require('./routes/auth');
  const memberRoutes = require('./routes/members');
  const subscriptionRoutes = require('./routes/subscriptions');
  const attendanceRoutes = require('./routes/attendance');
  const gymQRRoutes = require('./routes/gymQR');

  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/gym-qr', gymQRRoutes);
  
  console.log('✅ All routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path,
    method: req.method
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
});