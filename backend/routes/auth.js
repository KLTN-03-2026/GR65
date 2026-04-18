const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// @route   POST /api/auth/register
// @desc    Register a user (Candidate or Employer)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, fullName, companyName, phone } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, mật khẩu và chọn vai trò.' });
    }

    // Capitalize role to match CHECK constraint ('Admin', 'Candidate', 'Employer')
    const capRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    if (capRole === 'Admin') {
      return res.status(403).json({ message: 'Không thể đăng ký tài khoản Admin.' });
    }

    if (!['Candidate', 'Employer'].includes(capRole)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    const pool = await poolPromise;
    
    // Check if user already exists
    const checkUser = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT Id FROM Users WHERE Email = @Email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user and get identity ID
    const insertUserRes = await pool.request()
      .input('Email', sql.NVarChar, email)
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .input('Role', sql.NVarChar, capRole)
      .query(`
        INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt)
        OUTPUT inserted.Id
        VALUES (NEWID(), @Email, @PasswordHash, @Role, GETDATE(), GETDATE())
      `);

    const userId = insertUserRes.recordset[0].Id;

    // Depending on role, create profile
    if (capRole === 'Candidate') {
      await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('FullName', sql.NVarChar, fullName || null)
        .input('Phone', sql.NVarChar, phone || null)
        .query(`
          INSERT INTO Candidates (UserId, FullName, Phone, CreatedAt, UpdatedAt)
          VALUES (@UserId, @FullName, @Phone, GETDATE(), GETDATE())
        `);
    } else if (capRole === 'Employer') {
      await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('CompanyName', sql.NVarChar, companyName || null)
        .query(`
          INSERT INTO Employers (UserId, CompanyName, CreatedAt, UpdatedAt)
          VALUES (@UserId, @CompanyName, GETDATE(), GETDATE())
        `);
    }

    res.status(201).json({ message: 'Đăng ký thành công.', userId, role: capRole });

  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login User and return JWT
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const pool = await poolPromise;

    // Find user
    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @Email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }

    // Verify password map correctly
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }

    // Load profile info based on role
    let profile = null;
    let isProfileComplete = true;

    if (user.Role === 'Candidate') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT FullName, Phone, AvatarUrl, Title, SkillsJson FROM Candidates WHERE UserId = @UserId');
      profile = pResult.recordset[0];
      if (!profile?.Title || !profile?.SkillsJson) isProfileComplete = false;
    } else if (user.Role === 'Employer') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT CompanyName, LogoUrl, Industry, Location FROM Employers WHERE UserId = @UserId');
      profile = pResult.recordset[0];
      if (!profile?.Industry || !profile?.Location) isProfileComplete = false;
    } else if (user.Role === 'Admin') {
      // Just bare admin info
      profile = { FullName: 'System Admin' };
    }

    const payload = {
      user: {
        id: user.Id,
        role: user.Role
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        res.json({
          message: 'Đăng nhập thành công',
          token,
          user: {
            id: user.Id,
            email: user.Email,
            role: user.Role,
            profile: profile
          }
        });
      }
    );

  } catch (err) {
    console.error('Lỗi khi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
