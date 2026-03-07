const { pool } = require('./config/database');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/database');
const { identifyGym } = require('./middleware/gymContext');

const app = express();
const PORT = process.env.PORT || 10000;


const helmet = require('helmet');

const Sentry = require('@sentry/node');

// CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());


app.use(helmet({
  contentSecurityPolicy: false // Allow React to work
}));

// CORS fixed
const corsOptions = {
  origin: [
    'https://atom-fitness-app.onrender.com',  // Only your frontend
    // Remove localhost in production:
    // 'http://localhost:3000',
    // 'http://localhost:3001',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Apply gym context middleware to all API routes
app.use('/api', identifyGym);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ATOM FITNESS API', status: 'running' });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ATOM FITNESS API runninggg', status: 'running' });
});

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
const staffRoutes = require('./routes/staff');
const gymRoutes = require('./routes/gyms');
const planRoutes = require('./routes/plans');

 
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/gym-qr', gymQRRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/gyms', gymRoutes);
  app.use('/api/plans', planRoutes);

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
  console.log('  GET  /api/members');
  console.log('  POST /api/members');
  console.log('  GET  /api/staff');
  console.log('  POST /api/staff');
  console.log('  GET  /api/gyms/current');
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


