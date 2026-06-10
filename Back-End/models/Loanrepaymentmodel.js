const { getPool, sql } = require('../config/db');

const LoanRepaymentModel = {

    // Bulk-insert the full EMI schedule when a loan is approved
    async generateSchedule(loan_id, installments) {
        // installments = [{ installment_no, amount, due_date }, ...]
        const pool = await getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        try {
            for (const inst of installments) {
                await transaction.request()
                    .input('loan_id', sql.Int, loan_id)
                    .input('installment_no', sql.Int, inst.installment_no)
                    .input('amount', sql.Decimal(15, 2), inst.amount)
                    .input('due_date', sql.Date, inst.due_date)
                    .query(`
            INSERT INTO Loan_Repayments (loan_id, installment_no, amount, due_date)
            VALUES (@loan_id, @installment_no, @amount, @due_date)
          `);
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async getByLoan(loan_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .query(`
        SELECT lr.*, t.transaction_id AS payment_transaction_id
        FROM Loan_Repayments lr
        LEFT JOIN Transactions t ON t.transaction_id = lr.transaction_id
        WHERE lr.loan_id = @loan_id
        ORDER BY lr.installment_no ASC
      `);
        return result.recordset;
    },

    async getNextDue(loan_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .query(`
        SELECT TOP 1 * FROM Loan_Repayments
        WHERE loan_id = @loan_id AND status IN ('PENDING', 'OVERDUE')
        ORDER BY due_date ASC
      `);
        return result.recordset[0] || null;
    },

    async markPaid({ repayment_id, transaction_id }) {
        const pool = await getPool();
        await pool.request()
            .input('repayment_id', sql.Int, repayment_id)
            .input('transaction_id', sql.Int, transaction_id)
            .query(`
        UPDATE Loan_Repayments
        SET status         = 'PAID',
            paid_date      = GETDATE(),
            transaction_id = @transaction_id
        WHERE repayment_id = @repayment_id
      `);
    },

    // Cron job marks overdue installments daily
    async markOverdue() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
        UPDATE Loan_Repayments
        SET status = 'OVERDUE'
        WHERE status = 'PENDING' AND due_date < CAST(GETDATE() AS DATE)
      `);
        return result.rowsAffected[0];
    },

    async findById(repayment_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('repayment_id', sql.Int, repayment_id)
            .query('SELECT * FROM Loan_Repayments WHERE repayment_id = @repayment_id');
        return result.recordset[0] || null;
    },

};

module.exports = LoanRepaymentModel;