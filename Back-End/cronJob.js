/**
 * cronJob.js
 * ──────────────────────────────────────────────────────────────────
 * BankMind Scheduled Jobs
 *
 * Requires:  npm install node-cron
 *
 * Jobs:
 *   1. 00:05 daily  → Mark overdue installments
 *   2. 00:10 daily  → Run auto-deduction for all eligible loans
 *
 * Usage:
 *   Require this file once in your server entry point:
 *     require('./cronJob');   // in app.js / server.js
 *
 * The cron schedules run in the server's local timezone.
 * To lock to a specific timezone, pass { timezone: "Asia/Karachi" }
 * in each cron.schedule() options object.
 * ──────────────────────────────────────────────────────────────────
 */

const cron = require('node-cron');
const { getPool, sql } = require('./config/db');
const {
    notifyCustomer,
    notifyStaff,
    notifyAdmins,
} = require('./utils/notifications');

// ── TIMEZONE ──────────────────────────────────────────────────────
const TIMEZONE = 'Asia/Karachi';

// ── LOGGER (simple console wrapper — swap for Winston if available) ─
const log = (level, msg, data) => {
    const ts = new Date().toISOString();
    const prefix = `[CRON][${ts}][${level.toUpperCase()}]`;
    if (data) console[level === 'error' ? 'error' : 'log'](prefix, msg, data);
    else console[level === 'error' ? 'error' : 'log'](prefix, msg);
};

// ================================================================
//  INTERNAL HELPER — deduction logic (same as Loanrepaymentcontroller)
// ================================================================
async function processDeductions(pool, loan, repayments) {
    const results = [];

    for (const repayment of repayments) {
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

            // 3 failures in 90 days → DEFAULTED
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
                message: `Auto-deduction failed for installment #${repayment.installment_no} of PKR ${amount.toLocaleString()}. Insufficient balance. Please pay manually.`,
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

        // SUCCESS — DB transaction
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

// ================================================================
//  JOB 1 — Mark overdue installments
//  Runs at 00:05 every day
//  Updates all PENDING installments whose due_date < today → OVERDUE
// ================================================================
async function jobMarkOverdue() {
    log('info', 'JOB 1 START — Mark overdue installments');
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            UPDATE Loan_Repayments
            SET    status = 'OVERDUE'
            WHERE  status   = 'PENDING'
              AND  due_date < CAST(GETDATE() AS DATE)
        `);
        const count = result.rowsAffected[0];
        log('info', `JOB 1 DONE — ${count} installment(s) marked OVERDUE`);
    } catch (err) {
        log('error', 'JOB 1 FAILED — markOverdue error', err.message);
    }
}

// ================================================================
//  JOB 2 — Auto-deduction for all eligible loans
//  Runs at 00:10 every day
//  Processes loans where today matches the loan's start day of month
//  and auto_deduct = 1 and loan is ACTIVE
// ================================================================
async function jobAutoDeductAll() {
    log('info', 'JOB 2 START — Auto-deduction for all loans');
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

        if (loansResult.recordset.length === 0) {
            log('info', 'JOB 2 DONE — No loans due for auto-deduction today');
            return;
        }

        log('info', `JOB 2 — Processing ${loansResult.recordset.length} loan(s)`);
        const summary = [];

        for (const loan of loansResult.recordset) {
            try {
                // Only process 1 installment per loan per run (monthly cycle)
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

                // Check if all installments paid → close loan
                const remaining = await pool.request()
                    .input('loan_id', sql.Int, loan.loan_id)
                    .query(`SELECT COUNT(*) AS cnt FROM Loan_Repayments WHERE loan_id = @loan_id AND status != 'PAID'`);

                if (remaining.recordset[0].cnt === 0) {
                    await pool.request()
                        .input('loan_id', sql.Int, loan.loan_id)
                        .query(`UPDATE Loans SET status = 'CLOSED' WHERE loan_id = @loan_id`);

                    await notifyCustomer({
                        customer_id: loan.customer_id,
                        type: 'LOAN_CLOSED',
                        message: `Congratulations! Your ${loan.loan_type} loan has been fully repaid and is now closed.`,
                        related_id: Number(loan.loan_id),
                        related_type: 'LOAN',
                    });

                    log('info', `Loan #${loan.loan_id} fully paid — status set to CLOSED`);
                }

                summary.push({ loan_id: loan.loan_id, results });
                log('info', `Loan #${loan.loan_id} processed`, results);

            } catch (loanErr) {
                log('error', `Loan #${loan.loan_id} failed`, loanErr.message);
                summary.push({ loan_id: loan.loan_id, error: loanErr.message });
            }
        }

        log('info', `JOB 2 DONE — Processed ${summary.length} loan(s)`);

    } catch (err) {
        log('error', 'JOB 2 FAILED — autoDeductAll error', err.message);
    }
}

// ================================================================
//  REGISTER CRON JOBS
// ================================================================

// Job 1: Mark overdue — 00:05 daily
cron.schedule('5 0 * * *', jobMarkOverdue, {
    timezone: TIMEZONE,
});

// Job 2: Auto-deduction — 00:10 daily (runs after overdue marking)
cron.schedule('10 0 * * *', jobAutoDeductAll, {
    timezone: TIMEZONE,
});

log('info', `Cron jobs registered (timezone: ${TIMEZONE})`);
log('info', '  Job 1 — Mark overdue       → 00:05 daily');
log('info', '  Job 2 — Auto-deduction all → 00:10 daily');

module.exports = { jobMarkOverdue, jobAutoDeductAll };