const { poolPromise, sql } = require("../config/db");
const { createNotification, notifyAdmins } = require("../utils/notifications");

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

    // Get account and customer details
    const accountResult = await pool
      .request()
      .input("account_id", sql.Int, account_id).query(`
        SELECT a.status, a.balance, a.customer_id, c.customer_name, c.email,c.approved_by_user
        FROM Accounts a
        INNER JOIN Customers c ON a.customer_id = c.customer_id
        WHERE a.account_id = @account_id
      `);

    const account = accountResult.recordset[0];

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is not active" });
    }

    // Get current user info (the user making the deposit)
    const currentUserId = req.user.userId;
    const currentUserResult = await pool
      .request()
      .input("user_id", sql.Int, currentUserId).query(`
        SELECT full_name FROM Users WHERE user_id = @user_id
      `);

    const currentUserName =
      currentUserResult.recordset[0]?.full_name || `User #${currentUserId}`;

    // Update balance
    await pool
      .request()
      .input("amount", sql.Decimal(10, 2), amount)
      .input("account_id", sql.Int, account_id).query(`
        UPDATE Accounts
        SET balance = balance + @amount
        WHERE account_id = @account_id
      `);

    // Insert transaction
    const description = `Deposit of PKR ${amount} by ${currentUserName} to ${account.customer_name} (A/C ${account_id})`;

    await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("description", sql.VarChar, description).query(`
        INSERT INTO Transactions 
        (account_id, transaction_type, transaction_reason, amount, description)
        VALUES 
        (@account_id, 'CREDIT', 'DEPOSIT', @amount, @description)
      `);
    // Create notification directly for customer using customer_id
    console.log(
      "✅ Creating notification for customer ID:",
      account.customer_id,
    );

    await createNotification(
      pool,
      account.approved_by_user, // user_id
      null,
      "DEPOSIT_MADE",
      `You deposited $${amount} into ${account.customer_name}'s account (Account #${account_id})`,
      account_id,
    );

    await createNotification(
      pool,
      null, // no user_id
      account.customer_id, // customer_id
      "DEPOSIT",
      `$${amount} has been deposited into your account (Account #${account_id})`,
      account_id,
    );

    console.log("✅ Notification created successfully");

    res.json({ message: "Deposit successful", amount: amount });
  } catch (err) {
    console.error("Deposit error:", err);
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

    // 1️⃣ Verify account ownership + active status and get associated user
    const accountResult = await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("customer_id", sql.Int, customerId).query(`
        SELECT a.balance,c.customer_name,c.approved_by_user
        FROM Accounts a
        INNER JOIN Customers c ON a.customer_id = c.customer_id
        WHERE a.account_id = @account_id
          AND a.customer_id = @customer_id
          AND a.status = 'ACTIVE'
      `);

    if (accountResult.recordset.length === 0) {
      return res.status(403).json({
        message: "Account not found or not active",
      });
    }

    const currentBalance = accountResult.recordset[0].balance;
    const associatedUserId = accountResult.recordset[0].approved_by_user;
    const customerName = accountResult.recordset[0].customer_name;

    // 2️⃣ Check sufficient balance
    if (currentBalance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // 3️⃣ Deduct balance
    await pool
      .request()
      .input("amount", sql.Decimal(10, 2), amount)
      .input("account_id", sql.Int, account_id).query(`
        UPDATE Accounts
        SET balance = balance - @amount
        WHERE account_id = @account_id
      `);

    // 4️⃣ Insert transaction with description
    const description = `Withdrawal of PKR ${amount} by ${customerName} from account #${account_id}`;

    await pool
      .request()
      .input("account_id", sql.Int, account_id)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("description", sql.VarChar, description).query(`
        INSERT INTO Transactions 
        (account_id, transaction_type, transaction_reason, amount, description)
        VALUES 
        (@account_id, 'DEBIT', 'WITHDRAW', @amount, @description)
      `);

    // 5️⃣ Notify associated user about withdrawal
    if (associatedUserId) {
      console.log(
        "✅ Creating notification for associated user:",
        associatedUserId,
      );

      await createNotification(
        pool,
        associatedUserId, // user_id
        null, //  customer_id
        "WITHDRAWAL",
        `Customer withdrew $${amount} from account #${account_id}`,
        account_id,
      );

      console.log("✅ Notification created successfully");
    } else {
      console.log("⚠️ No associated user found for this customer");
    }

    // 2️⃣ Notify CUSTOMER (the person who made the withdrawal)
    console.log("✅ Notifying customer:", customerId);

    await createNotification(
      pool,
      null, // no user_id
      customerId, // customer_id
      "WITHDRAWAL_SUCCESS",
      `You successfully withdrew $${amount} from account #${account_id}`,
      account_id,
    );

    res.json({
      message: "Withdrawal successful",
      withdrawn_amount: amount,
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
};
/* =========================
   CUSTOMER: TRANSFER MONEY
========================= */

const transferMoney = async (req, res) => {
  // Accept both naming conventions
  const sender_account_id =
    req.body.sender_account_id ||
    req.body.from_account_id ||
    req.body.fromAccountId;
  const receiver_account_id =
    req.body.receiver_account_id ||
    req.body.to_account_number ||
    req.body.toAccountNumber;
  const amount = req.body.amount;

  console.log("📊 Parsed values:", {
    sender_account_id,
    receiver_account_id,
    amount,
  });

  const customerId = req.user.customerId;

  if (!sender_account_id || !receiver_account_id || !amount || amount <= 0) {
    console.log("❌ Invalid transfer data - missing fields");
    return res.status(400).json({ message: "Invalid transfer data" });
  }

  try {
    const pool = await poolPromise;

    // 1️⃣ Verify sender account ownership + ACTIVE and get associated user
    const senderResult = await pool
      .request()
      .input("sender_account_id", sql.Int, sender_account_id)
      .input("customer_id", sql.Int, customerId).query(`
        SELECT a.balance, a.customer_id, c.customer_name, c.approved_by_user
        FROM Accounts a
        INNER JOIN Customers c ON a.customer_id = c.customer_id
        WHERE a.account_id = @sender_account_id
          AND a.customer_id = @customer_id
          AND a.status = 'ACTIVE'
      `);

    if (senderResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ message: "Sender account not found or not active" });
    }

    const senderBalance = senderResult.recordset[0].balance;
    const senderCustomerId = senderResult.recordset[0].customer_id;
    const senderCustomerName = senderResult.recordset[0].customer_name;
    const associatedUserId = senderResult.recordset[0].approved_by_user;

    // 2️⃣ Check sufficient balance
    if (senderBalance < amount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance in sender account" });
    }

    // 3️⃣ Verify receiver account exists + ACTIVE and get receiver info
    const receiverResult = await pool
      .request()
      .input("receiver_account_id", sql.Int, receiver_account_id).query(`
        SELECT a.customer_id, c.customer_name
        FROM Accounts a
        INNER JOIN Customers c ON a.customer_id = c.customer_id
        WHERE a.account_id = @receiver_account_id
          AND a.status = 'ACTIVE'
      `);

    if (receiverResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Receiver account not found or not active" });
    }

    const receiverCustomerId = receiverResult.recordset[0].customer_id;
    const receiverCustomerName = receiverResult.recordset[0].customer_name;

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

    // 6️⃣ Insert transactions with detailed description
    const senderDescription = `Transferred PKR ${amount} to ${receiverCustomerName} (A/C ${receiver_account_id})`;
    const receiverDescription = `Received PKR ${amount} from ${senderCustomerName} (A/C ${sender_account_id})`;

    await pool
      .request()
      .input("sender_account_id", sql.Int, sender_account_id)
      .input("receiver_account_id", sql.Int, receiver_account_id)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("sender_desc", sql.VarChar, senderDescription)
      .input("receiver_desc", sql.VarChar, receiverDescription).query(`
    INSERT INTO Transactions (account_id, transaction_type, amount, transaction_reason, description)
    VALUES (@sender_account_id, 'DEBIT', @amount, 'TRANSFER', @sender_desc);

    INSERT INTO Transactions (account_id, transaction_type, amount, transaction_reason, description)
    VALUES (@receiver_account_id, 'CREDIT', @amount, 'TRANSFER', @receiver_desc)
  `);

    // 7️⃣ Notify SENDER's associated user (the user who manages this customer)
    if (associatedUserId) {
      console.log(
        "✅ Creating notification for sender's associated user:",
        associatedUserId,
      );

      await createNotification(
        pool,
        associatedUserId,
        null,
        "TRANSFER_SENT",
        `${senderCustomerName} transferred $${amount} from account #${sender_account_id} to ${receiverCustomerName}`,
        sender_account_id,
      );
    }

    // 8️⃣ Notify SENDER (customer) about money sent
    console.log(
      "✅ Creating notification for sender (customer):",
      senderCustomerId,
    );

    await createNotification(
      pool,
      null,
      senderCustomerId,
      "MONEY_SENT",
      `You sent $${amount} to ${receiverCustomerName} (Account #${receiver_account_id})`,
      sender_account_id,
    );

    // 9️⃣ Notify RECEIVER (customer) about money received
    console.log(
      "✅ Creating notification for receiver (customer):",
      receiverCustomerId,
    );

    await createNotification(
      pool,
      null,
      receiverCustomerId,
      "MONEY_RECEIVED",
      `You received $${amount} from ${senderCustomerName} (Account #${sender_account_id})`,
      receiver_account_id,
    );

    res.json({
      message: `Transfer of ${amount} from account ${sender_account_id} to ${receiver_account_id} successful`,
    });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   CUSTOMER: VIEW TRANSACTIONS
========================= */
// GET /api/transactions/account/:accountId
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
        SELECT account_id, balance
        FROM Accounts
        WHERE account_id = @account_id
          AND customer_id = @customer_id
      `);

    if (accountCheck.recordset.length === 0) {
      return res.status(403).json({
        message: "Unauthorized access to this account",
      });
    }

    const currentBalance = accountCheck.recordset[0].balance;

    // Fetch transactions with running balance
    const transactionsResult = await pool
      .request()
      .input("account_id", sql.Int, accountId).query(`
        SELECT 
          transaction_id as id,
          transaction_type as type,
          amount,
          transaction_reason,
          description,
          transaction_time as createdAt,
          SUM(CASE 
            WHEN transaction_type = 'CREDIT' THEN amount 
            WHEN transaction_type = 'DEBIT' THEN -amount 
            ELSE 0 
          END) OVER (ORDER BY transaction_time) as running_balance
        FROM Transactions
        WHERE account_id = @account_id
        ORDER BY transaction_time DESC
      `);

    res.json({
      account_id: accountId,
      current_balance: currentBalance,
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
