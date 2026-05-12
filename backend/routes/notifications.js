const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifications/me
router.get('/me', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const result = await pool.query('SELECT Id, UserId, Type, Title, Message, IsRead, CreatedDate FROM Notifications WHERE UserId = $1 ORDER BY CreatedDate DESC LIMIT 20', [userId]);
    const notifications = result.rows.map(n => ({
      id: n.id, type: n.type, title: n.title, message: n.message, read: !!n.isread,
      time: formatTimeAgo(n.createddate), createdDate: n.createddate,
      avatar: getAvatarForType(n.type), avatarColor: getColorForType(n.type), link: getLinkForType(n.type)
    }));
    res.json(notifications);
  } catch (err) { console.error('Lỗi lấy notifications:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const { id: userId } = req.user;
    await pool.query('UPDATE Notifications SET IsRead = true WHERE UserId = $1 AND IsRead = false', [userId]);
    res.json({ message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (err) { console.error('Lỗi đánh dấu đã đọc:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id: userId } = req.user;
    await pool.query('UPDATE Notifications SET IsRead = true WHERE Id = $1 AND UserId = $2', [req.params.id, userId]);
    res.json({ message: 'OK' });
  } catch (err) { console.error('Lỗi đánh dấu đã đọc:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// ── Helper functions ──
function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date(); const d = new Date(date);
  const diffMs = now - d; const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Vừa xong'; if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`; if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}
function getAvatarForType(type) { return { 'interview_invite': '📋', 'interview_reminder': '⏰', 'application_status': '📄', 'cv_processed': '🤖', 'job_match': '🎯', 'system': '🔔' }[type] || '🔔'; }
function getColorForType(type) { return { 'interview_invite': '#6366f1', 'interview_reminder': '#f59e0b', 'application_status': '#10b981', 'cv_processed': '#8b5cf6', 'job_match': '#06b6d4', 'system': '#64748b' }[type] || '#6366f1'; }
function getLinkForType(type) { return { 'interview_invite': '/candidate/applications', 'interview_reminder': '/candidate/applications', 'application_status': '/candidate/applications', 'cv_processed': '/candidate/cv', 'job_match': '/candidate/jobs', 'system': '/' }[type] || '/'; }

module.exports = router;
