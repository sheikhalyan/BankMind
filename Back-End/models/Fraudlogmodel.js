const { getPool, sql } = require('../config/db');

const FraudLogModel = {

    async create({ transaction_id, fraud_score, fraud_type, action_taken = 'FLAGGED' }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('transaction_id', sql.Int, transaction_id)
            .input('fraud_score', sql.Decimal(5, 2), fraud_score)
            .input('fraud_type', sql.NVarChar, fraud_type || null)
            .input('action_taken', sql.NVarChar, action_taken)
            .query(`
        INSERT INTO Fraud_Logs (transaction_id, fraud_score, fraud_type, action_taken)
        OUTPUT INSERTED.fraud_id
        VALUES (@transaction_id, @fraud_score, @fraud_type, @action_taken)
      `);
        return result.recordset[0].fraud_id;
    },

    async findByTransaction(transaction_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('transaction_id', sql.Int, transaction_id)
            .query(`
        SELECT fl.*, u.full_name AS reviewer_name
        FROM Fraud_Logs fl
        LEFT JOIN Users u ON u.user_id = fl.reviewed_by
        WHERE fl.transaction_id = @transaction_id
      `);
        return result.recordset[0] || null;
    },

    // Staff resolves a fraud flag: CLEARED or BLOCKED
    async resolve({ fraud_id, reviewed_by, action_taken }) {
        const pool = await getPool();
        await pool.request()
            .input('fraud_id', sql.Int, fraud_id)
            .input('reviewed_by', sql.Int, reviewed_by)
            .input('action_taken', sql.NVarChar, action_taken)
            .query(`
        UPDATE Fraud_Logs
        SET reviewed_by = @reviewed_by,
            action_taken = @action_taken,
            resolved_at  = GETDATE()
        WHERE fraud_id = @fraud_id
      `);
    },

    async getUnresolved({ limit = 50, offset = 0 } = {}) {
        const pool = await getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
        SELECT fl.*, t.amount, t.transaction_type,
               fa.account_number AS from_account,
               ta.account_number AS to_account
        FROM Fraud_Logs fl
        JOIN Transactions t ON t.transaction_id = fl.transaction_id
        LEFT JOIN Accounts fa ON fa.account_id = t.from_account_id
        LEFT JOIN Accounts ta ON ta.account_id = t.to_account_id
        WHERE fl.resolved_at IS NULL
        ORDER BY fl.fraud_score DESC, fl.detected_at ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
        return result.recordset;
    },

    async getAll({ limit = 50, offset = 0 } = {}) {
        const pool = await getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
        SELECT fl.*, t.amount, t.transaction_type, u.full_name AS reviewer_name
        FROM Fraud_Logs fl
        JOIN Transactions t ON t.transaction_id = fl.transaction_id
        LEFT JOIN Users u ON u.user_id = fl.reviewed_by
        ORDER BY fl.detected_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
        return result.recordset;
    },

};

module.exports = FraudLogModel;