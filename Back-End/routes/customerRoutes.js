const express = require('express');
const router = express.Router();

// ✅ FIX: properly define customerController
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');


// Get customers pending user approval
router.get(
  '/pending-user-approval',
  authMiddleware.verifyToken,
  authMiddleware.isUser,
  customerController.getPendingForUserApproval
);

// Get all customers
router.get(
  '/all',
  authMiddleware.verifyToken,
  authMiddleware.isUser,
  customerController.getAllCustomers
);

// User approve customer
router.put(
  '/user-approve/:customerId',
  authMiddleware.verifyToken,
  authMiddleware.isUser,
  customerController.userApproveCustomer
);

// User reject customer
router.put(
  '/user-reject/:customerId',
  authMiddleware.verifyToken,
  authMiddleware.isUser,
  customerController.userRejectCustomer
);

// User can delete rejected customer
router.delete(
  '/rejected/:customerId',
  authMiddleware.verifyToken,
  authMiddleware.isUser,
  customerController.deleteRejectedCustomer
);

console.log('✅ Customer routes registered with:');
console.log('  - DELETE /rejected/:customerId');

module.exports = router;
