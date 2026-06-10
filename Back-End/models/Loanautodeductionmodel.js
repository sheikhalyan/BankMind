const { getPool, sql } = require('../config/db');

const LoanAutoDeductionModel = {

    async log({ loan_id, repayment_id, from_account_id, amount, status, failure_reason, transaction_id }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('repayment_id', sql.Int, repayment_id)
            .input('from_account_id', sql.Int, from_account_id)
            .input('amount', sql.Decimal(15, 2), amount)
            .input('status', sql.NVarChar, status)
            .input('failure_reason', sql.NVarChar, failure_reason || null)
            .input('transaction_id', sql.Int, transaction_id || null)
            .query(`
        INSERT INTO Loan_Auto_Deductions
          (loan_id, repayment_id, from_account_id, amount, status, failure_reason, transaction_id)
        OUTPUT INSERTED.deduction_id
        VALUES
          (@loan_id, @repayment_id, @from_account_id, @amount, @status, @failure_reason, @transaction_id)
      `);
        return result.recordset[0].deduction_id;
    },

    async getByLoan(loan_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .query(`
        SELECT d.*, lr.installment_no, lr.due_date
        FROM Loan_Auto_Deductions d
        JOIN Loan_Repayments lr ON lr.repayment_id = d.repayment_id
        WHERE d.loan_id = @loan_id
        ORDER BY d.attempted_at DESC
      `);
        return result.recordset;
    },

    async getFailedToday() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
        SELECT d.*, l.customer_id, c.full_name AS customer_name, c.email
        FROM Loan_Auto_Deductions d
        JOIN Loans     l ON l.loan_id      = d.loan_id
        JOIN Customers c ON c.customer_id  = l.customer_id
        WHERE d.status = 'FAILED'
          AND CAST(d.attempted_at AS DATE) = CAST(GETDATE() AS DATE)
      `);
        return result.recordset;
    },

    // All auto-deduct loans with a due installment today (for cron job)
    async getDueTodayLoans() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
        SELECT l.loan_id, l.account_id, lr.repayment_id, lr.amount
        FROM Loans l
        JOIN Loan_Repayments lr ON lr.loan_id = l.loan_id
        WHERE l.auto_deduct = 1
          AND l.status = 'ACTIVE'
          AND lr.status IN ('PENDING', 'OVERDUE')
          AND lr.due_date <= CAST(GETDATE() AS DATE)
      `);
        return result.recordset;
    },

};

module.exports = LoanAutoDeductionModel;