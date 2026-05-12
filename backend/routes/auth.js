const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logActivity } = require('../utils/logger');
const nodemailer = require('nodemailer');

const otpStore = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// ── REGISTER ──
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, fullName, companyName, phone } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, mật khẩu và chọn vai trò.' });

    const capRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (capRole === 'Admin') return res.status(403).json({ message: 'Không thể đăng ký tài khoản Admin.' });
    if (!['Candidate', 'Employer'].includes(capRole)) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });

    const checkUser = await pool.query('SELECT Id FROM Users WHERE Email = $1', [email]);
    if (checkUser.rows.length > 0) return res.status(400).json({ message: 'Email đã được sử dụng.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertUserRes = await pool.query(
      `INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING Id`,
      [email, hashedPassword, capRole]
    );
    const userId = insertUserRes.rows[0].id;

    if (capRole === 'Candidate') {
      await pool.query('INSERT INTO Candidates (UserId, FullName, Phone, CreatedAt, UpdatedAt) VALUES ($1, $2, $3, NOW(), NOW())', [userId, fullName || null, phone || null]);
    } else if (capRole === 'Employer') {
      await pool.query('INSERT INTO Employers (UserId, CompanyName, CreatedAt, UpdatedAt) VALUES ($1, $2, NOW(), NOW())', [userId, companyName || null]);
    }

    res.status(201).json({ message: 'Đăng ký thành công.', userId, role: capRole });
    await logActivity(userId, 'REGISTER', 'User', userId, `User registered as ${capRole}`);
  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });

    // Ensure columns exist
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='loginattempts') THEN ALTER TABLE Users ADD COLUMN LoginAttempts INT DEFAULT 0; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lockoutuntil') THEN ALTER TABLE Users ADD COLUMN LockoutUntil TIMESTAMPTZ; END IF;
      END $$
    `);

    const settingsResult = await pool.query("SELECT SettingKey, SettingValue FROM SystemSettings WHERE Category IN ('Security', 'Session')");
    const settings = {};
    settingsResult.rows.forEach(s => settings[s.settingkey] = s.settingvalue);
    const maxAttempts = parseInt(settings['security_max_login_attempts'] || '5');
    const sessionMinutes = parseInt(settings['session_timeout_minutes'] || '1440');

    const result = await pool.query('SELECT * FROM Users WHERE Email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác.' });

    if (user.lockoutuntil && new Date(user.lockoutuntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutuntil) - new Date()) / 60000);
      return res.status(403).json({ message: `Tài khoản đã bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordhash);
    if (!isMatch) {
      const newAttempts = (user.loginattempts || 0) + 1;
      if (newAttempts >= maxAttempts) {
        const lockoutTime = new Date(Date.now() + 30 * 60000);
        await pool.query("UPDATE Users SET LoginAttempts = 0, LockoutUntil = $1 WHERE Id = $2", [lockoutTime, user.id]);
        return res.status(403).json({ message: 'Bạn đã nhập sai quá nhiều lần. Tài khoản đã bị tạm khóa 30 phút.' });
      } else {
        await pool.query("UPDATE Users SET LoginAttempts = $1 WHERE Id = $2", [newAttempts, user.id]);
        return res.status(400).json({ message: `Thông tin đăng nhập không chính xác. Bạn còn ${maxAttempts - newAttempts} lần thử.` });
      }
    }

    await pool.query("UPDATE Users SET LoginAttempts = 0, LockoutUntil = NULL WHERE Id = $1", [user.id]);

    let profile = null;
    if (user.role === 'Candidate') {
      const pResult = await pool.query('SELECT FullName, Phone, AvatarUrl, Title, SkillsJson FROM Candidates WHERE UserId = $1', [user.id]);
      profile = pResult.rows[0];
    } else if (user.role === 'Employer') {
      const pResult = await pool.query('SELECT CompanyName, LogoUrl, Industry, Location FROM Employers WHERE UserId = $1', [user.id]);
      profile = pResult.rows[0];
    } else if (user.role === 'Admin') {
      try {
        const pResult = await pool.query('SELECT FullName, Department FROM AdminProfiles WHERE UserId = $1', [user.id]);
        profile = pResult.rows[0] || { FullName: 'System Admin' };
      } catch (err) { profile = { FullName: 'System Admin' }; }
    }

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: `${sessionMinutes}m` }, async (err, token) => {
      if (err) throw err;
      await logActivity(user.id, 'LOGIN', 'User', user.id, `User logged in with role ${user.role}`);
      res.json({ message: 'Đăng nhập thành công', token, user: { id: user.id, email: user.email, role: user.role, profile } });
    });
  } catch (err) {
    console.error('Lỗi khi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ── FORGOT PASSWORD ──
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập email.' });

    const colCheck = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='authprovider'");
    const hasAuthProvider = colCheck.rows.length > 0;
    const selectQuery = hasAuthProvider ? 'SELECT Id, AuthProvider FROM Users WHERE Email = $1' : 'SELECT Id FROM Users WHERE Email = $1';
    const result = await pool.query(selectQuery, [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Email không tồn tại trong hệ thống.' });

    const user = result.rows[0];
    if (hasAuthProvider && user.authprovider === 'google') return res.status(400).json({ message: 'Tài khoản này đăng nhập bằng Google.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000, verified: false });

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return res.status(500).json({ message: 'Hệ thống chưa cấu hình email.' });

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD } });
    await transporter.sendMail({
      from: `"AIRecruit" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Mã OTP đặt lại mật khẩu - AIRecruit',
      html: `<div style="font-family:Arial;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px"><h2 style="color:#4f46e5;text-align:center">🔐 Đặt lại mật khẩu</h2><div style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f3f4f6;border-radius:8px;margin:16px 0">${otp}</div><p style="text-align:center;color:#ef4444;font-size:14px">⏱ Mã OTP hết hạn sau 5 phút</p></div>`
    });
    res.json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
  } catch (err) {
    console.error('Forgot password error:', err.message || err);
    if (err.code === 'EAUTH') return res.status(500).json({ message: 'Lỗi xác thực email.' });
    if (err.code === 'ESOCKET' || err.code === 'ECONNECTION') return res.status(500).json({ message: 'Không thể kết nối máy chủ email.' });
    res.status(500).json({ message: 'Lỗi hệ thống khi gửi OTP.' });
  }
});

// ── VERIFY OTP ──
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Thiếu email hoặc mã OTP.' });
    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ message: 'Không tìm thấy mã OTP.' });
    if (Date.now() > stored.expiresAt) { otpStore.delete(email); return res.status(400).json({ message: 'Mã OTP đã hết hạn.' }); }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    otpStore.set(email, { ...stored, verified: true });
    res.json({ message: 'Xác nhận OTP thành công.' });
  } catch (err) { console.error('Verify OTP error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// ── RESET PASSWORD ──
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    const stored = otpStore.get(email);
    if (!stored || !stored.verified) return res.status(403).json({ message: 'Chưa xác nhận OTP.' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE Users SET PasswordHash = $1, UpdatedAt = NOW() WHERE Email = $2', [hashedPassword, email]);
    otpStore.delete(email);
    res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (err) { console.error('Reset password error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// ── GOOGLE SIGN-IN ──
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) return res.status(400).json({ message: 'Thiếu Google credential.' });

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (err) { return res.status(401).json({ message: 'Google token không hợp lệ.' }); }

    const { sub: googleId, email, name, picture } = payload;
    const capRole = (role || 'candidate').charAt(0).toUpperCase() + (role || 'candidate').slice(1).toLowerCase();
    if (!['Candidate', 'Employer'].includes(capRole)) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });

    const existingUser = await pool.query('SELECT * FROM Users WHERE GoogleId = $1 OR Email = $2', [googleId, email]);
    let user = existingUser.rows[0];

    if (!user) {
      const insertRes = await pool.query(
        `INSERT INTO Users (Id, Email, PasswordHash, Role, GoogleId, AuthProvider, CreatedAt, UpdatedAt)
         VALUES (gen_random_uuid(), $1, 'GOOGLE_SSO', $2, $3, 'google', NOW(), NOW()) RETURNING *`,
        [email, capRole, googleId]
      );
      user = insertRes.rows[0];
      if (capRole === 'Candidate') {
        await pool.query('INSERT INTO Candidates (UserId, FullName, AvatarUrl, CreatedAt, UpdatedAt) VALUES ($1, $2, $3, NOW(), NOW())', [user.id, name || '', picture || null]);
      } else if (capRole === 'Employer') {
        await pool.query('INSERT INTO Employers (UserId, CompanyName, CreatedAt, UpdatedAt) VALUES ($1, $2, NOW(), NOW())', [user.id, name || 'Công ty']);
      }
      await logActivity(user.id, 'REGISTER_GOOGLE', 'User', user.id, `Google SSO registration as ${capRole}`);
    } else {
      if (!user.googleid) await pool.query("UPDATE Users SET GoogleId = $1, AuthProvider = 'google' WHERE Id = $2", [googleId, user.id]);
    }

    let profile = null;
    if (user.role === 'Candidate') { const p = await pool.query('SELECT FullName, Phone, AvatarUrl, Title, SkillsJson FROM Candidates WHERE UserId = $1', [user.id]); profile = p.rows[0]; }
    else if (user.role === 'Employer') { const p = await pool.query('SELECT CompanyName, LogoUrl, Industry, Location FROM Employers WHERE UserId = $1', [user.id]); profile = p.rows[0]; }
    else if (user.role === 'Admin') { profile = { FullName: 'System Admin' }; }

    const token = jwt.sign({ user: { id: user.id, role: user.role } }, JWT_SECRET, { expiresIn: '1440m' });
    await logActivity(user.id, 'LOGIN_GOOGLE', 'User', user.id, 'Google SSO login');
    res.json({ message: 'Đăng nhập Google thành công', token, user: { id: user.id, email: user.email, role: user.role, profile } });
  } catch (err) { console.error('Lỗi Google Sign-In:', err); res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập Google.' }); }
});

module.exports = router;
