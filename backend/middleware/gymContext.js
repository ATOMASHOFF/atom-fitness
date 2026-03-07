const { pool } = require('../config/database');

// Middleware to identify gym from subdomain or header
const identifyGym = async (req, res, next) => {
  try {
    let gymSlug = null;
    
    // Option 1: Get gym from subdomain (e.g., atom-fitness.yourapp.com)
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    
    // Option 2: Get gym from custom header (for development)
    const gymHeader = req.headers['x-gym-slug'];
    
    // Option 3: Get gym from user's token (if logged in)
    if (req.user && req.user.gym_id) {
      const gymResult = await pool.query(
        'SELECT * FROM gyms WHERE id = $1 AND is_active = true',
        [req.user.gym_id]
      );
      
      if (gymResult.rows.length > 0) {
        req.gym = gymResult.rows[0];
        return next();
      }
    }
    
    // Use header or subdomain
    gymSlug = gymHeader || subdomain;
    
    // For development/single tenant, use default gym
    if (!gymSlug || gymSlug === 'localhost' || gymSlug === 'atom-fitness-api') {
      gymSlug = 'atom-fitness'; // Default gym
    }
    
    // Fetch gym from database
    const result = await pool.query(
      'SELECT * FROM gyms WHERE slug = $1 AND is_active = true',
      [gymSlug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }
    
    req.gym = result.rows[0];
    next();
    
  } catch (err) {
    console.error('Gym context error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error identifying gym' 
    });
  }
};

module.exports = { identifyGym };