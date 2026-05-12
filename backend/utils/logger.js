const { pool } = require('../db');

/**
 * Ghi lại nhật ký hoạt động vào cơ sở dữ liệu
 * @param {string} userId - ID của người dùng thực hiện
 * @param {string} action - Hành động (Vd: LOGIN, POST_JOB, UPLOAD_CV)
 * @param {string} entityType - Loại đối tượng (Vd: User, Job, CV)
 * @param {string} entityId - ID của đối tượng liên quan (Optional)
 * @param {string} details - Chi tiết hành động (Optional)
 */
const logActivity = async (userId, action, entityType, entityId = null, details = null) => {
  try {
    await pool.query(
      `INSERT INTO ActivityLog (Id, UserId, Action, EntityType, EntityId, Details, CreatedAt)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [userId, action, entityType, entityId, details]
    );
  } catch (err) {
    console.error('Error logging activity:', err.message);
    // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng chính của API
  }
};

module.exports = { logActivity };
