const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all plans (anyone authenticated can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `SELECT * FROM membership_plans 
       WHERE gym_id = $1 AND is_active = true 
       ORDER BY duration_days ASC`,
      [gym_id]
    );
    
    res.json({ success: true, plans: result.rows });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single plan
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      'SELECT * FROM membership_plans WHERE id = $1 AND gym_id = $2',
      [id, gym_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    res.json({ success: true, plan: result.rows[0] });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create plan (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, duration_days, price, description } = req.body;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `INSERT INTO membership_plans (name, duration_days, price, description, gym_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [name, duration_days, price, description, gym_id]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Plan created', 
      plan: result.rows[0] 
    });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update plan (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_days, price, description, is_active } = req.body;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `UPDATE membership_plans SET
        name = COALESCE($1, name),
        duration_days = COALESCE($2, duration_days),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND gym_id = $7
       RETURNING *`,
      [name, duration_days, price, description, is_active, id, gym_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Plan updated', 
      plan: result.rows[0] 
    });
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete plan (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `UPDATE membership_plans SET is_active = false 
       WHERE id = $1 AND gym_id = $2 
       RETURNING id`,
      [id, gym_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    res.json({ success: true, message: 'Plan deactivated' });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;