const express = require('express');
const router = express.Router();

const { depositMoney, withdrawMoney, transferMoney, getAccountTransactions } = require('../controllers/transactionController');
const { verifyToken, isStaff, isCustomer } = require('../middlewares/authMiddleware');


/* USER → DEPOSIT */
router.post('/deposit', verifyToken, isStaff, depositMoney);

/* CUSTOMER → WITHDRAW*/
router.post('/withdraw', verifyToken, isCustomer, withdrawMoney);

/*CUSTOMER -> TRANSFER*/

router.post('/transfer', verifyToken, isCustomer, transferMoney);

/*CUSTOMER -> Account Transactions*/
router.get('/account/:accountId', verifyToken, isCustomer, getAccountTransactions);

module.exports = router;
