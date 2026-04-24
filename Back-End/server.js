const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolPromise } = require('./config/db');

const app = express();

/* -------------------- CORS FIX - IMPORTANT! -------------------- */
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Your frontend Vite port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
//app.options('*', cors());

/* -------------------- JSON PARSING -------------------- */
// Simpler approach - apply express.json() to all requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* -------------------- TEST ROUTE -------------------- */
app.get('/', (req, res) => {
  res.send('🚀 Banking AI Backend Running');
});

/* -------------------- REQUEST LOGGER (optional, helpful for debugging) -------------------- */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* -------------------- ROUTES -------------------- */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/loan-approval', require('./routes/loanApprovalRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

/* -------------------- ERROR HANDLING -------------------- */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* -------------------- 404 HANDLER -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 5000;

poolPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Accepting requests from: http://localhost:5173`);
    });
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