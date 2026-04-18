const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

/**
 * Middleware xác thực JWT Token
 * Đính kèm thông tin user vào req.user nếu token hợp lệ
 */
module.exports = function (req, res, next) {
  // Lấy token từ header Authorization (Bearer <token>) hoặc x-auth-token
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};
