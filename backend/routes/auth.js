const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../src/controllers/authController');
const { authenticateToken } = require('../src/middleware/auth');

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;
