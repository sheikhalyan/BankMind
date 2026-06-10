const express = require('express');
const router = express.Router();

const {
  applyLoan,
  getAllLoans,
  getPendingLoansForStaff,
  getPendingLoansForAdmin,
  staffApproveLoan,
  staffRejectLoan,
  adminApproveLoan,
  adminRejectLoan,
  toggleAutoDeduct,
} = require('../controllers/loanController');

const {
  verifyToken,
  isStaff,
  isAdmin,
  isStaffOrAdmin,
  isCustomer,
} = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────
//  READ
// ─────────────────────────────────────────────────────────────────

// GET /api/loans              — Staff: their customers | Admin: all | Customer: own
router.get('/', verifyToken, getAllLoans);

// GET /api/loans/pending/staff — loans with no staff approval yet
router.get('/pending/staff', verifyToken, isStaffOrAdmin, getPendingLoansForStaff);

// GET /api/loans/pending/admin — staff approved, awaiting admin
router.get('/pending/admin', verifyToken, isAdmin, getPendingLoansForAdmin);

// ─────────────────────────────────────────────────────────────────
//  CUSTOMER
// ─────────────────────────────────────────────────────────────────

// POST /api/loans             — customer applies for a loan
router.post('/', verifyToken, isCustomer, applyLoan);

// ─────────────────────────────────────────────────────────────────
//  STAFF ACTIONS
// ─────────────────────────────────────────────────────────────────

// PUT /api/loans/:loanId/staff-approve
router.put('/:loanId/staff-approve', verifyToken, isStaff, staffApproveLoan);

// PUT /api/loans/:loanId/staff-reject
router.put('/:loanId/staff-reject', verifyToken, isStaff, staffRejectLoan);

// ─────────────────────────────────────────────────────────────────
//  ADMIN ACTIONS
// ─────────────────────────────────────────────────────────────────

// PUT /api/loans/:loanId/admin-approve
router.put('/:loanId/admin-approve', verifyToken, isAdmin, adminApproveLoan);

// PUT /api/loans/:loanId/admin-reject
router.put('/:loanId/admin-reject', verifyToken, isAdmin, adminRejectLoan);

// PUT /api/loans/:loanId/toggle-auto-deduct
router.put('/:loanId/toggle-auto-deduct', verifyToken, isAdmin, toggleAutoDeduct);

module.exports = router;
