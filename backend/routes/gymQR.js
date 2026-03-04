const express = require('express');
const router = express.Router();
const { getGymQR, regenerateGymQR } = require('../src/controllers/gymQRController');
const { authenticateToken, requireAdmin } = require('../src/middleware/auth');

// Get gym QR code (admin only)
router.get('/', authenticateToken, requireAdmin, getGymQR);

// Regenerate gym QR code (admin only)
router.post('/regenerate', authenticateToken, requireAdmin, regenerateGymQR);

module.exports = router;
