const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/database');

// Get all plans
const getPlans = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM membership_plans WHERE is_active = true ORDER BY duration_days ASC'
    );
    res.json({ success: true, plans: result.rows });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create plan (admin)
const createPlan = async (req, res) => {
  try {
    const { name, duration_days, price, description } = req.body;

    if (!name || !duration_days || !price) {
      return res.status(400).json({ success: false, message: 'Name, duration and price are required' });
    }

    const result = await pool.query(
      'INSERT INTO membership_plans (name, duration_days, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parseInt(duration_days), parseFloat(price), description]
    );

    res.status(201).json({ success: true, plan: result.rows[0] });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update plan (admin)
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_days, price, description, is_active } = req.body;

    const result = await pool.query(
      `UPDATE membership_plans SET
        name = COALESCE($1, name),
        duration_days = COALESCE($2, duration_days),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [name, duration_days ? parseInt(duration_days) : null, price ? parseFloat(price) : null, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.json({ success: true, plan: result.rows[0] });
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE membership_plans SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Plan deactivated' });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Activate subscription + generate QR
const activateSubscription = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { member_id, plan_id, start_date, payment_method, notes } = req.body;

    if (!member_id || !plan_id || !start_date) {
      return res.status(400).json({ success: false, message: 'Member, plan and start date are required' });
    }

    // Get plan details
    const planResult = await client.query('SELECT * FROM membership_plans WHERE id = $1 AND is_active = true', [plan_id]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    const plan = planResult.rows[0];

    // Calculate end date
    const start = new Date(start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);
    const end_date = end.toISOString().split('T')[0];

    // Cancel any existing active subscription
    await client.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE member_id = $1 AND status = 'active'",
      [member_id]
    );

    // Deactivate old QR codes
    await client.query(
      "UPDATE qr_codes SET is_active = false WHERE member_id = $1",
      [member_id]
    );

    // Create new subscription
    const subResult = await client.query(
      `INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, status, amount_paid, payment_method, notes)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7) RETURNING *`,
      [member_id, plan_id, start_date, end_date, plan.price, payment_method || 'cash', notes]
    );
    const subscription = subResult.rows[0];

    // Generate secure token
    const tokenData = `${member_id}:${subscription.id}:${Date.now()}`;
    const token = crypto.createHash('sha256').update(tokenData).digest('hex');

    // Generate QR code image (base64)
    const qrPayload = JSON.stringify({ token, member_id, subscription_id: subscription.id });
    const qrImageData = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 300
    });

    // Save QR code
    const qrResult = await client.query(
      `INSERT INTO qr_codes (member_id, subscription_id, token, qr_image_data) VALUES ($1, $2, $3, $4) RETURNING *`,
      [member_id, subscription.id, token, qrImageData]
    );

    await client.query('COMMIT');

    // Get member name for response
    const memberResult = await pool.query('SELECT name, email FROM members WHERE id = $1', [member_id]);

    res.status(201).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: { ...subscription, plan_name: plan.name },
      qrCode: {
        token: qrResult.rows[0].token,
        qrImageData: qrImageData,
        id: qrResult.rows[0].id
      },
      member: memberResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Activate subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// Get member's current QR code
const getMemberQR = async (req, res) => {
  try {
    const memberId = req.params.id || req.user.id;

    // Ensure member can only access their own QR
    if (req.user.role !== 'admin' && req.user.id !== memberId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT qr.*, s.start_date, s.end_date, s.status as subscription_status,
              p.name as plan_name, p.duration_days
       FROM qr_codes qr
       JOIN subscriptions s ON s.id = qr.subscription_id
       JOIN membership_plans p ON p.id = s.plan_id
       WHERE qr.member_id = $1 AND qr.is_active = true
       ORDER BY qr.created_at DESC
       LIMIT 1`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No active QR code found' });
    }

    const qrData = result.rows[0];

    // Check if subscription is still active
    if (new Date(qrData.end_date) < new Date()) {
      await pool.query("UPDATE subscriptions SET status = 'expired' WHERE id = $1", [qrData.subscription_id]);
      qrData.subscription_status = 'expired';
    }

    res.json({ success: true, qrCode: qrData });
  } catch (err) {
    console.error('Get QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get member subscriptions history
const getMemberSubscriptions = async (req, res) => {
  try {
    const memberId = req.params.id || req.user.id;

    if (req.user.role !== 'admin' && req.user.id !== memberId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT s.*, p.name as plan_name, p.duration_days
       FROM subscriptions s
       JOIN membership_plans p ON p.id = s.plan_id
       WHERE s.member_id = $1
       ORDER BY s.created_at DESC`,
      [memberId]
    );

    res.json({ success: true, subscriptions: result.rows });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan, activateSubscription, getMemberQR, getMemberSubscriptions };
