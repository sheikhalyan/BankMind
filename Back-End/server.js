const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getPool } = require('./config/db');

const app = express();

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/* -------------------- PARSING -------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* -------------------- REQUEST LOGGER -------------------- */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* -------------------- HEALTH CHECK -------------------- */
app.get('/', (req, res) => {
  res.send('🚀 BankMind Backend Running');
});

/* -------------------- ROUTES -------------------- */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/loan-repayments', require('./routes/Loanrepaymentroutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/support', require('./routes/supportticketRoutes'));

// Uncomment as you build these:
// app.use('/api/fraud',            require('./routes/fraudRoutes'));
// app.use('/api/chat',             require('./routes/aiChatRoutes'));


/* -------------------- 404 HANDLER -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 5000;

getPool()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Accepting requests from: http://localhost:5173`);
    });

    require('./cronJob');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
/* -------------------- TEMP PASSWORD HASH (REMOVE LATER) -------------------- */
const bcrypt = require('bcryptjs');
bcrypt.hash("admin123", 10).then(hash => {
  console.log('Admin password hash:', hash);
});
