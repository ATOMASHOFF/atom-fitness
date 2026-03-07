const express = require('express');
const router = express.Router();
const { 
  scanGymQR, 
  manualCheckIn, 
  getAttendanceLogs 
} = require('../controllers/attendanceController');
const { 
  authenticateToken, 
  requireMember,
  requireAdminOrStaff,
  requirePermission 
} = require('../middleware/auth');

// Scan QR - members only
router.post(
  '/checkin', 
  authenticateToken, 
  requireMember, 
  scanGymQR
);

// Manual check-in - admin and staff with can_scan_attendance
router.post(
  '/manual', 
  authenticateToken,
  requirePermission('can_scan_attendance'),
  manualCheckIn
);

// Get attendance logs - admin and staff with can_view_attendance
router.get(
  '/logs', 
  authenticateToken,
  requireAdminOrStaff,
  getAttendanceLogs
);

module.exports = router;