const express = require('express');
const router = express.Router();

const {
  getPendingAccounts,
  approveAccount,
  rejectAccount,
  createAccount,
  getUserAccounts,
  getAccountsByCustomer,
  deleteRejectedAccount
} = require('../controllers/accountController');

const {
  verifyToken,
  isUser,
  isCustomer
} = require('../middlewares/authMiddleware');

/* USER ROUTES */
router.get('/all', verifyToken, isUser, getUserAccounts); 
router.get('/pending', verifyToken, isUser, getPendingAccounts);
router.get('/user-associated', verifyToken, isUser, getUserAccounts);
router.put('/approve/:accountId', verifyToken, isUser, approveAccount);
router.put('/reject/:accountId', verifyToken, isUser, rejectAccount);
router.delete('/rejected/:accountId', verifyToken, isUser, deleteRejectedAccount);


/* CUSTOMER ROUTE */
router.post('/create', verifyToken, isCustomer, createAccount);

// Get accounts by customer ID (for customer dashboard)
router.get('/customer/:customerId', verifyToken, isCustomer, getAccountsByCustomer);

module.exports = router;


