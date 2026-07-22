/**
 * cronJob.js
 *
 * Jobs:
 *   1. 00:05 daily  → Mark overdue installments
 *   2. 00:10 daily  → Run auto-deduction for all eligible loans
 *
 * Timezone: Asia/Karachi
 *
 * HOW IT WORKS:
 *   - This file is loaded once by server.js via require('./cronJob')
 *   - node-cron registers two alarms inside the running Node process
 *   - Every day at the scheduled times, the job functions fire automatically
 *   - Server must be running for jobs to fire — no job fires if server is off
 */

const cron = require('node-cron');
const { getPool, sql } = require('./config/db');
const { processDeductions } = require('./controllers/Loanrepaymentcontroller');
const {
    notifyCustomer,
} = require('./utils/notifications');

// ── TIMEZONE ──────────────────────────────────────────────────────
const TIMEZONE = 'Asia/Karachi';

// ── LOGGER ────────────────────────────────────────────────────────
const log = (level, msg, data) => {
    const ts = new Date().toISOString();
    const prefix = `[CRON][${ts}][${level.toUpperCase()}]`;
    if (data) console[level === 'error' ? 'error' : 'log'](prefix, msg, data);
    else console[level === 'error' ? 'error' : 'log'](prefix, msg);
};

// ================================================================
//  JOB 1 — Mark overdue installments
//  Runs at 00:05 daily
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
        log('error', 'JOB 1 FAILED', err.message);
    }
}

// ================================================================
//  JOB 2 — Auto-deduction for all eligible loans
//  Runs at 00:10 daily (after Job 1 marks overdue)
//  Only processes loans where today matches the loan's start day
//  e.g. loan started on 15th → only deducts on 15th of each month
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
                // Process only the earliest unpaid installment per loan per run
                const dueResult = await pool.request()
                    .input('loan_id', sql.Int, loan.loan_id)
                    .query(`
                        SELECT TOP 1 * FROM Loan_Repayments
                        WHERE  loan_id  = @loan_id
                          AND  status   IN ('PENDING', 'OVERDUE')
                          AND  due_date <= CAST(GETDATE() AS DATE)
                        ORDER BY installment_no ASC
                    `);

                if (dueResult.recordset.length === 0) {
                    log('info', `Loan #${loan.loan_id} — no due installment found, skipping`);
                    continue;
                }

                // processDeductions is imported from loanRepaymentController
                const results = await processDeductions(pool, loan, dueResult.recordset);

                // Check if all installments paid → close loan
                const remaining = await pool.request()
                    .input('loan_id', sql.Int, loan.loan_id)
                    .query(`
                        SELECT COUNT(*) AS cnt
                        FROM   Loan_Repayments
                        WHERE  loan_id = @loan_id AND status != 'PAID'
                    `);

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
        log('error', 'JOB 2 FAILED', err.message);
    }
}

// ================================================================
//  REGISTER CRON JOBS
// ================================================================

// Job 1: Mark overdue — 00:05 daily
cron.schedule('5 0 * * *', jobMarkOverdue, { timezone: TIMEZONE });

// Job 2: Auto-deduction — 00:10 daily
cron.schedule('10 0 * * *', jobAutoDeductAll, { timezone: TIMEZONE });

log('info', `Cron jobs registered (timezone: ${TIMEZONE})`);
log('info', '  Job 1 — Mark overdue       → 00:05 daily');
log('info', '  Job 2 — Auto-deduction all → 00:10 daily');

module.exports = { jobMarkOverdue, jobAutoDeductAll };