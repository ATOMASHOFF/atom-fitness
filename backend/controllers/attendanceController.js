const { pool } = require('../config/database');

// Member scans gym QR code to check in
const scanGymQR = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { token } = req.body;
    const memberId = req.user.id; // From JWT

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    // Verify this is a valid gym QR code
    const gymQRResult = await client.query(
      'SELECT * FROM gym_qr_codes WHERE token = $1 AND is_active = true',
      [token]
    );

    if (gymQRResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid gym QR code',
        status: 'INVALID'
      });
    }

    // Get member details and active subscription
    const memberResult = await client.query(
      `SELECT m.id, m.name, m.email, m.is_active as member_active,
              s.id as subscription_id, s.start_date, s.end_date, s.status as subscription_status,
              p.name as plan_name
       FROM members m
       LEFT JOIN subscriptions s ON s.member_id = m.id AND s.status = 'active'
       LEFT JOIN membership_plans p ON p.id = s.plan_id
       WHERE m.id = $1`,
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found',
        status: 'INVALID'
      });
    }

    const memberData = memberResult.rows[0];

    // Check if member is active
    if (!memberData.member_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Your account is deactivated. Please contact the gym.',
        status: 'MEMBER_INACTIVE'
      });
    }

    // Check if member has active subscription
    if (!memberData.subscription_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'No active membership. Please contact the gym to activate a plan.',
        status: 'NO_SUBSCRIPTION'
      });
    }

    // Check subscription expiry
    const today = new Date();
    const endDate = new Date(memberData.end_date);
    
    if (endDate < today) {
      // Update subscription to expired
      await client.query(
        "UPDATE subscriptions SET status = 'expired' WHERE id = $1",
        [memberData.subscription_id]
      );
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Your membership expired on ${endDate.toLocaleDateString('en-IN')}. Please renew.`,
        status: 'EXPIRED',
        subscription: { end_date: memberData.end_date, plan_name: memberData.plan_name }
      });
    }

    // Check duplicate same-day attendance
    const todayStr = today.toISOString().split('T')[0];
    const duplicateCheck = await client.query(
      'SELECT id, check_in_time FROM attendance_logs WHERE member_id = $1 AND check_in_date = $2',
      [memberId, todayStr]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      const firstCheckin = new Date(duplicateCheck.rows[0].check_in_time);
      return res.status(409).json({ 
        success: false, 
        message: `Already checked in today at ${firstCheckin.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        status: 'DUPLICATE'
      });
    }

    // Record attendance
    const attendanceResult = await client.query(
      `INSERT INTO attendance_logs (member_id, subscription_id, gym_qr_id, check_in_date, scan_method)
       VALUES ($1, $2, $3, $4, 'qr')
       RETURNING *`,
      [memberId, memberData.subscription_id, gymQRResult.rows[0].id, todayStr]
    );

    await client.query('COMMIT');

    // Calculate days remaining
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      status: 'SUCCESS',
      message: `Welcome, ${memberData.name}! Check-in recorded.`,
      attendance: attendanceResult.rows[0],
      member: {
        name: memberData.name,
        plan_name: memberData.plan_name,
        end_date: memberData.end_date,
        days_remaining: daysRemaining
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Scan gym QR error:', err);
    res.status(500).json({ success: false, message: 'Server error during scan' });
  } finally {
    client.release();
  }
};

// Manual attendance record (admin)
const recordManualAttendance = async (req, res) => {
  try {
    const { member_id, notes, date } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const checkDate = date || new Date().toISOString().split('T')[0];

    // Check duplicate
    const duplicate = await pool.query(
      'SELECT id FROM attendance_logs WHERE member_id = $1 AND check_in_date = $2',
      [member_id, checkDate]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Attendance already recorded for this date' });
    }

    // Get active subscription
    const sub = await pool.query(
      "SELECT id FROM subscriptions WHERE member_id = $1 AND status = 'active' AND end_date >= $2",
      [member_id, checkDate]
    );

    const result = await pool.query(
      `INSERT INTO attendance_logs (member_id, subscription_id, check_in_date, scan_method, notes)
       VALUES ($1, $2, $3, 'manual', $4) RETURNING *`,
      [member_id, sub.rows[0]?.id || null, checkDate, notes]
    );

    res.status(201).json({ success: true, attendance: result.rows[0] });
  } catch (err) {
    console.error('Manual attendance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get attendance logs (admin - all, member - own)
const getAttendanceLogs = async (req, res) => {
  try {
    const { member_id, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, m.name, m.email, p.name as plan_name
      FROM attendance_logs al
      JOIN members m ON m.id = al.member_id
      LEFT JOIN subscriptions s ON s.id = al.subscription_id
      LEFT JOIN membership_plans p ON p.id = s.plan_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Members can only see their own attendance
    if (req.user.role !== 'admin') {
      query += ` AND al.member_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (member_id) {
      query += ` AND al.member_id = $${paramCount}`;
      params.push(member_id);
      paramCount++;
    }

    if (date_from) {
      query += ` AND al.check_in_date >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND al.check_in_date <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY al.check_in_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Count
    let countQuery = 'SELECT COUNT(*) FROM attendance_logs al WHERE 1=1';
    const countParams = [];
    if (req.user.role !== 'admin') {
      countQuery += ' AND al.member_id = $1';
      countParams.push(req.user.id);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      logs: result.rows,
      pagination: { total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { scanGymQR, recordManualAttendance, getAttendanceLogs };
