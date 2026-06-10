const express = require('express');
const router = express.Router();

const {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  getPendingForStaff,
  getPendingForAdmin,
  staffApproveCustomer,
  staffRejectCustomer,
  adminApproveCustomer,
  adminRejectCustomer,
  assignStaff,
  suspendCustomer,
  reactivateCustomer,
} = require('../controllers/customerController');

const {
  verifyToken,
  isStaff,
  isAdmin,
  isStaffOrAdmin,
} = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────
//  PUBLIC — Customer self-registration (no token needed)
// ─────────────────────────────────────────────────────────────────
router.post('/register', registerCustomer);

// ─────────────────────────────────────────────────────────────────
//  READ (Staff + Admin)
// ─────────────────────────────────────────────────────────────────

// GET /api/customer/all  — all customers (staff sees all to pick up new ones)
router.get('/', verifyToken, isStaffOrAdmin, getAllCustomers);

// GET /api/customer/pending/staff  — unclaimed, no staff approval yet
router.get('/pending/staff', verifyToken, isStaffOrAdmin, getPendingForStaff);

// GET /api/customer/pending/admin  — staff approved, awaiting admin
router.get('/pending/admin', verifyToken, isAdmin, getPendingForAdmin);

// GET /api/customer/:customerId
router.get('/:customerId', verifyToken, isStaffOrAdmin, getCustomerById);

// ─────────────────────────────────────────────────────────────────
//  STAFF ACTIONS
// ─────────────────────────────────────────────────────────────────
router.put('/:customerId/staff-approve', verifyToken, isStaff, staffApproveCustomer);
router.put('/:customerId/staff-reject', verifyToken, isStaff, staffRejectCustomer);

// ─────────────────────────────────────────────────────────────────
//  ADMIN ACTIONS
// ─────────────────────────────────────────────────────────────────
router.put('/:customerId/admin-approve', verifyToken, isAdmin, adminApproveCustomer);
router.put('/:customerId/admin-reject', verifyToken, isAdmin, adminRejectCustomer);
router.put('/:customerId/assign-staff', verifyToken, isAdmin, assignStaff);
router.put('/:customerId/suspend', verifyToken, isAdmin, suspendCustomer);
router.put('/:customerId/reactivate', verifyToken, isAdmin, reactivateCustomer);

module.exports = router;