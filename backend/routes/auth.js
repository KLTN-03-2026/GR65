const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db');
const { logActivity } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email của người dùng
 *         password:
 *           type: string
 *           format: password
 *           description: Mật khẩu (tối thiểu 6 ký tự)
 *         role:
 *           type: string
 *           enum: [Candidate, Employer]
 *           description: Vai trò người dùng (không thể đăng ký Admin qua API này)
 *         fullName:
 *           type: string
 *           description: Họ và tên (cho Candidate)
 *         companyName:
 *           type: string
 *           description: Tên công ty (cho Employer)
 *         phone:
 *           type: string
 *           description: Số điện thoại
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *             profile:
 *               type: object
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới (Candidate hoặc Employer)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc Email đã tồn tại
 *       403:
 *         description: Không có quyền đăng ký Admin
 *       500:
 *         description: Lỗi hệ thống
 */
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

    // Log registration
    await logActivity(userId, 'REGISTER', 'User', userId, `User registered as ${capRole}`);

  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng (Candidate, Employer, Admin)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thông tin đăng nhập không chính xác
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const pool = await poolPromise;

    // 1. Đảm bảo cấu trúc DB cho bảo mật và lấy cấu hình hệ thống
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LoginAttempts') 
      ALTER TABLE Users ADD LoginAttempts INT DEFAULT 0;
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LockoutUntil') 
      ALTER TABLE Users ADD LockoutUntil DATETIME;
    `);

    const settingsResult = await pool.request().query("SELECT SettingKey, SettingValue FROM SystemSettings WHERE Category IN ('Security', 'Session')");
    const settings = {};
    settingsResult.recordset.forEach(s => settings[s.SettingKey] = s.SettingValue);

    const maxAttempts = parseInt(settings['security_max_login_attempts'] || '5');
    const sessionMinutes = parseInt(settings['session_timeout_minutes'] || '1440'); // Mặc định 1 ngày nếu không có

    // 2. Tìm người dùng và kiểm tra trạng thái khóa
    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @Email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }

    // Kiểm tra xem tài khoản có đang bị khóa không
    if (user.LockoutUntil && new Date(user.LockoutUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.LockoutUntil) - new Date()) / 60000);
      return res.status(403).json({ 
        message: `Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.` 
      });
    }

    // 3. Xác thực mật khẩu
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      // Tăng số lần đăng nhập sai
      const newAttempts = (user.LoginAttempts || 0) + 1;
      let lockoutQuery = "";
      
      if (newAttempts >= maxAttempts) {
        // Khóa tài khoản trong 30 phút
        const lockoutTime = new Date(new Date().getTime() + 30 * 60000);
        await pool.request()
          .input('id', sql.UniqueIdentifier, user.Id)
          .input('until', sql.DateTime, lockoutTime)
          .query("UPDATE Users SET LoginAttempts = 0, LockoutUntil = @until WHERE Id = @id");
        
        return res.status(403).json({ message: 'Bạn đã nhập sai quá nhiều lần. Tài khoản đã bị tạm khóa 30 phút.' });
      } else {
        await pool.request()
          .input('id', sql.UniqueIdentifier, user.Id)
          .input('attempts', sql.Int, newAttempts)
          .query("UPDATE Users SET LoginAttempts = @attempts WHERE Id = @id");
        
        return res.status(400).json({ message: `Thông tin đăng nhập không chính xác. Bạn còn ${maxAttempts - newAttempts} lần thử.` });
      }
    }

    // Đăng nhập thành công -> Reset số lần thử
    await pool.request()
      .input('id', sql.UniqueIdentifier, user.Id)
      .query("UPDATE Users SET LoginAttempts = 0, LockoutUntil = NULL WHERE Id = @id");

    // Load profile info dựa trên role (giữ nguyên logic cũ)
    let profile = null;
    if (user.Role === 'Candidate') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT FullName, Phone, AvatarUrl, Title, SkillsJson FROM Candidates WHERE UserId = @UserId');
      profile = pResult.recordset[0];
    } else if (user.Role === 'Employer') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT CompanyName, LogoUrl, Industry, Location FROM Employers WHERE UserId = @UserId');
      profile = pResult.recordset[0];
    } else if (user.Role === 'Admin') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT FullName, Department FROM AdminProfiles WHERE UserId = @UserId');
      profile = pResult.recordset[0] || { FullName: 'System Admin' };
    }

    const payload = { user: { id: user.Id, role: user.Role } };

    // 4. Sử dụng thời gian phiên từ SystemSettings
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: `${sessionMinutes}m` }, // Áp dụng session timeout động
      async (err, token) => {
        if (err) throw err;
        await logActivity(user.Id, 'LOGIN', 'User', user.Id, `User logged in with role ${user.Role}`);
        res.json({
          message: 'Đăng nhập thành công',
          token,
          user: { id: user.Id, email: user.Email, role: user.Role, profile: profile }
        });
      }
    );

  } catch (err) {
    console.error('Lỗi khi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ── GOOGLE SIGN-IN ─────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Thiếu Google credential.' });
    }

    // Verify Google ID Token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return res.status(401).json({ message: 'Google token không hợp lệ.' });
    }

    const { sub: googleId, email, name, picture } = payload;
    const capRole = (role || 'candidate').charAt(0).toUpperCase() + (role || 'candidate').slice(1).toLowerCase();

    if (!['Candidate', 'Employer'].includes(capRole)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    const pool = await poolPromise;

    // Check if user exists (by GoogleId or Email)
    const existingUser = await pool.request()
      .input('GoogleId', sql.NVarChar, googleId)
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE GoogleId = @GoogleId OR Email = @Email');

    let user = existingUser.recordset[0];

    if (!user) {
      // Create new user
      const insertRes = await pool.request()
        .input('Email', sql.NVarChar, email)
        .input('Role', sql.NVarChar, capRole)
        .input('GoogleId', sql.NVarChar, googleId)
        .input('AuthProvider', sql.NVarChar, 'google')
        .query(`
          INSERT INTO Users (Id, Email, PasswordHash, Role, GoogleId, AuthProvider, CreatedAt, UpdatedAt)
          OUTPUT inserted.*
          VALUES (NEWID(), @Email, 'GOOGLE_SSO', @Role, @GoogleId, 'google', GETDATE(), GETDATE())
        `);
      user = insertRes.recordset[0];

      // Create profile based on role
      if (capRole === 'Candidate') {
        await pool.request()
          .input('UserId', sql.UniqueIdentifier, user.Id)
          .input('FullName', sql.NVarChar, name || '')
          .input('AvatarUrl', sql.NVarChar, picture || null)
          .query(`INSERT INTO Candidates (UserId, FullName, AvatarUrl, CreatedAt, UpdatedAt) VALUES (@UserId, @FullName, @AvatarUrl, GETDATE(), GETDATE())`);
      } else if (capRole === 'Employer') {
        await pool.request()
          .input('UserId', sql.UniqueIdentifier, user.Id)
          .input('CompanyName', sql.NVarChar, name || 'Công ty')
          .query(`INSERT INTO Employers (UserId, CompanyName, CreatedAt, UpdatedAt) VALUES (@UserId, @CompanyName, GETDATE(), GETDATE())`);
      }

      await logActivity(user.Id, 'REGISTER_GOOGLE', 'User', user.Id, `Google SSO registration as ${capRole}`);
    } else {
      // Update GoogleId if user exists but was local
      if (!user.GoogleId) {
        await pool.request()
          .input('Id', sql.UniqueIdentifier, user.Id)
          .input('GoogleId', sql.NVarChar, googleId)
          .query("UPDATE Users SET GoogleId = @GoogleId, AuthProvider = 'google' WHERE Id = @Id");
      }
    }

    // Load profile
    let profile = null;
    if (user.Role === 'Candidate') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT FullName, Phone, AvatarUrl, Title, SkillsJson FROM Candidates WHERE UserId = @UserId');
      profile = pResult.recordset[0];
    } else if (user.Role === 'Employer') {
      const pResult = await pool.request().input('UserId', sql.UniqueIdentifier, user.Id).query('SELECT CompanyName, LogoUrl, Industry, Location FROM Employers WHERE UserId = @UserId');
      profile = pResult.recordset[0];
    } else if (user.Role === 'Admin') {
      profile = { FullName: 'System Admin' };
    }

    // Generate JWT
    const jwtPayload = { user: { id: user.Id, role: user.Role } };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '1440m' });

    await logActivity(user.Id, 'LOGIN_GOOGLE', 'User', user.Id, `Google SSO login`);

    res.json({
      message: 'Đăng nhập Google thành công',
      token,
      user: { id: user.Id, email: user.Email, role: user.Role, profile }
    });

  } catch (err) {
    console.error('Lỗi Google Sign-In:', err);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập Google.' });
  }
});

module.exports = router;
