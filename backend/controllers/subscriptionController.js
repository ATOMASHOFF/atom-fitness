const { pool } = require('../config/database');

// Get all subscriptions (admin/staff with permission)
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const gym_id = req.user.gym_id;

    let query = `
      SELECT s.*, m.name as member_name, m.email as member_email,
             p.name as plan_name, p.duration_days, p.price
      FROM subscriptions s
      JOIN members m ON m.id = s.member_id
      JOIN membership_plans p ON p.id = s.plan_id
      WHERE s.gym_id = $1
    `;
    
    const params = [gym_id];
    let paramCount = 2;

    if (status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (m.name ILIKE $${paramCount} OR m.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) FROM subscriptions s WHERE s.gym_id = $1`;
    const countParams = [gym_id];
    
    if (status) {
      countQuery += ` AND s.status = $2`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      subscriptions: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create subscription (admin/staff with permission)
const createSubscription = async (req, res) => {
  try {
    const { member_id, plan_id, start_date, payment_method, amount_paid, notes } = req.body;
    const gym_id = req.user.gym_id;

    // Verify member belongs to this gym
    const memberCheck = await pool.query(
      'SELECT id FROM members WHERE id = $1 AND gym_id = $2',
      [member_id, gym_id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in this gym' });
    }

    // Verify plan belongs to this gym
    const planCheck = await pool.query(
      'SELECT duration_days, price FROM membership_plans WHERE id = $1 AND gym_id = $2',
      [plan_id, gym_id]
    );
    
    if (planCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found in this gym' });
    }

    const plan = planCheck.rows[0];
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const result = await pool.query(
      `INSERT INTO subscriptions (
        member_id, plan_id, gym_id, start_date, end_date, 
        status, payment_method, amount_paid, notes
      )
      VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8)
      RETURNING *`,
      [
        member_id, plan_id, gym_id, startDate, 
        endDate.toISOString().split('T')[0],
        payment_method, amount_paid || plan.price, notes
      ]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Subscription created', 
      subscription: result.rows[0] 
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update subscription (admin only - staff cannot edit payments)
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_method, amount_paid, notes } = req.body;
    const gym_id = req.user.gym_id;

    const result = await pool.query(
      `UPDATE subscriptions SET
        status = COALESCE($1, status),
        payment_method = COALESCE($2, payment_method),
        amount_paid = COALESCE($3, amount_paid),
        notes = COALESCE($4, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND gym_id = $6
       RETURNING *`,
      [status, payment_method, amount_paid, notes, id, gym_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ 
      success: true, 
      message: 'Subscription updated', 
      subscription: result.rows[0] 
    });
  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete subscription (admin only)
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;

    const result = await pool.query(
      `UPDATE subscriptions SET status = 'cancelled' 
       WHERE id = $1 AND gym_id = $2 
       RETURNING id`,
      [id, gym_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  getAllSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription 
};