const express = require('express');
const router = express.Router();
const { scanGymQR, recordManualAttendance, getAttendanceLogs } = require('../controllers/attendanceController');
const { authenticateToken, requireAdmin, requireMember } = require('../middleware/auth');

// Member scans gym QR to check in
router.post('/checkin', authenticateToken, requireMember, scanGymQR);

// Manual attendance - admin only
router.post('/manual', authenticateToken, requireAdmin, recordManualAttendance);

// Logs - admin sees all, member sees own
router.get('/logs', authenticateToken, getAttendanceLogs);

module.exports = router;
