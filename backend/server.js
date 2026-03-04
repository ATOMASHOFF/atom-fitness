const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');


// Import routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const subscriptionRoutes = require('./routes/subscriptions');
const attendanceRoutes = require('./routes/attendance');
const gymQRRoutes = require('./routes/gymQR');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gym-qr', gymQRRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ATOM FITNESS API is running', 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
const start = async () => {
  await testConnection();
  
  app.listen(PORT, () => {
    console.log('\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║         ATOM FITNESS API SERVER         ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log(`✅ API base URL:      http://localhost:${PORT}/api`);
    console.log(`✅ Health check:      http://localhost:${PORT}/api/health`);
    console.log('');
  });
};

start();
