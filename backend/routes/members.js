const express = require('express');
const router = express.Router();
const {
  getAllMembers, getMemberById, createMember, updateMember, deleteMember, getDashboardStats
} = require('../src/controllers/memberController');
const { authenticateToken, requireAdmin } = require('../src/middleware/auth');

// Admin only
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);
router.get('/', authenticateToken, requireAdmin, getAllMembers);
router.post('/', authenticateToken, requireAdmin, createMember);
router.delete('/:id', authenticateToken, requireAdmin, deleteMember);

// Admin or self
router.get('/:id', authenticateToken, getMemberById);
router.put('/:id', authenticateToken, updateMember);

module.exports = router;
