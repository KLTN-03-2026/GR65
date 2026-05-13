const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

/**
 * Middleware xác thực JWT Token
 * Đính kèm thông tin user vào req.user nếu token hợp lệ
 * Kiểm tra tài khoản có bị khóa bởi Admin không
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

    // Kiểm tra tài khoản bị khóa bởi Admin (async)
    checkAccountStatus(req.user.id, req.user.role)
      .then((suspended) => {
        if (suspended) {
          return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ admin để được hỗ trợ.' });
        }
        next();
      })
      .catch(() => {
        // Nếu lỗi kiểm tra status, vẫn cho phép truy cập (graceful degradation)
        next();
      });
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

/**
 * Kiểm tra trạng thái tài khoản từ DB
 * @returns {Promise<boolean>} true nếu bị suspended
 */
async function checkAccountStatus(userId, role) {
  try {
    const pool = await poolPromise;
    let table = null;
    if (role === 'Candidate') table = 'Candidates';
    else if (role === 'Employer') table = 'Employers';
    else return false; // Admin không bị khóa

    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`SELECT Status FROM ${table} WHERE UserId = @UserId`);

    return result.recordset[0]?.Status === 'suspended';
  } catch {
    return false;
  }
}
