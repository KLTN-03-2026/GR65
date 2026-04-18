const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    const pool = await poolPromise;
    console.log('Using existing tables: Users, Candidates, Employers.');

    // Seed Admin user
    const adminEmail = 'admin@demo.vn'; // Example admin email
    const result = await pool.request()
      .input('Email', sql.NVarChar, adminEmail)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @Email');

    if (result.recordset.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt); // Default password

      await pool.request()
        .input('Email', sql.NVarChar, adminEmail)
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .input('Role', sql.NVarChar, 'Admin')
        .query(`
          INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt)
          VALUES (NEWID(), @Email, @PasswordHash, @Role, GETDATE(), GETDATE())
        `);
      console.log('Seed Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = { initializeDatabase };
