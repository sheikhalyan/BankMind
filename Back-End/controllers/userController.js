const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper function to create notifications
async function createNotification(pool, userId, type, message) {
  console.log('🔵🔵🔵 createNotification CALLED! 🔵🔵🔵');
  console.log('   - userId:', userId);
  console.log('   - type:', type);
  console.log('   - message:', message);
  
  try {
    const tableCheck = await pool.request()
      .query(`
        SELECT * FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'Notifications'
      `);
    
    console.log('   - Notifications table exists?', tableCheck.recordset.length > 0);
    
    if (tableCheck.recordset.length === 0) {
      console.error('❌ Notifications table does NOT exist!');
      return false;
    }
    
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('type', sql.VarChar, type)
      .input('message', sql.VarChar, message)
      .query(`
        INSERT INTO Notifications (user_id, type, message, created_at, is_read)
        VALUES (@user_id, @type, @message, GETDATE(), 0)
      `);
    
    console.log('✅ Notification created successfully for user', userId);
    return true;
  } catch (err) {
    console.error('❌❌❌ ERROR creating notification:', err);
    return false;
  }
}

/**
 * GET /api/user/profile
 */
exports.getMyProfile = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Log everything from the token
    console.log('🔍 FULL TOKEN DATA:', req.user);
    console.log('🔍 userId from token:', req.user.userId);
    console.log('🔍 customerId from token:', req.user.customerId);
    console.log('🔍 role from token:', req.user.role);
    
    // Handle both userId and customerId from token
    const userId = req.user.userId || req.user.customerId;
    const userRole = req.user.role;

    console.log('🔍 Extracted userId:', userId);
    console.log('🔍 Extracted userRole:', userRole);

    let result;

    if (userRole?.toLowerCase() === 'customer') {
      console.log('🔍 Fetching from Customers table with customer_id:', userId);
      
      // Fetch from Customers table using customerId
      result = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT 
            customer_id as user_id, 
            customer_name as full_name, 
            email, 
            'customer' as role,
            phone,
            address,
            created_at
          FROM Customers
          WHERE customer_id = @customer_id
        `);
      
      console.log('🔍 Customer query result:', result.recordset);
    } else {
      console.log('🔍 Fetching from Users table with user_id:', userId);
      
      // Fetch from Users table (for admin and user roles)
      result = await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`
          SELECT user_id, full_name, email, role, phone, address, created_at
          FROM Users
          WHERE user_id = @user_id
        `);
      
      console.log('🔍 User query result:', result.recordset);
    }

    if (!result.recordset || result.recordset.length === 0) {
      console.log('❌ No profile found for user:', userId, 'role:', userRole);
      return res.status(404).json({ message: 'Profile not found' });
    }

    console.log('✅ Profile found:', result.recordset[0]);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('❌ Error in getMyProfile:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/user/profile
 */
exports.updateProfile = async (req, res) => {
  console.log('🔵🔵🔵 updateProfile CALLED! 🔵🔵🔵');
  console.log('   - Request body:', req.body);
  console.log('   - User from token:', req.user);
  
  const { full_name, phone, address } = req.body;
  
  // Handle both userId and customerId from token
  const userId = req.user.userId || req.user.customerId;
  const userRole = req.user.role;

  try {
    const pool = await poolPromise;
    console.log('✅ Database connected');

    if (userRole?.toLowerCase() === 'customer') {
      // Update Customers table using customer_id
      await pool.request()
        .input('customer_id', sql.Int, userId)
        .input('customer_name', sql.VarChar, full_name)
        .input('phone', sql.VarChar, phone || null)
        .input('address', sql.VarChar, address || null)
        .query(`
          UPDATE Customers
          SET customer_name = @customer_name,
              phone = @phone,
              address = @address
          WHERE customer_id = @customer_id
        `);
    } else {
      // Update Users table (for admin and user roles)
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('full_name', sql.VarChar, full_name)
        .input('phone', sql.VarChar, phone || null)
        .input('address', sql.VarChar, address || null)
        .query(`
          UPDATE Users
          SET full_name = @full_name,
              phone = @phone,
              address = @address
          WHERE user_id = @user_id
        `);
    }

    console.log('✅ Profile updated in database');

    // Create notification based on role
    if (userRole?.toLowerCase() === 'user') {
      console.log('📢 User role detected, finding admins...');
      
      const admins = await pool.request()
        .query(`SELECT user_id, full_name FROM Users WHERE LOWER(role) = 'admin'`);
      
      for (const admin of admins.recordset) {
        await createNotification(pool, admin.user_id, 'PROFILE_UPDATE', `User ${full_name} updated their profile`);
      }
    } 
    else if (userRole?.toLowerCase() === 'customer') {
      console.log('📢 Customer role detected, finding associated user...');
      
      const customerResult = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT approved_by_user FROM Customers WHERE customer_id = @customer_id
        `);
      
      if (customerResult.recordset.length > 0 && customerResult.recordset[0].approved_by_user) {
        await createNotification(pool, customerResult.recordset[0].approved_by_user, 'CUSTOMER_UPDATE', `Customer ${full_name} updated their profile`);
      } else {
        console.log('⚠️ No associated user found for this customer');
      }
    } 
    else {
      console.log(`📢 Role ${userRole} doesn't require notification`);
    }

    res.json({ 
      message: 'Profile updated successfully',
      profile: { full_name, phone, address }
    });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/user/change-password
 */
exports.changePassword = async (req, res) => {
  console.log('🔵🔵🔵 changePassword CALLED! 🔵🔵🔵');
  
  const { oldPassword, newPassword } = req.body;
  
  // Handle both userId and customerId from token
  const userId = req.user.userId || req.user.customerId;
  const userRole = req.user.role;

  try {
    const pool = await poolPromise;
    let user;
    let storedPassword;

    if (userRole?.toLowerCase() === 'customer') {
      // Get customer from Customers table
      const result = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT password, customer_name as full_name
          FROM Customers
          WHERE customer_id = @customer_id
        `);
      user = result.recordset[0];
      storedPassword = user?.password;
    } else {
      // Get user from Users table
      const result = await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`
          SELECT password_hash, full_name
          FROM Users
          WHERE user_id = @user_id
        `);
      user = result.recordset[0];
      storedPassword = user?.password_hash;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    if (userRole?.toLowerCase() === 'customer') {
      // Update Customers table
      await pool.request()
        .input('customer_id', sql.Int, userId)
        .input('password', sql.VarChar, hashed)
        .query(`
          UPDATE Customers
          SET password = @password
          WHERE customer_id = @customer_id
        `);
    } else {
      // Update Users table
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('password_hash', sql.VarChar, hashed)
        .query(`
          UPDATE Users
          SET password_hash = @password_hash
          WHERE user_id = @user_id
        `);
    }

    console.log('✅ Password changed in database');

    // Create notification based on role
    if (userRole?.toLowerCase() === 'user') {
      const admins = await pool.request()
        .query(`SELECT user_id FROM Users WHERE LOWER(role) = 'admin'`);
      
      for (const admin of admins.recordset) {
        await createNotification(pool, admin.user_id, 'PASSWORD_CHANGE', `User ${user.full_name} changed their password`);
      }
    } else if (userRole?.toLowerCase() === 'customer') {
      const customerResult = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT approved_by_user FROM Customers WHERE customer_id = @customer_id
        `);
      
      if (customerResult.recordset.length > 0 && customerResult.recordset[0].approved_by_user) {
        await createNotification(pool, customerResult.recordset[0].approved_by_user, 'CUSTOMER_PASSWORD_CHANGE', `Customer ${user.full_name} changed their password`);
      }
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: err.message });
  }
};