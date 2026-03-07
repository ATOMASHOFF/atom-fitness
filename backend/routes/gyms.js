const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get current gym details
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      'SELECT * FROM gyms WHERE id = $1',
      [gym_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    res.json({ success: true, gym: result.rows[0] });
  } catch (err) {
    console.error('Get gym error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update gym details (admin only)
router.put('/current', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    const { name, owner_name, owner_email, owner_phone, address, logo_url } = req.body;
    
    const result = await pool.query(
      `UPDATE gyms SET
        name = COALESCE($1, name),
        owner_name = COALESCE($2, owner_name),
        owner_email = COALESCE($3, owner_email),
        owner_phone = COALESCE($4, owner_phone),
        address = COALESCE($5, address),
        logo_url = COALESCE($6, logo_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, owner_name, owner_email, owner_phone, address, logo_url, gym_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Gym details updated', 
      gym: result.rows[0] 
    });
  } catch (err) {
    console.error('Update gym error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get gym statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    
    const totalMembers = await pool.query(
      `SELECT COUNT(*) FROM members 
       WHERE gym_id = $1 AND role = 'member' AND is_active = true`,
      [gym_id]
    );
    
    const totalStaff = await pool.query(
      `SELECT COUNT(*) FROM members 
       WHERE gym_id = $1 AND role = 'staff' AND is_active = true`,
      [gym_id]
    );
    
    const totalRevenue = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total 
       FROM subscriptions 
       WHERE gym_id = $1 AND status != 'cancelled'`,
      [gym_id]
    );
    
    const monthRevenue = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total 
       FROM subscriptions 
       WHERE gym_id = $1 
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [gym_id]
    );
    
    const totalCheckIns = await pool.query(
      `SELECT COUNT(*) FROM attendance_logs WHERE gym_id = $1`,
      [gym_id]
    );
    
    res.json({
      success: true,
      stats: {
        totalMembers: parseInt(totalMembers.rows[0].count),
        totalStaff: parseInt(totalStaff.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        monthRevenue: parseFloat(monthRevenue.rows[0].total),
        totalCheckIns: parseInt(totalCheckIns.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Get gym stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;