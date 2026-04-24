const express = require('express');
const router = express.Router();
const {
  getPendingLoans,
  approveLoan,
  rejectLoan,
  getAllLoans,
  deleteRejectedLoan
} = require('../controllers/loanApprovalController');

const { verifyToken, isUser } = require('../middlewares/authMiddleware');

router.get('/pending',verifyToken, isUser, getPendingLoans);
router.get('/all', verifyToken, isUser, getAllLoans);
router.patch('/approve/:loanId',verifyToken,isUser,approveLoan);
router.patch('/reject/:loanId',verifyToken,isUser,rejectLoan);
router.delete('/rejected/:loanId', verifyToken, isUser, deleteRejectedLoan);

module.exports = router;




