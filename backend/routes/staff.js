const express = require('express');
const router = express.Router();
const { 
  getAllStaff, 
  createStaff, 
  updateStaffPermissions, 
  deleteStaff 
} = require('../controllers/staffController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All staff routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all staff members
router.get('/', getAllStaff);

// Create staff member
router.post('/', createStaff);

// Update staff permissions
router.put('/:id/permissions', updateStaffPermissions);

// Delete (deactivate) staff
router.delete('/:id', deleteStaff);

module.exports = router;