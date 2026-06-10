const { getPool, sql } = require('../config/db');

const OtpModel = {

    async create({ entity_id, entity_type, otp_code, purpose = 'LOGIN', expires_at }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('entity_id', sql.Int, entity_id)
            .input('entity_type', sql.NVarChar, entity_type)
            .input('otp_code', sql.NVarChar, otp_code)
            .input('purpose', sql.NVarChar, purpose)
            .input('expires_at', sql.DateTime, expires_at)
            .query(`
        INSERT INTO OTP_Tokens (entity_id, entity_type, otp_code, purpose, expires_at)
        OUTPUT INSERTED.otp_id
        VALUES (@entity_id, @entity_type, @otp_code, @purpose, @expires_at)
      `);
        return result.recordset[0].otp_id;
    },

    // Verify: find a valid, unused, non-expired OTP for given entity + purpose
    async verify({ entity_id, entity_type, otp_code, purpose }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('entity_id', sql.Int, entity_id)
            .input('entity_type', sql.NVarChar, entity_type)
            .input('otp_code', sql.NVarChar, otp_code)
            .input('purpose', sql.NVarChar, purpose)
            .query(`
        SELECT TOP 1 * FROM OTP_Tokens
        WHERE entity_id   = @entity_id
          AND entity_type = @entity_type
          AND otp_code    = @otp_code
          AND purpose     = @purpose
          AND is_used     = 0
          AND expires_at  > GETDATE()
        ORDER BY created_at DESC
      `);
        return result.recordset[0] || null;
    },

    async markUsed(otp_id) {
        const pool = await getPool();
        await pool.request()
            .input('otp_id', sql.Int, otp_id)
            .query('UPDATE OTP_Tokens SET is_used = 1 WHERE otp_id = @otp_id');
    },

    // Invalidate all previous unused OTPs for this entity+purpose before issuing a new one
    async invalidatePrevious({ entity_id, entity_type, purpose }) {
        const pool = await getPool();
        await pool.request()
            .input('entity_id', sql.Int, entity_id)
            .input('entity_type', sql.NVarChar, entity_type)
            .input('purpose', sql.NVarChar, purpose)
            .query(`
        UPDATE OTP_Tokens SET is_used = 1
        WHERE entity_id = @entity_id AND entity_type = @entity_type
          AND purpose = @purpose AND is_used = 0
      `);
    },

};

module.exports = OtpModel;