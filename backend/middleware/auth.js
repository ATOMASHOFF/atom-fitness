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



  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });

// Check if user is staff
const requireStaff = (req, res, next) => {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ 
      success: false, 
      message: 'Staff access required' 
    });
  }
  next();
};

// Check if user is admin or staff
const requireAdminOrStaff = (req, res, next) => {
  if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin or staff access required' 
    });
  }
  next();
};

// Check specific staff permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Staff - check permissions
      if (req.user.role === 'staff') {
        const result = await pool.query(
          `SELECT ${permission} FROM staff_permissions 
           WHERE staff_id = $1 AND gym_id = $2`,
          [req.user.id, req.user.gym_id]
        );
        
        if (result.rows.length === 0 || !result.rows[0][permission]) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to perform this action' 
          });
        }
        
        return next();
      }
      
      // Not admin or staff
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      
    } catch (err) {
      console.error('Permission check error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions' 
      });
    }
  };
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireMember,
  requireStaff,
  requireAdminOrStaff,
  requirePermission
};