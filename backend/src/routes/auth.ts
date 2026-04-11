import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Khởi tạo Google Client với ID lấy từ .env
// Nếu chưa có, vẫn khởi tạo để không báo lỗi cú pháp
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');

// API 1: Đăng nhập thường (Email/Password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const request = new sql.Request();
    request.input('email', sql.NVarChar, email);
    const result = await request.query('SELECT * FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại.' });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu sai.' });
    }

    const token = jwt.sign(
        { id: user.Id, role: user.Role }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.Id, email: user.Email, role: user.Role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// API 1.5: Đăng ký thành viên mới
router.post('/register', async (req, res) => {
  const { email, password, role, name, company, phone } = req.body;
  try {
     const checkReq = new sql.Request();
     checkReq.input('email', sql.NVarChar, email);
     const check = await checkReq.query('SELECT * FROM Users WHERE Email = @email');
     if(check.recordset.length > 0) return res.status(400).json({message: "Email này đã được đăng ký trong hệ thống!"});

     const hash = await bcrypt.hash(password, 10);
     const insertReq = new sql.Request();
     insertReq.input('email', sql.NVarChar, email);
     insertReq.input('password', sql.NVarChar, hash);
     insertReq.input('role', sql.NVarChar, role);
     
     const insertResult = await insertReq.query(`
        INSERT INTO Users (Email, PasswordHash, Role) 
        OUTPUT INSERTED.Id 
        VALUES (@email, @password, @role)
     `);
     const newId = insertResult.recordset[0].Id;

     if (role === 'Candidate') {
         const candReq = new sql.Request();
         candReq.input('id', sql.UniqueIdentifier, newId);
         candReq.input('name', sql.NVarChar, name || '');
         candReq.input('phone', sql.NVarChar, phone || '');
         await candReq.query('INSERT INTO Candidates (UserId, FullName, Phone) VALUES (@id, @name, @phone)');
     } else if (role === 'Employer') {
         const empReq = new sql.Request();
         empReq.input('id', sql.UniqueIdentifier, newId);
         empReq.input('company', sql.NVarChar, company || '');
         empReq.input('phone', sql.NVarChar, phone || '');
         await empReq.query('INSERT INTO Employers (UserId, CompanyName, Description) VALUES (@id, @company, @phone)');
     }

     res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch(e) {
     res.status(500).json({message: 'Lỗi Database phía máy chủ'});
  }
});

// API 2: Đăng nhập bằng Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Lỗi xác thực Google.' });

    const email = payload.email;
    const request = new sql.Request();
    request.input('email', sql.NVarChar, email);
    let result = await request.query('SELECT * FROM Users WHERE Email = @email');
    
    let user;
    // Nếu email Google này chưa từng đăng nhập hệ thống -> Tạo tài khoản mới 
    if (result.recordset.length === 0) {
       const insertReq = new sql.Request();
       insertReq.input('email', sql.NVarChar, email);
       insertReq.input('passwordHash', sql.NVarChar, 'GOOGLE_SSO'); // Mật khẩu đánh dấu là Google sso
       insertReq.input('role', sql.NVarChar, 'Candidate');
       
       await insertReq.query('INSERT INTO Users (Email, PasswordHash, Role) VALUES (@email, @passwordHash, @role)');
       
       result = await request.query('SELECT * FROM Users WHERE Email = @email');
       user = result.recordset[0];

       // Khởi tạo bảng Candidate kết nối theo kịch bản CSDL của SQL
       const candReq = new sql.Request();
       candReq.input('userId', sql.UniqueIdentifier, user.Id);
       candReq.input('fullName', sql.NVarChar, payload.name || '');
       candReq.input('avatarUrl', sql.NVarChar, payload.picture || '');
       await candReq.query('INSERT INTO Candidates (UserId, FullName, AvatarUrl) VALUES (@userId, @fullName, @avatarUrl)');
    } else {
       user = result.recordset[0];
    }

    // Sinh Token đăng nhập
    const token = jwt.sign(
        { id: user.Id, role: user.Role }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.Id, email: user.Email, role: user.Role, name: payload.name, avatar: payload.picture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi xác thực Google SSO' });
  }
});

export default router;
