const express = require('express');
const router = express.Router();
const { getGymQR, regenerateGymQR } = require('../controllers/gymQRController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get gym QR code
router.get('/', getGymQR);

// Regenerate gym QR code
router.post('/regenerate', regenerateGymQR);

module.exports = router;