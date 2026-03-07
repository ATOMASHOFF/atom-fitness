const express = require('express');
const router = express.Router();
const { 
  getAllSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription 
} = require('../controllers/subscriptionController');
const { 
  authenticateToken, 
  requireAdmin,
  requireAdminOrStaff,
  requirePermission 
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all subscriptions - admin and staff with can_view_subscriptions
router.get(
  '/', 
  requireAdminOrStaff,
  getAllSubscriptions
);

// Create subscription - admin and staff with can_add_subscriptions
router.post(
  '/', 
  requirePermission('can_add_subscriptions'),
  createSubscription
);

// Update subscription - admin only (staff cannot edit payments)
router.put(
  '/:id', 
  requireAdmin,
  updateSubscription
);

// Delete subscription - admin only
router.delete(
  '/:id', 
  requireAdmin,
  deleteSubscription
);

module.exports = router;