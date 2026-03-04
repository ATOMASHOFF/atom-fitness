const express = require('express');
const router = express.Router();
const {
  getPlans, createPlan, updatePlan, deletePlan,
  activateSubscription, getMemberQR, getMemberSubscriptions
} = require('../controllers/subscriptionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Plans - public read, admin write
router.get('/plans', authenticateToken, getPlans);
router.post('/plans', authenticateToken, requireAdmin, createPlan);
router.put('/plans/:id', authenticateToken, requireAdmin, updatePlan);
router.delete('/plans/:id', authenticateToken, requireAdmin, deletePlan);

// Subscriptions
router.post('/activate', authenticateToken, requireAdmin, activateSubscription);
router.get('/member/:id', authenticateToken, getMemberSubscriptions);
router.get('/qr/:id', authenticateToken, getMemberQR);

// Own data for member
router.get('/my/subscriptions', authenticateToken, getMemberSubscriptions);
router.get('/my/qr', authenticateToken, getMemberQR);

module.exports = router;
