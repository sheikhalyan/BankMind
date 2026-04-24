const express = require('express');
const router = express.Router();

const { register, login, registerCustomer,customerLogin,verifyOTP  } = require('../controllers/authController');


router.post('/register', register);
router.post('/login', login);

router.post('/customer/register', registerCustomer);
router.post('/customer/login', customerLogin);

router.post('/verify-otp',verifyOTP);

module.exports = router;

