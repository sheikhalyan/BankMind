const express = require("express");
const router = express.Router();
const {
  applyLoan,
  getLoansByCustomer,
} = require("../controllers/loanController");
const { verifyToken, isCustomer } = require("../middlewares/authMiddleware");

router.post("/apply", verifyToken, isCustomer, applyLoan);
router.get(
  "/customer/:customerId",
  verifyToken,
  isCustomer,
  getLoansByCustomer,
);

module.exports = router;
