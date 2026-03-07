const { pool } = require('../config/database');

// Scan gym QR and check in (member)
const scanGymQR = async (req, res) => {
  try {
    const { token } = req.body;
    const member_id = req.user.id;
    const gym_id = req.user.gym_id;

    // Verify gym QR code belongs to member's gym
    const qrResult = await pool.query(
      'SELECT * FROM gym_qr_codes WHERE token = $1 AND gym_id = $2 AND is_active = true',
      [token, gym_id]
    );

    if (qrResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        status: 'INVALID',
        message: 'Invalid QR code or wrong gym' 
      });
    }

    const gymQR = qrResult.rows[0];

    // Check if member is active
    const memberResult = await pool.query(
      'SELECT * FROM members WHERE id = $1 AND gym_id = $2 AND is_active = true',
      [member_id, gym_id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        status: 'MEMBER_INACTIVE',
        message: 'Member account is inactive' 
      });
    }

    // Check active subscription for this gym
    const subResult = await pool.query(
      `SELECT s.*, p.name as plan_name 
       FROM subscriptions s
       JOIN membership_plans p ON p.id = s.plan_id
       WHERE s.member_id = $1 AND s.gym_id = $2
         AND s.status = 'active' AND s.end_date >= CURRENT_DATE
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [member_id, gym_id]
    );

    if (subResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        status: 'NO_SUBSCRIPTION',
        message: 'No active membership for this gym' 
      });
    }

    const subscription = subResult.rows[0];

    // Check for duplicate check-in today
    const today = new Date().toISOString().split('T')[0];
    const duplicateCheck = await pool.query(
      `SELECT * FROM attendance_logs 
       WHERE member_id = $1 AND gym_id = $2 AND check_in_date = $3`,
      [member_id, gym_id, today]
    );

    if (duplicateCheck.rows.length > 0) {
      const firstCheckIn = duplicateCheck.rows[0].check_in_time;
      return res.status(400).json({ 
        success: false, 
        status: 'DUPLICATE',
        message: 'Already checked in today',
        firstCheckInTime: firstCheckIn
      });
    }

    // Record attendance
    await pool.query(
      `INSERT INTO attendance_logs (
        member_id, subscription_id, gym_qr_id, gym_id, 
        check_in_time, check_in_date, scan_method
      )
      VALUES ($1, $2, $3, $4, NOW(), CURRENT_DATE, 'qr')`,
      [member_id, subscription.id, gymQR.id, gym_id]
    );

    // Calculate days remaining
    const endDate = new Date(subscription.end_date);
    const todayDate = new Date();
    const daysRemaining = Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      status: 'SUCCESS',
      message: 'Check-in successful!',
      member: {
        name: memberResult.rows[0].name,
        plan_name: subscription.plan_name,
        end_date: subscription.end_date,
        days_remaining: daysRemaining
      }
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ 
      success: false, 
      status: 'ERROR',
      message: 'Server error during check-in' 
    });
  }
};

// Manual check-in (admin/staff with permission)
const manualCheckIn = async (req, res) => {
  try {
    const { member_id } = req.body;
    const gym_id = req.user.gym_id;

    // Verify member belongs to this gym
    const memberResult = await pool.query(
      'SELECT * FROM members WHERE id = $1 AND gym_id = $2 AND is_active = true',
      [member_id, gym_id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in this gym' });
    }

    // Check subscription
    const subResult = await pool.query(
      `SELECT s.* FROM subscriptions s
       WHERE s.member_id = $1 AND s.gym_id = $2
         AND s.status = 'active' AND s.end_date >= CURRENT_DATE
       LIMIT 1`,
      [member_id, gym_id]
    );

    if (subResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Member has no active subscription' 
      });
    }

    // Check duplicate
    const today = new Date().toISOString().split('T')[0];
    const duplicateCheck = await pool.query(
      `SELECT * FROM attendance_logs 
       WHERE member_id = $1 AND gym_id = $2 AND check_in_date = $3`,
      [member_id, gym_id, today]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Member already checked in today' 
      });
    }

    // Record attendance
    await pool.query(
      `INSERT INTO attendance_logs (
        member_id, subscription_id, gym_id, 
        check_in_time, check_in_date, scan_method
      )
      VALUES ($1, $2, $3, NOW(), CURRENT_DATE, 'manual')`,
      [member_id, subResult.rows[0].id, gym_id]
    );

    res.json({ 
      success: true, 
      message: 'Manual check-in recorded',
      member: memberResult.rows[0]
    });

  } catch (err) {
    console.error('Manual check-in error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get attendance logs (admin/staff with permission)
const getAttendanceLogs = async (req, res) => {
  try {
    const { date, member_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const gym_id = req.user.gym_id;

    let query = `
      SELECT al.*, m.name as member_name, m.email as member_email
      FROM attendance_logs al
      JOIN members m ON m.id = al.member_id
      WHERE al.gym_id = $1
    `;
    
    const params = [gym_id];
    let paramCount = 2;

    if (date) {
      query += ` AND al.check_in_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (member_id) {
      query += ` AND al.member_id = $${paramCount}`;
      params.push(member_id);
      paramCount++;
    }

    query += ` ORDER BY al.check_in_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) FROM attendance_logs WHERE gym_id = $1`;
    const countParams = [gym_id];
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      logs: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get attendance logs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  scanGymQR, 
  manualCheckIn, 
  getAttendanceLogs 
};