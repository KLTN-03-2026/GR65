import express from 'express';
import multer from 'multer';
import path from 'path';
import { sql } from '../config/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = express.Router();

// Logic tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file vào ổ đĩa cục bộ (Local Storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Đổi tên file để tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware bảo mật: Bắt buộc ứng viên phải gửi kèm Token đăng nhập mới cho upload
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Từ chối truy cập. Không có token.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // Gán ID user vào req
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token bảo mật không hợp lệ hoặc đã hết hạn.' });
  }
};

// API: Tiến hành tải lên CV
router.post('/upload', authMiddleware, upload.single('cv'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng đính kèm một tệp tin CV' });
  }
  
  // Link ảo dẫn tới file lấy theo domain
  const fileUrl = `/uploads/${req.file.filename}`;
  const userId = req.user.id; 

  try {
    const request = new sql.Request();
    request.input('candidateId', sql.UniqueIdentifier, userId);
    request.input('fileName', sql.NVarChar, req.file.originalname);
    request.input('fileUrl', sql.NVarChar, fileUrl);
    request.input('fileSize', sql.NVarChar, (req.file.size / 1024 / 1024).toFixed(2) + ' MB');
    request.input('format', sql.NVarChar, path.extname(req.file.originalname).substring(1).toUpperCase());

    // Ghi dữ liệu vào CSDL 
    await request.query(`
      INSERT INTO CVs (CandidateId, FileName, FileUrl, FileSize, Format, IsDefault)
      VALUES (@candidateId, @fileName, @fileUrl, @fileSize, @format, 1)
    `);

    res.json({ message: 'Tải CV lên hệ thống thành công', data: { fileUrl, fileName: req.file.originalname } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lưu thông tin thiết lập vào CSDL' });
  }
});

export default router;
