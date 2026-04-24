const { poolPromise, sql } = require("../config/db");
const { createNotification } = require("../utils/notifications");

/* =========================
   USER: DEPOSIT MONEY
========================= */
const depositMoney = async (req, res) => {
  const { account_id, amount } = req.body;

  if (!account_id || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid deposit data" });
  }

  try {
    const pool = await poolPromise;

    // 1️⃣ Check account
    const accountResult = await pool
      .request()
      .input("account_id", sql.Int, account_id).query(`
        SELECT status
        FROM Accounts
        WHERE account_id = @account_id
      `);

    const account = accountResult.recordset[0];

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is not active" });
    }

    // 2️⃣ Update balance
    await pool
      .request()
      .input("amount", sql.Decimal(10, 2), amount)
      .input("account_id", sql.Int, account_id).query(`
        UPDATE Accounts
        SET balance = balance + @amount
        WHERE account_id = @account_id
      `);

    // 3️⃣ Insert transaction (✅ FIXED)
    await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        INSERT INTO Transactions 
        (account_id, transaction_type, transaction_reason, amount)
        VALUES 
        (@account_id, 'CREDIT', 'DEPOSIT', @amount)
      `);

    // // ✅ Notify customer about deposit
    // await createNotification(
    //   account.customer_id,
    //   "DEPOSIT",
    //   `$${amount} has been deposited into your account (Account #${account_id})`,
    //   account_id,
    // );

    // Inside depositMoney function, after successful deposit
    console.log(
      "🔵 Attempting to create notification for customer:",
      account.customer_id,
    );
    console.log("🔵 createNotification function:", typeof createNotification);

    // ✅ Correct - includes pool parameter
    const notificationResult = await createNotification(
      pool, // 👈 Add pool as first parameter
      account.customer_id,
      "DEPOSIT",
      `$${amount} has been deposited into your account (Account #${account_id})`,
      account_id,
    );

    console.log("🔵 Notification result:", notificationResult);

    res.json({ message: "Deposit successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   CUSTOMER: WITHDRAW MONEY
========================= */
const withdrawMoney = async (req, res) => {
  const { account_id, amount } = req.body;
  const customerId = req.user.customerId;

  if (!account_id || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid withdraw data" });
  }

  try {
    const pool = await poolPromise;

    // 1️⃣ Verify account ownership + active status
    const accountResult = await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("customer_id", sql.Int, customerId).query(`
        SELECT balance
        FROM Accounts
        WHERE account_id = @account_id
          AND customer_id = @customer_id
          AND status = 'ACTIVE'
      `);

    if (accountResult.recordset.length === 0) {
      return res.status(403).json({
        message: "Account not found or not active",
      });
    }

    const currentBalance = accountResult.recordset[0].balance;

    // 2️⃣ Check sufficient balance
    if (currentBalance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // 3️⃣ Deduct balance
    await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        UPDATE Accounts
        SET balance = balance - @amount
        WHERE account_id = @account_id
      `);

    // 4️⃣ Insert transaction (✅ FIXED)
    await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        INSERT INTO Transactions 
        (account_id, transaction_type, transaction_reason, amount)
        VALUES 
        (@account_id, 'DEBIT', 'WITHDRAW', @amount)
      `);

    // ✅ Notify associated user about withdrawal
    const associatedUser = accountResult.recordset[0].approved_by_user;
    if (associatedUser) {
      await createNotification(
        associatedUser,
        "WITHDRAWAL",
        `Customer withdrew $${amount} from account #${account_id}`,
        account_id,
      );
    }

    res.json({
      message: "Withdrawal successful",
      withdrawn_amount: amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   CUSTOMER: TRANSFER MONEY
========================= */

const transferMoney = async (req, res) => {
  const { sender_account_id, receiver_account_id, amount } = req.body;
  const customerId = req.user.customerId;

  if (!sender_account_id || !receiver_account_id || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid transfer data" });
  }

  try {
    const pool = await poolPromise;

    // 1️⃣ Verify sender account ownership + ACTIVE
    const senderResult = await pool
      .request()
      .input("sender_account_id", sql.Int, sender_account_id)
      .input("customer_id", sql.Int, customerId).query(`
        SELECT balance
        FROM Accounts
        WHERE account_id = @sender_account_id
          AND customer_id = @customer_id
          AND status = 'ACTIVE'
      `);

    if (senderResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ message: "Sender account not found or not active" });
    }

    const senderBalance = senderResult.recordset[0].balance;

    // 2️⃣ Check sufficient balance
    if (senderBalance < amount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance in sender account" });
    }

    // 3️⃣ Verify receiver account exists + ACTIVE
    const receiverResult = await pool
      .request()
      .input("receiver_account_id", sql.Int, receiver_account_id).query(`
        SELECT status
        FROM Accounts
        WHERE account_id = @receiver_account_id
          AND status = 'ACTIVE'
      `);

    if (receiverResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Receiver account not found or not active" });
    }

    // 4️⃣ Deduct from sender
    await pool
      .request()
      .input("sender_account_id", sql.Int, sender_account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        UPDATE Accounts
        SET balance = balance - @amount
        WHERE account_id = @sender_account_id
      `);

    // 5️⃣ Add to receiver
    await pool
      .request()
      .input("receiver_account_id", sql.Int, receiver_account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        UPDATE Accounts
        SET balance = balance + @amount
        WHERE account_id = @receiver_account_id
      `);

    // 6️⃣ Insert transactions
    await pool
      .request()
      .input("sender_account_id", sql.Int, sender_account_id)
      .input("receiver_account_id", sql.Int, receiver_account_id)
      .input("amount", sql.Decimal(10, 2), amount).query(`
        INSERT INTO Transactions (account_id, transaction_type, amount, transaction_reason)
        VALUES (@sender_account_id, 'DEBIT', @amount, 'TRANSFER')

        INSERT INTO Transactions (account_id, transaction_type, amount, transaction_reason)
        VALUES (@receiver_account_id, 'CREDIT', @amount, 'TRANSFER')
      `);

    // ✅ Notify associated user about transfer
    const associatedUser = senderResult.recordset[0].approved_by_user;
    if (associatedUser) {
      await createNotification(
        associatedUser,
        "TRANSFER",
        `Customer transferred $${amount} from account #${sender_account_id} to account #${receiver_account_id}`,
        sender_account_id,
      );
    }

    res.json({
      message: `Transfer of ${amount} from account ${sender_account_id} to ${receiver_account_id} successful`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   CUSTOMER: VIEW TRANSACTIONS
========================= */
const getAccountTransactions = async (req, res) => {
  const accountId = parseInt(req.params.account_id);
  const customerId = req.user.customerId;

  try {
    const pool = await poolPromise;

    // Verify account ownership
    const accountCheck = await pool
      .request()
      .input("account_id", sql.Int, accountId)
      .input("customer_id", sql.Int, customerId).query(`
        SELECT account_id
        FROM Accounts
        WHERE account_id = @account_id
          AND customer_id = @customer_id
      `);

    if (accountCheck.recordset.length === 0) {
      return res.status(403).json({
        message: "Unauthorized access to this account",
      });
    }

    // Fetch transactions with proper field mapping
    const transactionsResult = await pool
      .request()
      .input("account_id", sql.Int, accountId).query(`
        SELECT 
          transaction_id as id,
          transaction_type as type,
          amount,
          transaction_reason as description,
          transaction_time as createdAt  
        FROM Transactions
        WHERE account_id = @account_id
        ORDER BY transaction_time DESC
      `);

    res.json({
      account_id: accountId,
      transactions: transactionsResult.recordset,
    });
  } catch (err) {
    console.error("Error in getAccountTransactions:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  depositMoney,
  withdrawMoney,
  transferMoney,
  getAccountTransactions,
};
