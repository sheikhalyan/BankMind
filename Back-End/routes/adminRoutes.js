const express = require('express');
const router = express.Router();

const {
  // Staff
  getAllStaff,
  getPendingStaff,
  getStaffById,
  createStaff,
  approveStaff,
  rejectStaff,
  suspendStaff,
  reactivateStaff,
  // Customers
  getAllCustomers,
  getPendingAdminApproval,
  adminApproveCustomer,
  adminRejectCustomer,
  suspendCustomer,
  reactivateCustomer,
  // Loan Policies
  getLoanPolicies,
  createLoanPolicy,
  updateLoanPolicy,
  toggleLoanPolicy,
  // Stats
  getDashboardStats,
} = require('../controllers/adminController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// All admin routes require a valid token + ADMIN role
router.use(verifyToken, isAdmin);

// ----------------------------------------------------------------
// DASHBOARD
// ----------------------------------------------------------------
router.get('/stats', getDashboardStats);

// ----------------------------------------------------------------
// STAFF MANAGEMENT
// ----------------------------------------------------------------
router.get('/staff', getAllStaff);
router.get('/staff/pending', getPendingStaff);
router.get('/staff/:userId', getStaffById);
router.post('/staff', createStaff);           // Admin creates staff directly
router.put('/staff/:userId/approve', approveStaff);
router.put('/staff/:userId/reject', rejectStaff);
router.put('/staff/:userId/suspend', suspendStaff);
router.put('/staff/:userId/reactivate', reactivateStaff);

// ----------------------------------------------------------------
// CUSTOMER MANAGEMENT (Admin = final approval level)
// ----------------------------------------------------------------
router.get('/customers', getAllCustomers);
router.get('/customers/pending-approval', getPendingAdminApproval);
router.put('/customers/:customerId/approve', adminApproveCustomer);
router.put('/customers/:customerId/reject', adminRejectCustomer);
router.put('/customers/:customerId/suspend', suspendCustomer);
router.put('/customers/:customerId/reactivate', reactivateCustomer);

// ----------------------------------------------------------------
// LOAN POLICIES
// ----------------------------------------------------------------
router.get('/loan-policies', getLoanPolicies);
router.post('/loan-policies', createLoanPolicy);
router.put('/loan-policies/:policyId', updateLoanPolicy);
router.put('/loan-policies/:policyId/toggle', toggleLoanPolicy);

module.exports = router;
