const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Member or admin middleware
const requireMember = (req, res, next) => {
  if (!req.user || !['admin', 'member'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied.' 
    });
  }
  next();
};

// Self or admin - member can only access their own data
const requireSelfOrAdmin = (req, res, next) => {
  const requestedId = req.params.id || req.params.memberId;
  if (req.user.role === 'admin' || req.user.id === requestedId) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own data.' 
    });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  requireMember, 
  requireSelfOrAdmin,
  generateToken 
};
