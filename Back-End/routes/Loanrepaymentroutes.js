const express = require('express');
const router = express.Router();

const {
    getRepaymentSchedule,
    payInstallment,
    runAutoDeduction,
    runAutoDeductionAll,
    markOverdueInstallments,
} = require('../controllers/Loanrepaymentcontroller');

const {
    verifyToken,
    isCustomer,
    isStaffOrAdmin,
    isAdmin,
} = require('../middlewares/authMiddleware');

// GET  /api/loan-repayments/:loanId/schedule   — customer/staff/admin view schedule
router.get('/:loanId/schedule', verifyToken, getRepaymentSchedule);

// POST /api/loan-repayments/:loanId/pay        — customer pays manually
router.post('/:loanId/pay', verifyToken, isCustomer, payInstallment);

// POST /api/loan-repayments/:loanId/auto-deduct — run for one loan (staff/admin or cron)
router.post('/:loanId/auto-deduct', verifyToken, isStaffOrAdmin, runAutoDeduction);

// POST /api/loan-repayments/auto-deduct-all    — run for ALL loans (admin/cron)
router.post('/auto-deduct-all', verifyToken, isAdmin, runAutoDeductionAll);

// POST /api/loan-repayments/mark-overdue       — mark past-due installments as OVERDUE
router.post('/mark-overdue', verifyToken, isStaffOrAdmin, markOverdueInstallments);

module.exports = router;