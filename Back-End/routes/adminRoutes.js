const express = require('express');
const router = express.Router();
const { 
  getPendingUsers, 
  getPendingCustomers,
  getRejectedUsers,
  getRejectedCustomers,
  approveUser,
  rejectUser,
  deleteRejectedUser,
  adminApproveCustomer,
  rejectCustomer,
  deleteRejectedCustomer,
  getAllUsers,
  getAllCustomers
} = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/pending-users', verifyToken, isAdmin, getPendingUsers);
router.get('/pending-customers', verifyToken, isAdmin, getPendingCustomers);
router.get('/rejected-users', verifyToken, isAdmin, getRejectedUsers);
router.get('/rejected-customers', verifyToken, isAdmin, getRejectedCustomers);
router.put('/approve-user/:id', verifyToken, isAdmin, approveUser);
router.put('/reject-user/:id', verifyToken, isAdmin, rejectUser);
router.delete('/rejected-user/:id', verifyToken, isAdmin, deleteRejectedUser);
router.put('/approve-customer/:id', verifyToken, isAdmin, adminApproveCustomer);
router.put('/reject-customer/:id', verifyToken, isAdmin, rejectCustomer);
router.delete('/rejected-customer/:id', verifyToken, isAdmin, deleteRejectedCustomer);

router.get('/all-users', verifyToken, isAdmin, getAllUsers);
router.get('/all-customers', verifyToken, isAdmin, getAllCustomers);

module.exports = router;