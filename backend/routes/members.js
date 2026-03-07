const express = require('express');
const router = express.Router();
const { 
  getAllMembers, 
  getMemberById, 
  createMember, 
  updateMember, 
  deleteMember, 
  getDashboardStats 
} = require('../controllers/memberController');
const { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrStaff,
  requirePermission 
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Dashboard stats - admin and staff can view (staff with can_view_reports)
router.get(
  '/dashboard-stats', 
  requireAdminOrStaff, 
  getDashboardStats
);

// Get all members - admin and staff with can_view_members
router.get(
  '/', 
  requireAdminOrStaff,
  getAllMembers
);

// Get single member - admin and staff with can_view_members
router.get(
  '/:id', 
  requireAdminOrStaff,
  getMemberById
);

// Create member - admin and staff with can_add_members
router.post(
  '/', 
  requirePermission('can_add_members'),
  createMember
);

// Update member - admin and staff with can_edit_members
router.put(
  '/:id', 
  requirePermission('can_edit_members'),
  updateMember
);

// Delete member - admin only (staff cannot delete)
router.delete(
  '/:id', 
  requireAdmin,
  deleteMember
);

module.exports = router;