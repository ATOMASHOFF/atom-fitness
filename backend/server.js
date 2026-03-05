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

// Start server (THIS MUST BE AT THE END!)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('=================================');
  console.log('Available routes:');
  console.log('  GET  /');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
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


// TEMPORARY - Create admin endpoint
app.post('/api/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { pool } = require('./config/database');
    
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Delete existing
    await pool.query("DELETE FROM members WHERE email = 'admin@atomfitness.com'");
    
    // Create new
    const result = await pool.query(
      `INSERT INTO members (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role`,
      ['Super Admin', 'admin@atomfitness.com', hashedPassword, 'admin', true]
    );
    
    res.json({ success: true, admin: result.rows[0], hash: hashedPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});