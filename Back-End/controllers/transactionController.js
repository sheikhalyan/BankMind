const { getPool, sql } = require("../config/db");
const { notifyCustomer, notifyStaff, notifyAdmins } = require("../utils/notifications");

/* =========================
   STAFF: DEPOSIT MONEY
   POST /api/transactions/deposit
   Body: { account_id, amount, description? }
========================= */
const depositMoney = async (req, res) => {
  const { account_id, amount, description } = req.body;

  if (!account_id || !amount || amount <= 0)
    return res.status(400).json({ message: "Invalid deposit data." });

  try {
    const pool = await getPool();

    const accountResult = await pool.request()
      .input("account_id", sql.Int, account_id)
      .query(`
        SELECT a.status, a.account_number, a.customer_id,
               c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id = @account_id
      `);

    const account = accountResult.recordset[0];
    if (!account)
      return res.status(404).json({ message: "Account not found." });
    if (account.status !== "ACTIVE")
      return res.status(403).json({ message: "Account is not active." });
    if (account.assigned_staff_id !== req.user.userId)
      return res.status(403).json({ message: "This account does not belong to your assigned customers." });

    const staffResult = await pool.request()
      .input("user_id", sql.Int, req.user.userId)
      .query(`SELECT full_name FROM Users WHERE user_id = @user_id`);
    const staffName = staffResult.recordset[0]?.full_name || `Staff #${req.user.userId}`;

    const txDescription = description ||
      `Deposit of PKR ${amount} by ${staffName} to ${account.customer_name} (A/C ${account.account_number})`;

    // ── DB TRANSACTION ──────────────────────────────────────────────
    const dbTx = pool.transaction();
    await dbTx.begin();
    let transactionId;
    try {
      await dbTx.request()
        .input("amount", sql.Decimal(15, 2), amount)
        .input("account_id", sql.Int, account_id)
        .query(`UPDATE Accounts SET balance = balance + @amount WHERE account_id = @account_id`);

      const txResult = await dbTx.request()
        .input("account_id", sql.Int, account_id)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("description", sql.NVarChar, txDescription)
        .query(`
          INSERT INTO Transactions (to_account_id, transaction_type, amount, description)
          OUTPUT INSERTED.transaction_id
          VALUES (@account_id, 'DEPOSIT', @amount, @description)
        `);

      await dbTx.commit();
      transactionId = txResult.recordset[0].transaction_id;

    } catch (txErr) {
      try { await dbTx.rollback(); } catch (_) { }
      throw txErr;
    }
    // ── END DB TRANSACTION ──────────────────────────────────────────

    // ✅ ALL THREE NOTIFICATIONS
    // 1. Notify Customer
    await notifyCustomer({
      customer_id: account.customer_id,
      type: "DEPOSIT",
      message: `PKR ${amount} has been deposited to your account (A/C ${account.account_number}).`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    // 2. Notify Staff (who made the deposit)
    await notifyStaff({
      user_id: req.user.userId,
      type: "DEPOSIT",
      message: `You deposited PKR ${amount} to customer "${account.customer_name}" (A/C ${account.account_number}).`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    // 3. Notify All Admins
    await notifyAdmins({
      type: "DEPOSIT",
      message: `💰 DEPOSIT: ${staffName} deposited PKR ${amount} to account ${account.account_number} (${account.customer_name})`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    console.log(`✅ Deposit notifications sent to: Customer ${account.customer_id}, Staff ${req.user.userId}, and all Admins`);

    return res.json({
      message: "Deposit successful",
      amount,
      transaction_id: transactionId
    });

  } catch (err) {
    console.error("Deposit error:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* =========================
   CUSTOMER: WITHDRAW MONEY
   POST /api/transactions/withdraw
   Body: { account_id, amount, description? }
========================= */
const withdrawMoney = async (req, res) => {
  const { account_id, amount, description } = req.body;
  const customerId = req.user.customerId;

  console.log(`✅ [WITHDRAWAL] → CUSTOMER ${customerId}`);

  if (!account_id || !amount || amount <= 0)
    return res.status(400).json({ message: "Invalid withdraw data." });

  try {
    const pool = await getPool();

    const accountResult = await pool.request()
      .input("account_id", sql.Int, account_id)
      .input("customer_id", sql.Int, customerId)
      .query(`
        SELECT a.balance, a.account_number, a.status,
               c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id  = @account_id
          AND  a.customer_id = @customer_id
      `);

    if (!accountResult.recordset[0])
      return res.status(403).json({ message: "Account not found." });

    const { balance, account_number, status, customer_name, assigned_staff_id } = accountResult.recordset[0];

    if (status === 'FROZEN')
      return res.status(403).json({ message: "Your account is frozen. Please contact support." });

    if (status !== 'ACTIVE')
      return res.status(403).json({ message: "Account is not active." });

    if (balance < amount)
      return res.status(400).json({ message: "Insufficient balance." });

    const txDescription = description ||
      `Withdrawal of PKR ${amount} by ${customer_name} from account ${account_number}`;

    // ── DB TRANSACTION ──────────────────────────────────────────────
    const dbTx = pool.transaction();
    await dbTx.begin();
    let transactionId;
    try {
      await dbTx.request()
        .input("amount", sql.Decimal(15, 2), amount)
        .input("account_id", sql.Int, account_id)
        .query(`UPDATE Accounts SET balance = balance - @amount WHERE account_id = @account_id`);

      const txResult = await dbTx.request()
        .input("account_id", sql.Int, account_id)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("description", sql.NVarChar, txDescription)
        .query(`
          INSERT INTO Transactions (from_account_id, transaction_type, amount, description)
          OUTPUT INSERTED.transaction_id
          VALUES (@account_id, 'WITHDRAWAL', @amount, @description)
        `);

      await dbTx.commit();
      transactionId = txResult.recordset[0].transaction_id;

    } catch (txErr) {
      try { await dbTx.rollback(); } catch (_) { }
      throw txErr;
    }
    // ── END DB TRANSACTION ──────────────────────────────────────────

    // ✅ ALL THREE NOTIFICATIONS
    // 1. Notify Customer (self)
    await notifyCustomer({
      customer_id: customerId,
      type: "WITHDRAWAL",
      message: `PKR ${amount} has been withdrawn from your account (A/C ${account_number}).`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    // 2. Notify Assigned Staff
    if (assigned_staff_id) {
      await notifyStaff({
        user_id: assigned_staff_id,
        type: "WITHDRAWAL",
        message: `Customer "${customer_name}" withdrew PKR ${amount} from account ${account_number}.`,
        related_id: transactionId,
        related_type: "TRANSACTION",
      });
    }

    // 3. Notify All Admins
    await notifyAdmins({
      type: "WITHDRAWAL",
      message: `🏧 WITHDRAWAL: "${customer_name}" withdrew PKR ${amount} from account ${account_number}.`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    console.log(`✅ Withdrawal notifications sent to: Customer ${customerId}, Staff ${assigned_staff_id}, and all Admins`);

    return res.json({ message: "Withdrawal successful", withdrawn_amount: amount, transaction_id: transactionId });

  } catch (err) {
    console.error("Withdrawal error:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* =========================
   CUSTOMER: TRANSFER MONEY
   POST /api/transactions/transfer
   Body: { from_account_id | fromAccountId, toAccountNumber, amount, description? }
========================= */
const transferMoney = async (req, res) => {
  const from_account_id = req.body.from_account_id || req.body.fromAccountId;
  const toAccountNumber = req.body.toAccountNumber || req.body.to_account_number;
  const { amount, description } = req.body;
  const customerId = req.user.customerId;

  if (!from_account_id || !toAccountNumber || !amount || amount <= 0)
    return res.status(400).json({ message: "Invalid transfer data." });

  try {
    const pool = await getPool();

    // Verify sender
    const senderResult = await pool.request()
      .input("account_id", sql.Int, from_account_id)
      .input("customer_id", sql.Int, customerId)
      .query(`
        SELECT a.balance, a.account_number,
               c.customer_id, c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id  = @account_id
          AND  a.customer_id = @customer_id
          AND  a.status      = 'ACTIVE'
      `);

    if (!senderResult.recordset[0])
      return res.status(403).json({ message: "Sender account not found or not active." });

    const sender = senderResult.recordset[0];

    if (sender.status === 'FROZEN')
      return res.status(403).json({ message: "Your account is frozen. Please contact support." });
    if (sender.status !== 'ACTIVE')
      return res.status(403).json({ message: "Sender account is not active." });

    if (sender.balance < amount)
      return res.status(400).json({ message: "Insufficient balance." });

    // Lookup receiver by account_number
    const receiverResult = await pool.request()
      .input("account_number", sql.NVarChar, toAccountNumber)
      .query(`
        SELECT a.account_id, a.account_number, a.status,
               c.customer_id, c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_number = @account_number
      `);

    if (!receiverResult.recordset[0])
      return res.status(404).json({ message: "Receiver account not found." });

    const receiver = receiverResult.recordset[0];

    if (receiver.status === 'FROZEN')
      return res.status(403).json({ message: "Recipient account is frozen and cannot receive funds." });
    if (receiver.status !== 'ACTIVE')
      return res.status(403).json({ message: "Recipient account is not active." });

    if (receiver.account_id === from_account_id)
      return res.status(400).json({ message: "Cannot transfer to the same account." });

    const txDescription = description ||
      `Transfer of PKR ${amount} from ${sender.account_number} to ${receiver.account_number}`;

    // ── DB TRANSACTION ──────────────────────────────────────────────
    const dbTx = pool.transaction();
    await dbTx.begin();
    let transactionId;
    try {
      await dbTx.request()
        .input("amount", sql.Decimal(15, 2), amount)
        .input("account_id", sql.Int, from_account_id)
        .query(`UPDATE Accounts SET balance = balance - @amount WHERE account_id = @account_id`);

      await dbTx.request()
        .input("amount", sql.Decimal(15, 2), amount)
        .input("account_id", sql.Int, receiver.account_id)
        .query(`UPDATE Accounts SET balance = balance + @amount WHERE account_id = @account_id`);

      const txResult = await dbTx.request()
        .input("from_account_id", sql.Int, from_account_id)
        .input("to_account_id", sql.Int, receiver.account_id)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("description", sql.NVarChar, txDescription)
        .query(`
          INSERT INTO Transactions (from_account_id, to_account_id, transaction_type, amount, description)
          OUTPUT INSERTED.transaction_id
          VALUES (@from_account_id, @to_account_id, 'TRANSFER', @amount, @description)
        `);

      await dbTx.commit();
      transactionId = txResult.recordset[0].transaction_id;

    } catch (txErr) {
      try { await dbTx.rollback(); } catch (_) { }
      throw txErr;
    }
    // ── END DB TRANSACTION ──────────────────────────────────────────

    // ✅ ALL NOTIFICATIONS FOR TRANSFER
    // 1. Notify Sender
    await notifyCustomer({
      customer_id: sender.customer_id,
      type: "TRANSFER_SENT",
      message: `PKR ${amount} has been transferred to account ${receiver.account_number} (${receiver.customer_name}).`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    // 2. Notify Sender's Assigned Staff
    if (sender.assigned_staff_id) {
      await notifyStaff({
        user_id: sender.assigned_staff_id,
        type: "TRANSFER_SENT",
        message: `Your customer "${sender.customer_name}" transferred PKR ${amount} to account ${receiver.account_number} (${receiver.customer_name}).`,
        related_id: transactionId,
        related_type: "TRANSACTION",
      });
    }

    // 3. Notify Receiver
    await notifyCustomer({
      customer_id: receiver.customer_id,
      type: "TRANSFER_RECEIVED",
      message: `PKR ${amount} has been received from account ${sender.account_number} (${sender.customer_name}).`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    // 4. Notify Receiver's Assigned Staff
    if (receiver.assigned_staff_id) {
      await notifyStaff({
        user_id: receiver.assigned_staff_id,
        type: "TRANSFER_RECEIVED",
        message: `Your customer "${receiver.customer_name}" received PKR ${amount} from account ${sender.account_number} (${sender.customer_name}).`,
        related_id: transactionId,
        related_type: "TRANSACTION",
      });
    }

    // 5. Notify All Admins
    await notifyAdmins({
      type: "TRANSFER",
      message: `💸 TRANSFER: ${sender.customer_name} (${sender.account_number}) → ${receiver.customer_name} (${receiver.account_number}) | Amount: PKR ${amount}`,
      related_id: transactionId,
      related_type: "TRANSACTION",
    });

    console.log(`✅ Transfer notifications sent to: Sender ${sender.customer_id}, Receiver ${receiver.customer_id}, both staff, and all Admins`);

    return res.json({
      message: `Transfer of PKR ${amount} successful`,
      transaction_id: transactionId,
      from_account: sender.account_number,
      to_account: receiver.account_number,
    });

  } catch (err) {
    console.error("Transfer error:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* =========================
   CUSTOMER: VIEW TRANSACTIONS
   GET /api/transactions/account/:accountId
========================= */
const getAccountTransactions = async (req, res) => {
  const accountId = parseInt(req.params.accountId);
  const customerId = req.user.customerId;

  if (isNaN(accountId))
    return res.status(400).json({ message: "Invalid account ID." });

  try {
    const pool = await getPool();

    const accountCheck = await pool.request()
      .input("account_id", sql.Int, accountId)
      .input("customer_id", sql.Int, customerId)
      .query(`
        SELECT account_id, account_number, balance
        FROM   Accounts
        WHERE  account_id  = @account_id
          AND  customer_id = @customer_id
      `);

    if (!accountCheck.recordset[0])
      return res.status(403).json({ message: "Unauthorized access to this account." });

    const { balance, account_number } = accountCheck.recordset[0];

    const transactionsResult = await pool.request()
      .input("account_id", sql.Int, accountId)
      .query(`
        SELECT
          t.transaction_id                                          AS id,
          t.transaction_type                                        AS type,
          t.amount,
          t.description,
          t.status,
          t.is_fraud,
          t.transaction_time                                        AS createdAt,
          fa.account_number                                         AS from_account_number,
          ta.account_number                                         AS to_account_number,
          CASE
            WHEN t.to_account_id   = @account_id THEN 'CREDIT'
            WHEN t.from_account_id = @account_id THEN 'DEBIT'
          END                                                       AS direction,
          SUM(
            CASE
              WHEN t.to_account_id   = @account_id THEN  t.amount
              WHEN t.from_account_id = @account_id THEN -t.amount
              ELSE 0
            END
          ) OVER (ORDER BY t.transaction_time ASC)                 AS running_balance
        FROM Transactions t
        LEFT JOIN Accounts fa ON fa.account_id = t.from_account_id
        LEFT JOIN Accounts ta ON ta.account_id = t.to_account_id
        WHERE t.from_account_id = @account_id
           OR t.to_account_id   = @account_id
        ORDER BY t.transaction_time DESC
      `);

    return res.json({
      account_id: accountId,
      account_number,
      current_balance: balance,
      transactions: transactionsResult.recordset,
    });

  } catch (err) {
    console.error("Error in getAccountTransactions:", err);
    return res.status(500).json({ error: err.message });
  }
};


module.exports = { depositMoney, withdrawMoney, transferMoney, getAccountTransactions };