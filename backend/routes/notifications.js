const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ────────────────────────────────────────────────
// GET /api/notifications/me – Lấy thông báo của user đang đăng nhập
// ────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT TOP 20
          Id, UserId, Type, Title, Message, IsRead, CreatedDate
        FROM Notifications
        WHERE UserId = @UserId
        ORDER BY CreatedDate DESC
      `);

    const notifications = result.recordset.map(n => ({
      id: n.Id,
      type: n.Type,
      title: n.Title,
      message: n.Message,
      read: !!n.IsRead,
      time: formatTimeAgo(n.CreatedDate),
      createdDate: n.CreatedDate,
      // Generate avatar from type
      avatar: getAvatarForType(n.Type),
      avatarColor: getColorForType(n.Type),
      link: getLinkForType(n.Type)
    }));

    res.json(notifications);
  } catch (err) {
    console.error('Lỗi lấy notifications:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/notifications/read-all – Đánh dấu tất cả đã đọc
// ────────────────────────────────────────────────
router.patch('/read-all', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const pool = await poolPromise;

    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`UPDATE Notifications SET IsRead = 1 WHERE UserId = @UserId AND IsRead = 0`);

    res.json({ message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (err) {
    console.error('Lỗi đánh dấu đã đọc:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/notifications/:id/read – Đánh dấu 1 notification đã đọc
// ────────────────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notifId = req.params.id;
    const pool = await poolPromise;

    await pool.request()
      .input('Id', sql.UniqueIdentifier, notifId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`UPDATE Notifications SET IsRead = 1 WHERE Id = @Id AND UserId = @UserId`);

    res.json({ message: 'OK' });
  } catch (err) {
    console.error('Lỗi đánh dấu đã đọc:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ── Helper functions ──

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function getAvatarForType(type) {
  const map = {
    'interview_invite': '📋',
    'interview_reminder': '⏰',
    'application_status': '📄',
    'cv_processed': '🤖',
    'job_match': '🎯',
    'system': '🔔'
  };
  return map[type] || '🔔';
}

function getColorForType(type) {
  const map = {
    'interview_invite': '#6366f1',
    'interview_reminder': '#f59e0b',
    'application_status': '#10b981',
    'cv_processed': '#8b5cf6',
    'job_match': '#06b6d4',
    'system': '#64748b'
  };
  return map[type] || '#6366f1';
}

function getLinkForType(type) {
  const map = {
    'interview_invite': '/candidate/applications',
    'interview_reminder': '/candidate/applications',
    'application_status': '/candidate/applications',
    'cv_processed': '/candidate/cv',
    'job_match': '/candidate/jobs',
    'system': '/'
  };
  return map[type] || '/';
}

module.exports = router;
