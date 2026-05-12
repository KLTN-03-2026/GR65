const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

router.use(authMiddleware);

// GET /api/interviews/employer/me
router.get('/employer/me', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    const result = await pool.query(
      `SELECT i.Id, i.ApplicationId, i.ScheduledDate, i.ScheduledTime, i.InterviewType, i.Location, i.InterviewerName, i.Notes, i.Status, i.CandidateConfirmed, i.ReminderSent, i.CreatedAt, i.UpdatedAt, c.FullName AS candidatename, c.AvatarUrl, u.Email AS candidateemail, j.Title AS jobtitle, j.Id AS jobid
       FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id INNER JOIN Jobs j ON a.JobId = j.Id INNER JOIN Candidates c ON a.CandidateId = c.UserId INNER JOIN Users u ON c.UserId = u.Id
       WHERE j.EmployerId = $1 ORDER BY i.ScheduledDate ASC, i.ScheduledTime ASC`, [employerId]);
    const interviews = result.rows.map(r => ({
      id: r.id, applicationId: r.applicationid, candidateName: r.candidatename, candidateEmail: r.candidateemail,
      avatar: r.avatarurl || r.candidatename.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(), avatarColor: '#6366f1',
      jobTitle: r.jobtitle, jobId: r.jobid,
      date: r.scheduleddate ? new Date(r.scheduleddate).toISOString().split('T')[0] : null, time: r.scheduledtime,
      type: r.interviewtype, location: r.location, interviewer: r.interviewername, notes: r.notes,
      status: r.status, candidateConfirmed: r.candidateconfirmed, reminderSent: r.remindersent, createdAt: r.createdat
    }));
    res.json(interviews);
  } catch (err) { console.error('Lỗi lấy lịch phỏng vấn:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// GET /api/interviews/candidate/me
router.get('/candidate/me', async (req, res) => {
  try {
    const { id: candidateId, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Không có quyền.' });
    const result = await pool.query(
      `SELECT i.Id, i.ApplicationId, i.ScheduledDate, i.ScheduledTime, i.InterviewType, i.Location, i.InterviewerName, i.Notes, i.Status, i.CandidateConfirmed, e.CompanyName, j.Title AS jobtitle
       FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id INNER JOIN Jobs j ON a.JobId = j.Id INNER JOIN Employers e ON j.EmployerId = e.UserId
       WHERE a.CandidateId = $1 AND i.Status != 'cancelled' ORDER BY i.ScheduledDate ASC`, [candidateId]);
    const interviews = result.rows.map(r => ({
      id: r.id, applicationId: r.applicationid, companyName: r.companyname, jobTitle: r.jobtitle,
      date: r.scheduleddate ? new Date(r.scheduleddate).toISOString().split('T')[0] : null, time: r.scheduledtime,
      type: r.interviewtype, location: r.location, interviewer: r.interviewername, notes: r.notes,
      status: r.status, candidateConfirmed: r.candidateconfirmed
    }));
    res.json(interviews);
  } catch (err) { console.error('Lỗi lấy lịch PV ứng viên:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// POST /api/interviews
router.post('/', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    const { applicationId, date, time, type, location, interviewer, notes } = req.body;
    if (!applicationId || !date || !time) return res.status(400).json({ message: 'Thiếu thông tin: applicationId, date, time.' });

    const checkRes = await pool.query(
      `SELECT a.Id, a.CandidateId, c.FullName, u.Email AS candidateemail, j.Title AS jobtitle, e.CompanyName
       FROM Applications a INNER JOIN Jobs j ON a.JobId = j.Id INNER JOIN Candidates c ON a.CandidateId = c.UserId INNER JOIN Users u ON c.UserId = u.Id INNER JOIN Employers e ON j.EmployerId = e.UserId
       WHERE a.Id = $1 AND j.EmployerId = $2`, [applicationId, employerId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    const appInfo = checkRes.rows[0];

    const interviewId = require('crypto').randomUUID();
    await pool.query('INSERT INTO Interviews (Id, ApplicationId, ScheduledDate, ScheduledTime, InterviewType, Location, InterviewerName, Notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [interviewId, applicationId, new Date(date), time, type || 'video', location || null, interviewer || null, notes || null]);

    await pool.query('UPDATE Applications SET Stage = $1, InterviewDate = $2, UpdatedAt = NOW() WHERE Id = $3',
      ['interview', new Date(`${date}T${time}`), applicationId]);

    await pool.query('INSERT INTO Notifications (UserId, Type, Title, Message) VALUES ($1, $2, $3, $4)',
      [appInfo.candidateid, 'interview_invite', 'Bạn có lịch phỏng vấn mới!',
       `${appInfo.companyname} mời bạn phỏng vấn cho vị trí "${appInfo.jobtitle}" vào ngày ${date} lúc ${time}.`]);

    const typeLabel = type === 'video' ? 'Video Call' : type === 'onsite' ? 'Tại văn phòng' : 'Điện thoại';
    const emailHtml = `<div style="font-family:'Segoe UI',Arial;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:16px 16px 0 0;text-align:center"><h1 style="color:white;margin:0;font-size:24px">📋 Thư Mời Phỏng Vấn</h1></div><div style="background:white;padding:32px;border-radius:0 0 16px 16px"><p>Xin chào <strong>${appInfo.fullname}</strong>,</p><div style="background:#f0f0ff;border-left:4px solid #6366f1;padding:16px 20px;border-radius:0 12px 12px 0;margin:20px 0"><h3 style="color:#4338ca;margin:0 0 12px">${appInfo.jobtitle}</h3><p>📅 Ngày: <strong>${date}</strong></p><p>⏰ Giờ: <strong>${time}</strong></p><p>📍 Hình thức: <strong>${typeLabel}</strong></p>${location ? `<p>🔗 Địa điểm: <strong>${location}</strong></p>` : ''}</div><div style="text-align:center"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/candidate/applications" style="background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Xem chi tiết</a></div></div></div>`;
    sendEmail(appInfo.candidateemail, `[Mời phỏng vấn] ${appInfo.jobtitle} - ${appInfo.companyname}`, `Bạn được mời phỏng vấn cho vị trí ${appInfo.jobtitle}`, emailHtml).catch(err => console.error('Lỗi gửi email PV:', err));

    res.status(201).json({ message: 'Đã tạo lịch phỏng vấn thành công!', interviewId });
  } catch (err) { console.error('Lỗi tạo lịch phỏng vấn:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// PATCH /api/interviews/:id/confirm
router.patch('/:id/confirm', async (req, res) => {
  try {
    const { id: userId, role } = req.user; const interviewId = req.params.id;
    if (role === 'Candidate') {
      const check = await pool.query('SELECT i.Id FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id WHERE i.Id = $1 AND a.CandidateId = $2', [interviewId, userId]);
      if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });
      await pool.query('UPDATE Interviews SET CandidateConfirmed = true, UpdatedAt = NOW() WHERE Id = $1', [interviewId]);
      res.json({ message: 'Ứng viên đã xác nhận lịch phỏng vấn.' });
    } else if (role === 'Employer') {
      const check = await pool.query('SELECT i.Id FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id INNER JOIN Jobs j ON a.JobId = j.Id WHERE i.Id = $1 AND j.EmployerId = $2', [interviewId, userId]);
      if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });
      await pool.query("UPDATE Interviews SET Status = 'confirmed', UpdatedAt = NOW() WHERE Id = $1", [interviewId]);
      res.json({ message: 'Đã xác nhận lịch phỏng vấn.' });
    } else { res.status(403).json({ message: 'Không có quyền.' }); }
  } catch (err) { console.error('Lỗi xác nhận lịch PV:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// PATCH /api/interviews/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id: userId, role } = req.user; const interviewId = req.params.id;
    let check;
    if (role === 'Employer') { check = await pool.query('SELECT i.Id, i.ApplicationId FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id INNER JOIN Jobs j ON a.JobId = j.Id WHERE i.Id = $1 AND j.EmployerId = $2', [interviewId, userId]); }
    else if (role === 'Candidate') { check = await pool.query('SELECT i.Id, i.ApplicationId FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id WHERE i.Id = $1 AND a.CandidateId = $2', [interviewId, userId]); }
    else { return res.status(403).json({ message: 'Không có quyền.' }); }
    if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });
    await pool.query("UPDATE Interviews SET Status = 'cancelled', UpdatedAt = NOW() WHERE Id = $1", [interviewId]);
    const appId = check.rows[0].applicationid;
    await pool.query("UPDATE Applications SET Stage = 'reviewing', InterviewDate = NULL, UpdatedAt = NOW() WHERE Id = $1", [appId]);
    res.json({ message: 'Đã hủy lịch phỏng vấn.' });
  } catch (err) { console.error('Lỗi hủy lịch PV:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// POST /api/interviews/:id/remind
router.post('/:id/remind', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    const interviewId = req.params.id;
    const result = await pool.query(
      `SELECT i.ScheduledDate, i.ScheduledTime, i.InterviewType, i.Location, i.InterviewerName, c.FullName, u.Email AS candidateemail, a.CandidateId, j.Title AS jobtitle, e.CompanyName
       FROM Interviews i INNER JOIN Applications a ON i.ApplicationId = a.Id INNER JOIN Jobs j ON a.JobId = j.Id INNER JOIN Candidates c ON a.CandidateId = c.UserId INNER JOIN Users u ON c.UserId = u.Id INNER JOIN Employers e ON j.EmployerId = e.UserId
       WHERE i.Id = $1 AND j.EmployerId = $2`, [interviewId, employerId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });
    const info = result.rows[0];
    const dateStr = new Date(info.scheduleddate).toISOString().split('T')[0];
    const typeLabel = info.interviewtype === 'video' ? 'Video Call' : info.interviewtype === 'onsite' ? 'Tại văn phòng' : 'Điện thoại';
    const emailHtml = `<div style="font-family:'Segoe UI',Arial;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc"><div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:24px;border-radius:16px 16px 0 0;text-align:center"><h2 style="color:white;margin:0">⏰ Nhắc lịch phỏng vấn</h2></div><div style="background:white;padding:28px;border-radius:0 0 16px 16px"><p>Xin chào <strong>${info.fullname}</strong>,</p><div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:0 8px 8px 0;margin:16px 0"><p><strong>Vị trí:</strong> ${info.jobtitle}</p><p><strong>Ngày:</strong> ${dateStr}</p><p><strong>Giờ:</strong> ${info.scheduledtime}</p><p><strong>Hình thức:</strong> ${typeLabel}</p></div></div></div>`;
    sendEmail(info.candidateemail, `[Nhắc lịch] ${info.jobtitle} - ${dateStr} ${info.scheduledtime}`, `Nhắc lịch phỏng vấn`, emailHtml).catch(err => console.error('Lỗi gửi email nhắc:', err));
    await pool.query('INSERT INTO Notifications (UserId, Type, Title, Message) VALUES ($1, $2, $3, $4)', [info.candidateid, 'interview_reminder', '⏰ Nhắc lịch phỏng vấn', `Bạn có lịch phỏng vấn "${info.jobtitle}" vào ${dateStr} lúc ${info.scheduledtime}.`]);
    await pool.query('UPDATE Interviews SET ReminderSent = true, UpdatedAt = NOW() WHERE Id = $1', [interviewId]);
    res.json({ message: `Đã gửi nhắc lịch tới ${info.fullname}.` });
  } catch (err) { console.error('Lỗi gửi nhắc lịch:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

module.exports = router;
