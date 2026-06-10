const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,  // true for Azure
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

// Single shared pool — created once, reused everywhere
let pool = null;

const getPool = async () => {
    if (!pool) {
        pool = await new sql.ConnectionPool(config).connect();
        console.log('✅ Connected to MSSQL');
    }
    return pool;
};

module.exports = { getPool, sql };