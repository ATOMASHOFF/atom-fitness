const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');

// Login - works for both admin and member
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find member by email
    const result = await pool.query(
      'SELECT * FROM members WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const member = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, member.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT
    const token = generateToken({
      id: member.id,
      email: member.email,
      role: member.role,
      name: member.name
    });

    // Return user data (exclude password)
    const { password_hash, ...userData } = member;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Get current logged-in user profile
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.name, m.email, m.phone, m.role, m.gender, m.date_of_birth,
              m.address, m.emergency_contact, m.emergency_phone, m.is_active, m.created_at,
              s.id as subscription_id, s.start_date, s.end_date, s.status as subscription_status,
              p.name as plan_name, p.duration_days
       FROM members m
       LEFT JOIN subscriptions s ON s.member_id = m.id AND s.status = 'active'
       LEFT JOIN membership_plans p ON p.id = s.plan_id
       WHERE m.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    
    // Check if subscription has expired and update if needed
    if (user.end_date && new Date(user.end_date) < new Date()) {
      await pool.query(
        "UPDATE subscriptions SET status = 'expired' WHERE id = $1 AND status = 'active'",
        [user.subscription_id]
      );
      user.subscription_status = 'expired';
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT password_hash FROM members WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE members SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, getMe, changePassword };
