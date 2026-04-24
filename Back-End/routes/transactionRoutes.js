const express = require('express');
const router = express.Router();

const { depositMoney,withdrawMoney, transferMoney, getAccountTransactions } = require('../controllers/transactionController');
const { verifyToken, isUser, isCustomer } = require('../middlewares/authMiddleware');


/* USER → DEPOSIT */
router.post('/deposit', verifyToken, isUser, depositMoney);

/* CUSTOMER → WITHDRAW*/
router.post('/withdraw', verifyToken, isCustomer, withdrawMoney);

/*CUSTOMER -> TRANSFER*/

router.post('/transfer',verifyToken,isCustomer,transferMoney);

/*CUSTOMER -> Account Transactions*/
router.get( '/account/:account_id',verifyToken,isCustomer,getAccountTransactions);

module.exports = router;
