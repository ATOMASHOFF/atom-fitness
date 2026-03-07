const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get all staff members (admin only)
const getAllStaff = async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `SELECT m.id, m.name, m.email, m.phone, m.is_active, m.created_at,
              sp.can_scan_attendance, sp.can_view_members, sp.can_add_members,
              sp.can_edit_members, sp.can_delete_members, sp.can_view_subscriptions,
              sp.can_add_subscriptions, sp.can_view_attendance, sp.can_view_reports,
              sp.can_view_financial
       FROM members m
       LEFT JOIN staff_permissions sp ON sp.staff_id = m.id AND sp.gym_id = m.gym_id
       WHERE m.role = 'staff' AND m.gym_id = $1
       ORDER BY m.created_at DESC`,
      [gym_id]
    );
    
    res.json({ success: true, staff: result.rows });
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create staff member (admin only)
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, permissions } = req.body;
    const gym_id = req.user.gym_id;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }
    
    // Check if email exists
    const existing = await pool.query(
      'SELECT id FROM members WHERE email = $1 AND gym_id = $2',
      [email.toLowerCase().trim(), gym_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Generate password
    const finalPassword = password || `${name.split(' ')[0]}${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(finalPassword, 12);
    
    // Create staff member
    const staffResult = await pool.query(
      `INSERT INTO members (name, email, phone, password_hash, role, gym_id, is_active)
       VALUES ($1, $2, $3, $4, 'staff', $5, true)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email.toLowerCase().trim(), phone, hashedPassword, gym_id]
    );
    
    const staff = staffResult.rows[0];
    
    // Set default permissions
    const defaultPermissions = {
      can_scan_attendance: true,
      can_view_members: true,
      can_add_members: false,
      can_edit_members: false,
      can_delete_members: false,
      can_view_subscriptions: true,
      can_add_subscriptions: false,
      can_view_attendance: true,
      can_view_reports: false,
      can_view_financial: false,
      ...permissions
    };
    
    await pool.query(
      `INSERT INTO staff_permissions (
        staff_id, gym_id, can_scan_attendance, can_view_members,
        can_add_members, can_edit_members, can_delete_members,
        can_view_subscriptions, can_add_subscriptions, can_view_attendance,
        can_view_reports, can_view_financial
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        staff.id, gym_id,
        defaultPermissions.can_scan_attendance,
        defaultPermissions.can_view_members,
        defaultPermissions.can_add_members,
        defaultPermissions.can_edit_members,
        defaultPermissions.can_delete_members,
        defaultPermissions.can_view_subscriptions,
        defaultPermissions.can_add_subscriptions,
        defaultPermissions.can_view_attendance,
        defaultPermissions.can_view_reports,
        defaultPermissions.can_view_financial
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff,
      defaultPassword: finalPassword
    });
    
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating staff member' 
    });
  }
};

// Update staff permissions (admin only)
const updateStaffPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = req.body;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `UPDATE staff_permissions SET
        can_scan_attendance = COALESCE($1, can_scan_attendance),
        can_view_members = COALESCE($2, can_view_members),
        can_add_members = COALESCE($3, can_add_members),
        can_edit_members = COALESCE($4, can_edit_members),
        can_delete_members = COALESCE($5, can_delete_members),
        can_view_subscriptions = COALESCE($6, can_view_subscriptions),
        can_add_subscriptions = COALESCE($7, can_add_subscriptions),
        can_view_attendance = COALESCE($8, can_view_attendance),
        can_view_reports = COALESCE($9, can_view_reports),
        can_view_financial = COALESCE($10, can_view_financial)
       WHERE staff_id = $11 AND gym_id = $12
       RETURNING *`,
      [
        permissions.can_scan_attendance,
        permissions.can_view_members,
        permissions.can_add_members,
        permissions.can_edit_members,
        permissions.can_delete_members,
        permissions.can_view_subscriptions,
        permissions.can_add_subscriptions,
        permissions.can_view_attendance,
        permissions.can_view_reports,
        permissions.can_view_financial,
        id,
        gym_id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Permissions updated', 
      permissions: result.rows[0] 
    });
    
  } catch (err) {
    console.error('Update permissions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete staff (admin only)
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;
    
    const result = await pool.query(
      `UPDATE members SET is_active = false 
       WHERE id = $1 AND role = 'staff' AND gym_id = $2 
       RETURNING id`,
      [id, gym_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    res.json({ success: true, message: 'Staff member deactivated' });
    
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllStaff,
  createStaff,
  updateStaffPermissions,
  deleteStaff
};