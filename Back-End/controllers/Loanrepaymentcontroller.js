const { getPool, sql } = require('../config/db');
const {
    notifyCustomer,
    notifyStaff,
    notifyAdmins,
} = require('../utils/notifications');

// ================================================================
//  1. GET REPAYMENT SCHEDULE
//     GET /api/loan-repayments/:loanId/schedule
// ================================================================
const getRepaymentSchedule = async (req, res) => {
    const { loanId } = req.params;
    const role = req.user.role?.toUpperCase();
    const customerId = req.user.customerId;

    try {
        const pool = await getPool();

        if (role === 'CUSTOMER') {
            const check = await pool.request()
                .input('loan_id', sql.Int, loanId)
                .input('customer_id', sql.Int, customerId)
                .query(`SELECT loan_id FROM Loans WHERE loan_id = @loan_id AND customer_id = @customer_id`);
            if (!check.recordset[0])
                return res.status(403).json({ message: 'Unauthorized.' });
        }

        // Fetch loan summary
        const loanResult = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`
        SELECT
          l.loan_id, l.loan_amount, l.approved_amount,
          l.duration_months, l.start_date, l.end_date,
          l.status, l.auto_deduct,
          lp.loan_type, lp.interest_rate
        FROM   Loans l
        JOIN   Loan_Policies lp ON lp.policy_id = l.policy_id
        WHERE  l.loan_id = @loan_id
      `);

        const loan = loanResult.recordset[0];
        if (!loan)
            return res.status(404).json({ message: 'Loan not found.' });

        // Recalculate interest summary for display
        const principal = parseFloat(loan.approved_amount || loan.loan_amount);
        const annualRate = parseFloat(loan.interest_rate);
        const months = parseInt(loan.duration_months);
        const years = months / 12;
        const totalInterest = parseFloat(((principal * annualRate * years) / 100).toFixed(2));
        const totalRepayment = parseFloat((principal + totalInterest).toFixed(2));

        const result = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`
        SELECT
          r.repayment_id,
          r.installment_no,
          r.amount,
          r.due_date,
          r.paid_date,
          r.status,
          r.transaction_id,
          CASE
            WHEN r.status IN ('PENDING','OVERDUE') AND r.due_date < CAST(GETDATE() AS DATE)
            THEN 1 ELSE 0
          END AS is_overdue
        FROM  Loan_Repayments r
        WHERE r.loan_id = @loan_id
        ORDER BY r.installment_no ASC
      `);

        const rows = result.recordset;
        const totalPaid = rows.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0);
        const totalLeft = rows.filter(r => r.status !== 'PAID').reduce((s, r) => s + Number(r.amount), 0);

        return res.json({
            loan_id: Number(loanId),
            loan_info: {
                loan_type: loan.loan_type,
                principal,
                annual_rate: annualRate,
                total_interest: totalInterest,
                total_repayment: totalRepayment,
                start_date: loan.start_date,
                end_date: loan.end_date,
                status: loan.status,
                auto_deduct: loan.auto_deduct,
            },
            summary: {
                total_installments: rows.length,
                paid: rows.filter(r => r.status === 'PAID').length,
                pending: rows.filter(r => r.status === 'PENDING').length,
                overdue: rows.filter(r => r.is_overdue).length,
                total_paid_amount: parseFloat(totalPaid.toFixed(2)),
                total_remaining: parseFloat(totalLeft.toFixed(2)),
            },
            schedule: rows,
        });

    } catch (err) {
        console.error('[getRepaymentSchedule]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ================================================================
//  2. MANUAL REPAYMENT — with balloon payment support
//     POST /api/loan-repayments/:loanId/pay
//     Body: { from_account_id, repayment_ids: number[] }
//
//     - repayment_ids: array of installment IDs to pay
//     - Customer can pay 1, 2, 3, or any number at once (balloon)
//     - Can pay PENDING or OVERDUE installments
//     - Total deducted = sum of all selected installments
// ================================================================
const payInstallment = async (req, res) => {
    const { loanId } = req.params;
    const { repayment_ids, from_account_id } = req.body;
    const customerId = req.user.customerId;

    if (!repayment_ids || !Array.isArray(repayment_ids) || repayment_ids.length === 0)
        return res.status(400).json({ message: 'repayment_ids (array) is required.' });
    if (!from_account_id)
        return res.status(400).json({ message: 'from_account_id is required.' });

    try {
        const pool = await getPool();

        // Verify loan belongs to customer and is ACTIVE
        const loanResult = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .input('customer_id', sql.Int, customerId)
            .query(`
        SELECT l.loan_id, l.status,
               c.full_name AS customer_name,
               c.assigned_staff_id AS staff_id,
               lp.loan_type
        FROM   Loans l
        JOIN   Customers     c  ON c.customer_id = l.customer_id
        JOIN   Loan_Policies lp ON lp.policy_id  = l.policy_id
        WHERE  l.loan_id     = @loan_id
          AND  l.customer_id = @customer_id
      `);

        const loan = loanResult.recordset[0];
        if (!loan) return res.status(404).json({ message: 'Loan not found.' });
        if (loan.status !== 'ACTIVE')
            return res.status(400).json({ message: 'Loan is not active.' });

        // Fetch all requested repayment rows — verify they belong to this loan
        const idList = repayment_ids.map(id => parseInt(id)).filter(Boolean).join(',');
        const repayResults = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`
        SELECT * FROM Loan_Repayments
        WHERE  repayment_id IN (${idList})
          AND  loan_id = @loan_id
        ORDER BY installment_no ASC
      `);

        const repayments = repayResults.recordset;

        if (repayments.length !== repayment_ids.length)
            return res.status(400).json({ message: 'Some installment IDs not found or do not belong to this loan.' });

        // All must be PENDING or OVERDUE
        const invalid = repayments.filter(r => r.status === 'PAID');
        if (invalid.length > 0)
            return res.status(400).json({
                message: `Installment(s) #${invalid.map(r => r.installment_no).join(', ')} already paid.`
            });

        // Calculate total amount
        const totalAmount = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const totalFixed = parseFloat(totalAmount.toFixed(2));

        // Verify account balance
        const accountResult = await pool.request()
            .input('account_id', sql.Int, from_account_id)
            .input('customer_id', sql.Int, customerId)
            .query(`
        SELECT account_id, balance, account_number, status
        FROM   Accounts
        WHERE  account_id = @account_id AND customer_id = @customer_id
      `);

        const account = accountResult.recordset[0];
        if (!account)
            return res.status(404).json({ message: 'Account not found.' });
        if (account.status !== 'ACTIVE')
            return res.status(400).json({ message: 'Account is not active.' });
        if (parseFloat(account.balance) < totalFixed)
            return res.status(400).json({
                message: `Insufficient balance. Required: PKR ${totalFixed.toLocaleString()}, Available: PKR ${parseFloat(account.balance).toLocaleString()}`
            });

        // DB transaction — single deduction for all selected installments
        const dbTx = pool.transaction();
        await dbTx.begin();
        let transactionId;

        try {
            // Deduct total from account
            await dbTx.request()
                .input('amount', sql.Decimal(15, 2), totalFixed)
                .input('account_id', sql.Int, from_account_id)
                .query(`UPDATE Accounts SET balance = balance - @amount WHERE account_id = @account_id`);

            const installmentNos = repayments.map(r => r.installment_no).join(', ');

            // Record one transaction for the whole payment
            const txResult = await dbTx.request()
                .input('from_account_id', sql.Int, from_account_id)
                .input('amount', sql.Decimal(15, 2), totalFixed)
                .input('description', sql.NVarChar,
                    `Loan repayment - Installment(s) #${installmentNos} for loan #${loanId} (${repayments.length > 1 ? 'balloon payment' : 'single payment'})`)
                .query(`
          INSERT INTO Transactions (from_account_id, transaction_type, amount, description)
          OUTPUT INSERTED.transaction_id
          VALUES (@from_account_id, 'LOAN_REPAYMENT', @amount, @description)
        `);

            transactionId = txResult.recordset[0].transaction_id;

            // Mark each installment as PAID
            for (const repayment of repayments) {
                await dbTx.request()
                    .input('repayment_id', sql.Int, repayment.repayment_id)
                    .input('transaction_id', sql.Int, transactionId)
                    .query(`
            UPDATE Loan_Repayments
            SET    status         = 'PAID',
                   paid_date      = CAST(GETDATE() AS DATE),
                   transaction_id = @transaction_id
            WHERE  repayment_id   = @repayment_id
          `);
            }

            await dbTx.commit();

        } catch (txErr) {
            try { await dbTx.rollback(); } catch (_) { }
            throw txErr;
        }

        // Check if all installments paid → close loan
        const remaining = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`SELECT COUNT(*) AS cnt FROM Loan_Repayments WHERE loan_id = @loan_id AND status != 'PAID'`);

        let loanClosed = false;
        if (remaining.recordset[0].cnt === 0) {
            await pool.request()
                .input('loan_id', sql.Int, loanId)
                .query(`UPDATE Loans SET status = 'CLOSED' WHERE loan_id = @loan_id`);
            loanClosed = true;

            await notifyCustomer({
                customer_id: customerId,
                type: 'LOAN_CLOSED',
                message: `Congratulations! Your ${loan.loan_type} loan has been fully repaid and is now closed.`,
                related_id: Number(loanId),
                related_type: 'LOAN',
            });
        }

        const isBalloon = repayments.length > 1;
        const installmentNos = repayments.map(r => r.installment_no).join(', ');

        // Notifications
        await Promise.all([
            notifyCustomer({
                customer_id: customerId,
                type: 'LOAN_REPAYMENT_PAID',
                message: isBalloon
                    ? `Balloon payment of PKR ${totalFixed.toLocaleString()} for installments #${installmentNos} paid successfully.`
                    : `Installment #${repayments[0].installment_no} of PKR ${totalFixed.toLocaleString()} paid successfully.`,
                related_id: transactionId,
                related_type: 'TRANSACTION',
            }),
            loan.staff_id && notifyStaff({
                user_id: loan.staff_id,
                type: 'LOAN_REPAYMENT_PAID',
                message: `Customer "${loan.customer_name}" paid ${isBalloon ? `${repayments.length} installments (balloon) ` : `installment #${repayments[0].installment_no} `}of PKR ${totalFixed.toLocaleString()}.`,
                related_id: transactionId,
                related_type: 'TRANSACTION',
            }),
            notifyAdmins({
                type: 'LOAN_REPAYMENT_PAID',
                message: `Customer "${loan.customer_name}" paid ${isBalloon ? `${repayments.length} installments` : `installment #${repayments[0].installment_no}`} of PKR ${totalFixed.toLocaleString()}.`,
                related_id: transactionId,
                related_type: 'TRANSACTION',
            }),
        ].filter(Boolean));

        return res.json({
            message: isBalloon
                ? `Balloon payment for ${repayments.length} installments paid successfully.`
                : `Installment #${repayments[0].installment_no} paid successfully.`,
            installments_paid: repayments.map(r => r.installment_no),
            total_paid: totalFixed,
            transaction_id: transactionId,
            loan_closed: loanClosed,
        });

    } catch (err) {
        console.error('[payInstallment]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ================================================================
//  3. AUTO-DEDUCTION — ONE LOAN
//     POST /api/loan-repayments/:loanId/auto-deduct
//     Only runs if TODAY matches the loan's start day of month
//     e.g. loan started on 15th → only runs on 15th of each month
//     Processes only the CURRENT month's due installment
// ================================================================
const runAutoDeduction = async (req, res) => {
    const { loanId } = req.params;

    try {
        const pool = await getPool();
        const loanResult = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`
        SELECT l.loan_id, l.status, l.account_id, l.auto_deduct,
               l.start_date,
               c.customer_id, c.full_name AS customer_name,
               c.assigned_staff_id AS staff_id,
               lp.loan_type
        FROM   Loans l
        JOIN   Customers     c  ON c.customer_id = l.customer_id
        JOIN   Loan_Policies lp ON lp.policy_id  = l.policy_id
        WHERE  l.loan_id = @loan_id
      `);

        const loan = loanResult.recordset[0];
        if (!loan)
            return res.status(404).json({ message: 'Loan not found.' });
        if (loan.status !== 'ACTIVE')
            return res.status(400).json({ message: 'Loan is not active.' });
        if (!loan.auto_deduct)
            return res.status(400).json({ message: 'Auto-deduction is not enabled for this loan.' });

        // Check today matches the due day of month
        const today = new Date();
        const todayDay = today.getDate();
        const startDay = new Date(loan.start_date).getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        // Handle month-end: if start was day 31 and this month has 30 days → run on 30th
        const effectiveDueDay = Math.min(startDay, daysInMonth);

        if (todayDay !== effectiveDueDay) {
            return res.json({
                message: `Auto-deduction not due today. Due day: ${effectiveDueDay}, Today: ${todayDay}`,
                skipped: true,
            });
        }

        // Get this month's due installment (the PENDING one due today or overdue)
        const dueResult = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`
        SELECT TOP 1 * FROM Loan_Repayments
        WHERE  loan_id  = @loan_id
          AND  status   IN ('PENDING', 'OVERDUE')
          AND  due_date <= CAST(GETDATE() AS DATE)
        ORDER BY installment_no ASC
      `);

        if (dueResult.recordset.length === 0)
            return res.json({ message: 'No due installments found for today.', processed: 0 });

        const result = await processDeductions(pool, loan, dueResult.recordset);

        // Check if all paid → close loan
        const remaining = await pool.request()
            .input('loan_id', sql.Int, loanId)
            .query(`SELECT COUNT(*) AS cnt FROM Loan_Repayments WHERE loan_id = @loan_id AND status != 'PAID'`);
        if (remaining.recordset[0].cnt === 0) {
            await pool.request()
                .input('loan_id', sql.Int, loanId)
                .query(`UPDATE Loans SET status = 'CLOSED' WHERE loan_id = @loan_id`);
        }

        return res.json({ message: 'Auto-deduction complete.', results: result });

    } catch (err) {
        console.error('[runAutoDeduction]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ================================================================
//  4. AUTO-DEDUCTION — ALL ACTIVE LOANS
//     POST /api/loan-repayments/auto-deduct-all
//     Called by daily cron job at midnight
//     Each loan only deducts if today matches its start day
// ================================================================
const runAutoDeductionAll = async (req, res) => {
    try {
        const pool = await getPool();
        const today = new Date();
        const todayDay = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        // Get all ACTIVE auto-deduct loans where today is the due day
        const loansResult = await pool.request()
            .input('today_day', sql.Int, todayDay)
            .input('days_in_month', sql.Int, daysInMonth)
            .query(`
        SELECT DISTINCT
               l.loan_id, l.account_id, l.auto_deduct, l.start_date,
               c.customer_id, c.full_name AS customer_name,
               c.assigned_staff_id AS staff_id,
               lp.loan_type
        FROM   Loans l
        JOIN   Customers     c  ON c.customer_id = l.customer_id
        JOIN   Loan_Policies lp ON lp.policy_id  = l.policy_id
        WHERE  l.status      = 'ACTIVE'
          AND  l.auto_deduct = 1
          AND  (
            DAY(l.start_date) = @today_day
            OR (DAY(l.start_date) > @days_in_month AND @today_day = @days_in_month)
          )
          AND  EXISTS (
            SELECT 1 FROM Loan_Repayments r
            WHERE  r.loan_id  = l.loan_id
              AND  r.status   IN ('PENDING', 'OVERDUE')
              AND  r.due_date <= CAST(GETDATE() AS DATE)
          )
      `);

        if (loansResult.recordset.length === 0)
            return res.json({ message: 'No loans due for auto-deduction today.', processed: 0 });

        const summary = [];

        for (const loan of loansResult.recordset) {
            // Only process 1 installment per loan per run (monthly)
            const dueResult = await pool.request()
                .input('loan_id', sql.Int, loan.loan_id)
                .query(`
          SELECT TOP 1 * FROM Loan_Repayments
          WHERE  loan_id  = @loan_id
            AND  status   IN ('PENDING', 'OVERDUE')
            AND  due_date <= CAST(GETDATE() AS DATE)
          ORDER BY installment_no ASC
        `);

            if (dueResult.recordset.length === 0) continue;

            const results = await processDeductions(pool, loan, dueResult.recordset);

            // Check if all paid → close loan
            const remaining = await pool.request()
                .input('loan_id', sql.Int, loan.loan_id)
                .query(`SELECT COUNT(*) AS cnt FROM Loan_Repayments WHERE loan_id = @loan_id AND status != 'PAID'`);
            if (remaining.recordset[0].cnt === 0) {
                await pool.request()
                    .input('loan_id', sql.Int, loan.loan_id)
                    .query(`UPDATE Loans SET status = 'CLOSED' WHERE loan_id = @loan_id`);
            }

            summary.push({ loan_id: loan.loan_id, results });
        }

        return res.json({
            message: `Auto-deduction complete for ${summary.length} loans.`,
            summary,
        });

    } catch (err) {
        console.error('[runAutoDeductionAll]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ================================================================
//  5. MARK OVERDUE INSTALLMENTS
//     POST /api/loan-repayments/mark-overdue
// ================================================================
const markOverdueInstallments = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
      UPDATE Loan_Repayments
      SET    status = 'OVERDUE'
      WHERE  status   = 'PENDING'
        AND  due_date < CAST(GETDATE() AS DATE)
    `);
        const count = result.rowsAffected[0];
        return res.json({ message: `${count} installments marked as OVERDUE.` });
    } catch (err) {
        console.error('[markOverdueInstallments]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ================================================================
//  INTERNAL HELPER — shared deduction logic
// ================================================================
async function processDeductions(pool, loan, repayments) {
    const results = [];

    for (const repayment of repayments) {
        // Re-fetch balance before each attempt
        const balResult = await pool.request()
            .input('account_id', sql.Int, loan.account_id)
            .query(`SELECT balance FROM Accounts WHERE account_id = @account_id`);
        const currentBalance = parseFloat(balResult.recordset[0]?.balance || 0);
        const amount = parseFloat(repayment.amount);

        if (currentBalance < amount) {
            // Log failure
            await pool.request()
                .input('loan_id', sql.Int, loan.loan_id)
                .input('repayment_id', sql.Int, repayment.repayment_id)
                .input('from_account_id', sql.Int, loan.account_id)
                .input('amount', sql.Decimal(15, 2), amount)
                .input('failure_reason', sql.NVarChar, 'Insufficient balance')
                .query(`
          INSERT INTO Loan_Auto_Deductions
            (loan_id, repayment_id, from_account_id, amount, status, failure_reason)
          VALUES
            (@loan_id, @repayment_id, @from_account_id, @amount, 'FAILED', @failure_reason)
        `);

            // Count failures in last 90 days → 3 failures = DEFAULTED
            const failCount = await pool.request()
                .input('loan_id', sql.Int, loan.loan_id)
                .query(`
          SELECT COUNT(*) AS cnt FROM Loan_Auto_Deductions
          WHERE  loan_id = @loan_id AND status = 'FAILED'
            AND  attempted_at >= DATEADD(DAY, -90, GETDATE())
        `);

            if (failCount.recordset[0].cnt >= 3) {
                await pool.request()
                    .input('loan_id', sql.Int, loan.loan_id)
                    .query(`UPDATE Loans SET status = 'DEFAULTED' WHERE loan_id = @loan_id`);

                await Promise.all([
                    notifyCustomer({
                        customer_id: loan.customer_id,
                        type: 'LOAN_DEFAULTED',
                        message: `Your ${loan.loan_type} loan has been marked DEFAULTED due to 3 failed auto-deductions in 90 days. Please contact support immediately.`,
                        related_id: Number(loan.loan_id),
                        related_type: 'LOAN',
                    }),
                    loan.staff_id && notifyStaff({
                        user_id: loan.staff_id,
                        type: 'LOAN_DEFAULTED',
                        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan marked DEFAULTED.`,
                        related_id: Number(loan.loan_id),
                        related_type: 'LOAN',
                    }),
                    notifyAdmins({
                        type: 'LOAN_DEFAULTED',
                        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan DEFAULTED after 3 failed auto-deductions.`,
                        related_id: Number(loan.loan_id),
                        related_type: 'LOAN',
                    }),
                ].filter(Boolean));

                results.push({ repayment_id: repayment.repayment_id, status: 'DEFAULTED' });
                break;
            }

            await notifyCustomer({
                customer_id: loan.customer_id,
                type: 'AUTO_DEDUCTION_FAILED',
                message: `Auto-deduction failed for installment #${repayment.installment_no} of PKR ${amount.toLocaleString()}. Insufficient balance. Please pay manually before the next due date.`,
                related_id: Number(loan.loan_id),
                related_type: 'LOAN',
            });

            if (loan.staff_id) {
                await notifyStaff({
                    user_id: loan.staff_id,
                    type: 'AUTO_DEDUCTION_FAILED',
                    message: `Auto-deduction failed for customer "${loan.customer_name}" installment #${repayment.installment_no}.`,
                    related_id: Number(loan.loan_id),
                    related_type: 'LOAN',
                });
            }

            results.push({ repayment_id: repayment.repayment_id, status: 'FAILED', reason: 'Insufficient balance' });
            continue;
        }

        // SUCCESS
        const dbTx = pool.transaction();
        await dbTx.begin();
        let transactionId;

        try {
            await dbTx.request()
                .input('amount', sql.Decimal(15, 2), amount)
                .input('account_id', sql.Int, loan.account_id)
                .query(`UPDATE Accounts SET balance = balance - @amount WHERE account_id = @account_id`);

            const txResult = await dbTx.request()
                .input('from_account_id', sql.Int, loan.account_id)
                .input('amount', sql.Decimal(15, 2), amount)
                .input('description', sql.NVarChar,
                    `Auto loan repayment - Installment #${repayment.installment_no} for loan #${loan.loan_id}`)
                .query(`
          INSERT INTO Transactions (from_account_id, transaction_type, amount, description)
          OUTPUT INSERTED.transaction_id
          VALUES (@from_account_id, 'LOAN_REPAYMENT', @amount, @description)
        `);

            transactionId = txResult.recordset[0].transaction_id;

            await dbTx.request()
                .input('repayment_id', sql.Int, repayment.repayment_id)
                .input('transaction_id', sql.Int, transactionId)
                .query(`
          UPDATE Loan_Repayments
          SET    status = 'PAID', paid_date = CAST(GETDATE() AS DATE), transaction_id = @transaction_id
          WHERE  repayment_id = @repayment_id
        `);

            await dbTx.request()
                .input('loan_id', sql.Int, loan.loan_id)
                .input('repayment_id', sql.Int, repayment.repayment_id)
                .input('from_account_id', sql.Int, loan.account_id)
                .input('amount', sql.Decimal(15, 2), amount)
                .input('transaction_id', sql.Int, transactionId)
                .query(`
          INSERT INTO Loan_Auto_Deductions
            (loan_id, repayment_id, from_account_id, amount, status, transaction_id)
          VALUES
            (@loan_id, @repayment_id, @from_account_id, @amount, 'SUCCESS', @transaction_id)
        `);

            await dbTx.commit();

        } catch (txErr) {
            try { await dbTx.rollback(); } catch (_) { }
            results.push({ repayment_id: repayment.repayment_id, status: 'FAILED', reason: txErr.message });
            continue;
        }

        await notifyCustomer({
            customer_id: loan.customer_id,
            type: 'AUTO_DEDUCTION_SUCCESS',
            message: `Auto-deduction of PKR ${amount.toLocaleString()} for installment #${repayment.installment_no} was successful.`,
            related_id: transactionId,
            related_type: 'TRANSACTION',
        });

        results.push({ repayment_id: repayment.repayment_id, status: 'SUCCESS', transaction_id: transactionId });
    }

    return results;
}

module.exports = {
    getRepaymentSchedule,
    payInstallment,
    runAutoDeduction,
    runAutoDeductionAll,
    markOverdueInstallments,
};