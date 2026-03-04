const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

// Get all members (admin only)
const getAllMembers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        m.id, m.name, m.email, m.phone, m.gender, m.is_active, m.created_at,
        s.id as subscription_id,
        s.start_date, s.end_date, s.status as subscription_status,
        p.name as plan_name, p.duration_days,
        CASE 
          WHEN s.end_date < CURRENT_DATE AND s.status = 'active' THEN 'expired'
          ELSE s.status 
        END as computed_status
      FROM members m
      LEFT JOIN subscriptions s ON s.member_id = m.id 
        AND s.id = (
          SELECT id FROM subscriptions s2 
          WHERE s2.member_id = m.id 
          ORDER BY created_at DESC LIMIT 1
        )
      LEFT JOIN membership_plans p ON p.id = s.plan_id
      WHERE m.role = 'member'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (m.name ILIKE $${paramCount} OR m.email ILIKE $${paramCount} OR m.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'active') {
      query += ` AND s.status = 'active' AND s.end_date >= CURRENT_DATE`;
    } else if (status === 'expired') {
      query += ` AND (s.status = 'expired' OR (s.status = 'active' AND s.end_date < CURRENT_DATE) OR s.id IS NULL)`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Count query
    let countQuery = `SELECT COUNT(*) FROM members m WHERE m.role = 'member'`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (m.name ILIKE $1 OR m.email ILIKE $1 OR m.phone ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      members: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get all members error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single member by ID
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT m.id, m.name, m.email, m.phone, m.gender, m.date_of_birth,
              m.address, m.emergency_contact, m.emergency_phone, m.profile_notes,
              m.is_active, m.created_at
       FROM members m
       WHERE m.id = $1 AND m.role = 'member'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Get subscriptions
    const subs = await pool.query(
      `SELECT s.*, p.name as plan_name, p.duration_days
       FROM subscriptions s
       JOIN membership_plans p ON p.id = s.plan_id
       WHERE s.member_id = $1
       ORDER BY s.created_at DESC`,
      [id]
    );

    // Get attendance count
    const attCount = await pool.query(
      'SELECT COUNT(*) FROM attendance_logs WHERE member_id = $1',
      [id]
    );

    res.json({
      success: true,
      member: result.rows[0],
      subscriptions: subs.rows,
      attendanceCount: parseInt(attCount.rows[0].count)
    });
  } catch (err) {
    console.error('Get member error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new member (admin only)
const createMember = async (req, res) => {
  try {
    const {
      name, email, phone, password, gender,
      date_of_birth, address, emergency_contact, emergency_phone, profile_notes
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    // Check if email exists
    const existing = await pool.query('SELECT id FROM members WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO members (name, email, phone, password_hash, role, gender, date_of_birth, address, emergency_contact, emergency_phone, profile_notes)
       VALUES ($1, $2, $3, $4, 'member', $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, phone, gender, date_of_birth, address, is_active, created_at`,
      [name.trim(), email.toLowerCase().trim(), phone, hashedPassword, gender, date_of_birth || null,
       address, emergency_contact, emergency_phone, profile_notes]
    );

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      member: result.rows[0]
    });
  } catch (err) {
    console.error('Create member error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update member
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, gender, date_of_birth, address, emergency_contact, emergency_phone, profile_notes, is_active } = req.body;

    const result = await pool.query(
      `UPDATE members SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        gender = COALESCE($3, gender),
        date_of_birth = COALESCE($4, date_of_birth),
        address = COALESCE($5, address),
        emergency_contact = COALESCE($6, emergency_contact),
        emergency_phone = COALESCE($7, emergency_phone),
        profile_notes = COALESCE($8, profile_notes),
        is_active = COALESCE($9, is_active)
       WHERE id = $10 AND role = 'member'
       RETURNING id, name, email, phone, gender, is_active, updated_at`,
      [name, phone, gender, date_of_birth || null, address, emergency_contact, emergency_phone, profile_notes, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Member updated', member: result.rows[0] });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete member (admin only)
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE members SET is_active = false WHERE id = $1 AND role = 'member' RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Member deactivated successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Update expired subscriptions first
    await pool.query(
      "UPDATE subscriptions SET status = 'expired' WHERE status = 'active' AND end_date < CURRENT_DATE"
    );

    const totalMembers = await pool.query("SELECT COUNT(*) FROM members WHERE role = 'member' AND is_active = true");
    const activeMembers = await pool.query(
      "SELECT COUNT(DISTINCT member_id) FROM subscriptions WHERE status = 'active' AND end_date >= CURRENT_DATE"
    );
    const expiredMembers = await pool.query(
      `SELECT COUNT(DISTINCT m.id) FROM members m
       WHERE m.role = 'member' AND m.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active' AND s.end_date >= CURRENT_DATE
       )`
    );
    const todayAttendance = await pool.query(
      "SELECT COUNT(*) FROM attendance_logs WHERE check_in_date = CURRENT_DATE"
    );
    const totalRevenue = await pool.query(
      "SELECT COALESCE(SUM(amount_paid), 0) as total FROM subscriptions WHERE status != 'cancelled'"
    );
    const monthRevenue = await pool.query(
      "SELECT COALESCE(SUM(amount_paid), 0) as total FROM subscriptions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)"
    );

    // Recent attendance
    const recentAttendance = await pool.query(
      `SELECT al.check_in_time, al.check_in_date, m.name, m.email
       FROM attendance_logs al
       JOIN members m ON m.id = al.member_id
       ORDER BY al.check_in_time DESC
       LIMIT 10`
    );

    // Expiring soon (within 7 days)
    const expiringSoon = await pool.query(
      `SELECT m.name, m.email, m.phone, s.end_date, p.name as plan_name,
              (s.end_date - CURRENT_DATE) as days_remaining
       FROM subscriptions s
       JOIN members m ON m.id = s.member_id
       JOIN membership_plans p ON p.id = s.plan_id
       WHERE s.status = 'active' 
         AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       ORDER BY s.end_date ASC`
    );

    res.json({
      success: true,
      stats: {
        totalMembers: parseInt(totalMembers.rows[0].count),
        activeMembers: parseInt(activeMembers.rows[0].count),
        expiredMembers: parseInt(expiredMembers.rows[0].count),
        todayAttendance: parseInt(todayAttendance.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        monthRevenue: parseFloat(monthRevenue.rows[0].total),
      },
      recentAttendance: recentAttendance.rows,
      expiringSoon: expiringSoon.rows
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllMembers, getMemberById, createMember, updateMember, deleteMember, getDashboardStats };
