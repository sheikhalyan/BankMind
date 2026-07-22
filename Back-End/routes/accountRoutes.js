const express = require('express');
const router = express.Router();

const {
  createAccount,
  getPendingAccounts,
  getAllAccounts,
  approveAccount,
  rejectAccount,
  getMyAccounts,
  getAccountsByCustomer,
  getUserAssociatedAccounts,
  requestAccountClosure,
  getClosurePendingAccounts,
  approveAccountClosure,
  freezeAccount,
  unfreezeAccount,
} = require('../controllers/accountController');

const {
  verifyToken,
  isStaff,
  isStaffOrAdmin,
  isCustomer,
  isAdmin,
} = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────
//  CUSTOMER
// ─────────────────────────────────────────────────────────────────

// POST /api/accounts              — customer creates account request
router.post('/', verifyToken, isCustomer, createAccount);

// GET  /api/accounts/my           — customer views their own accounts
router.get('/my', verifyToken, isCustomer, getMyAccounts);



// ─────────────────────────────────────────────────────────────────
//  ACCOUNT CLOSURE
// ─────────────────────────────────────────────────────────────────

// POST /api/accounts/:accountId/request-closure  — customer requests closure
router.post('/:accountId/request-closure', verifyToken, isCustomer, requestAccountClosure);

// GET  /api/accounts/closure-pending             — staff/admin views pending closures
router.get('/closure-pending', verifyToken, isStaffOrAdmin, getClosurePendingAccounts);

// PUT  /api/accounts/:accountId/approve-closure  — staff/admin approves closure
router.put('/:accountId/approve-closure', verifyToken, isStaffOrAdmin, approveAccountClosure);

// PUT /api/accounts/:accountId/freeze   — admin only
router.put('/:accountId/freeze', verifyToken, isAdmin, freezeAccount);

// PUT /api/accounts/:accountId/unfreeze — admin only
router.put('/:accountId/unfreeze', verifyToken, isAdmin, unfreezeAccount);


// ─────────────────────────────────────────────────────────────────
//  STAFF / ADMIN READ
// ─────────────────────────────────────────────────────────────────

// GET /api/accounts               — Staff: assigned customers | Admin: all
router.get('/', verifyToken, isStaffOrAdmin, getAllAccounts);

// GET /api/accounts/pending       — accounts awaiting staff approval
router.get('/pending', verifyToken, isStaffOrAdmin, getPendingAccounts);

// GET /api/accounts/staff-accounts — all accounts of staff's assigned customers
router.get('/staff-accounts', verifyToken, isStaff, getUserAssociatedAccounts);

// GET /api/accounts/customer/:customerId
router.get('/customer/:customerId', verifyToken, isStaffOrAdmin, getAccountsByCustomer);

// ─────────────────────────────────────────────────────────────────
//  STAFF ACTIONS
// ─────────────────────────────────────────────────────────────────

// PUT /api/accounts/:accountId/approve
router.put('/:accountId/approve', verifyToken, isStaff, approveAccount);

// PUT /api/accounts/:accountId/reject
router.put('/:accountId/reject', verifyToken, isStaff, rejectAccount);

module.exports = router;