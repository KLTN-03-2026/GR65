const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Tất cả endpoints cần xác thực
router.use(authMiddleware);

// ────────────────────────────────────────────────
// GET /api/interviews/employer/me – Lấy tất cả lịch PV của employer
// ────────────────────────────────────────────────
router.get('/employer/me', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query(`
        SELECT 
          i.Id, i.ApplicationId, i.ScheduledDate, i.ScheduledTime,
          i.InterviewType, i.Location, i.InterviewerName, i.Notes,
          i.Status, i.CandidateConfirmed, i.ReminderSent,
          i.CreatedAt, i.UpdatedAt,
          c.FullName AS CandidateName, c.AvatarUrl,
          u.Email AS CandidateEmail,
          j.Title AS JobTitle, j.Id AS JobId
        FROM Interviews i
        INNER JOIN Applications a ON i.ApplicationId = a.Id
        INNER JOIN Jobs j ON a.JobId = j.Id
        INNER JOIN Candidates c ON a.CandidateId = c.UserId
        INNER JOIN Users u ON c.UserId = u.Id
        WHERE j.EmployerId = @EmployerId
        ORDER BY i.ScheduledDate ASC, i.ScheduledTime ASC
      `);

    const interviews = result.recordset.map(r => ({
      id: r.Id,
      applicationId: r.ApplicationId,
      candidateName: r.CandidateName,
      candidateEmail: r.CandidateEmail,
      avatar: r.AvatarUrl || r.CandidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: '#6366f1',
      jobTitle: r.JobTitle,
      jobId: r.JobId,
      date: r.ScheduledDate ? new Date(r.ScheduledDate).toISOString().split('T')[0] : null,
      time: r.ScheduledTime,
      type: r.InterviewType,
      location: r.Location,
      interviewer: r.InterviewerName,
      notes: r.Notes,
      status: r.Status,
      candidateConfirmed: r.CandidateConfirmed,
      reminderSent: r.ReminderSent,
      createdAt: r.CreatedAt
    }));

    res.json(interviews);
  } catch (err) {
    console.error('Lỗi lấy lịch phỏng vấn:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// GET /api/interviews/candidate/me – Ứng viên xem lịch PV của mình
// ────────────────────────────────────────────────
router.get('/candidate/me', async (req, res) => {
  try {
    const { id: candidateId, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Không có quyền.' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CandidateId', sql.UniqueIdentifier, candidateId)
      .query(`
        SELECT 
          i.Id, i.ApplicationId, i.ScheduledDate, i.ScheduledTime,
          i.InterviewType, i.Location, i.InterviewerName, i.Notes,
          i.Status, i.CandidateConfirmed,
          e.CompanyName, j.Title AS JobTitle
        FROM Interviews i
        INNER JOIN Applications a ON i.ApplicationId = a.Id
        INNER JOIN Jobs j ON a.JobId = j.Id
        INNER JOIN Employers e ON j.EmployerId = e.UserId
        WHERE a.CandidateId = @CandidateId
          AND i.Status != 'cancelled'
        ORDER BY i.ScheduledDate ASC
      `);

    const interviews = result.recordset.map(r => ({
      id: r.Id,
      applicationId: r.ApplicationId,
      companyName: r.CompanyName,
      jobTitle: r.JobTitle,
      date: r.ScheduledDate ? new Date(r.ScheduledDate).toISOString().split('T')[0] : null,
      time: r.ScheduledTime,
      type: r.InterviewType,
      location: r.Location,
      interviewer: r.InterviewerName,
      notes: r.Notes,
      status: r.Status,
      candidateConfirmed: r.CandidateConfirmed
    }));

    res.json(interviews);
  } catch (err) {
    console.error('Lỗi lấy lịch PV ứng viên:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// POST /api/interviews – Tạo lịch PV mới + gửi email + tạo notification
// ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });

    const { applicationId, date, time, type, location, interviewer, notes } = req.body;

    if (!applicationId || !date || !time) {
      return res.status(400).json({ message: 'Thiếu thông tin: applicationId, date, time là bắt buộc.' });
    }

    const pool = await poolPromise;

    // Kiểm tra quyền: Application này thuộc Job của Employer không?
    const checkRes = await pool.request()
      .input('AppId', sql.UniqueIdentifier, applicationId)
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query(`
        SELECT a.Id, a.CandidateId, c.FullName, u.Email AS CandidateEmail,
               j.Title AS JobTitle, e.CompanyName
        FROM Applications a
        INNER JOIN Jobs j ON a.JobId = j.Id
        INNER JOIN Candidates c ON a.CandidateId = c.UserId
        INNER JOIN Users u ON c.UserId = u.Id
        INNER JOIN Employers e ON j.EmployerId = e.UserId
        WHERE a.Id = @AppId AND j.EmployerId = @EmployerId
      `);

    if (checkRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ hoặc bạn không có quyền.' });
    }

    const appInfo = checkRes.recordset[0];

    // 1. Tạo bản ghi Interview
    const interviewId = require('crypto').randomUUID();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, interviewId)
      .input('AppId', sql.UniqueIdentifier, applicationId)
      .input('Date', sql.DateTime2, new Date(date))
      .input('Time', sql.NVarChar, time)
      .input('Type', sql.NVarChar, type || 'video')
      .input('Location', sql.NVarChar, location || null)
      .input('Interviewer', sql.NVarChar, interviewer || null)
      .input('Notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Interviews (Id, ApplicationId, ScheduledDate, ScheduledTime, InterviewType, Location, InterviewerName, Notes)
        VALUES (@Id, @AppId, @Date, @Time, @Type, @Location, @Interviewer, @Notes)
      `);

    // 2. Cập nhật Stage và InterviewDate trong Applications
    await pool.request()
      .input('AppId', sql.UniqueIdentifier, applicationId)
      .input('InterviewDate', sql.DateTime2, new Date(`${date}T${time}`))
      .query(`
        UPDATE Applications 
        SET Stage = 'interview', InterviewDate = @InterviewDate, UpdatedAt = GETDATE()
        WHERE Id = @AppId
      `);

    // 3. Tạo Notification cho ứng viên
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, appInfo.CandidateId)
      .input('Type', sql.NVarChar, 'interview_invite')
      .input('Title', sql.NVarChar, 'Bạn có lịch phỏng vấn mới!')
      .input('Message', sql.NVarChar, 
        `${appInfo.CompanyName} mời bạn phỏng vấn cho vị trí "${appInfo.JobTitle}" vào ngày ${date} lúc ${time}. Hình thức: ${type === 'video' ? 'Video call' : type === 'onsite' ? 'Tại văn phòng' : 'Điện thoại'}.`
      )
      .query(`
        INSERT INTO Notifications (UserId, Type, Title, Message)
        VALUES (@UserId, @Type, @Title, @Message)
      `);

    // 4. Gửi email mời phỏng vấn
    const typeLabel = type === 'video' ? 'Video Call' : type === 'onsite' ? 'Tại văn phòng' : 'Điện thoại';
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 Thư Mời Phỏng Vấn</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">AI Recruitment Platform</p>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="color: #374151; font-size: 16px;">Xin chào <strong>${appInfo.FullName}</strong>,</p>
          <p style="color: #6b7280; line-height: 1.6;">
            Chúng tôi rất vui được thông báo rằng <strong>${appInfo.CompanyName}</strong> muốn mời bạn tham gia buổi phỏng vấn cho vị trí:
          </p>
          <div style="background: #f0f0ff; border-left: 4px solid #6366f1; padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;">
            <h3 style="color: #4338ca; margin: 0 0 12px;">${appInfo.JobTitle}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 120px;">📅 Ngày:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">⏰ Giờ:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">📍 Hình thức:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${typeLabel}</td>
              </tr>
              ${location ? `<tr>
                <td style="padding: 6px 0; color: #6b7280;">🔗 Địa điểm:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${location}</td>
              </tr>` : ''}
              ${interviewer ? `<tr>
                <td style="padding: 6px 0; color: #6b7280;">👤 Người PV:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${interviewer}</td>
              </tr>` : ''}
            </table>
          </div>
          ${notes ? `<p style="color: #6b7280; font-style: italic; background: #fefce8; padding: 12px 16px; border-radius: 8px;">📝 Ghi chú: ${notes}</p>` : ''}
          <p style="color: #6b7280; line-height: 1.6;">
            Vui lòng đăng nhập hệ thống để xác nhận hoặc liên hệ nếu cần thay đổi lịch.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/candidate/applications"
               style="background: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Xem chi tiết
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Email này được gửi tự động từ hệ thống AI Recruitment. Vui lòng không reply trực tiếp.
          </p>
        </div>
      </div>
    `;

    // Gửi email (không chặn response nếu email fail)
    sendEmail(
      appInfo.CandidateEmail,
      `[Mời phỏng vấn] ${appInfo.JobTitle} - ${appInfo.CompanyName}`,
      `Bạn được mời phỏng vấn cho vị trí ${appInfo.JobTitle} tại ${appInfo.CompanyName} vào ngày ${date} lúc ${time}.`,
      emailHtml
    ).then(result => {
      if (result.success) console.log(`Email PV đã gửi tới ${appInfo.CandidateEmail}`);
      else console.warn('Email PV gửi thất bại:', result.error);
    }).catch(err => console.error('Lỗi gửi email PV:', err));

    res.status(201).json({ 
      message: 'Đã tạo lịch phỏng vấn và gửi email mời thành công!',
      interviewId 
    });
  } catch (err) {
    console.error('Lỗi tạo lịch phỏng vấn:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/interviews/:id/confirm – Xác nhận lịch PV (Employer hoặc Candidate)
// ────────────────────────────────────────────────
router.patch('/:id/confirm', async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const interviewId = req.params.id;
    const pool = await poolPromise;

    if (role === 'Candidate') {
      // Ứng viên xác nhận tham gia
      const check = await pool.request()
        .input('InterviewId', sql.UniqueIdentifier, interviewId)
        .input('CandidateId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT i.Id FROM Interviews i
          INNER JOIN Applications a ON i.ApplicationId = a.Id
          WHERE i.Id = @InterviewId AND a.CandidateId = @CandidateId
        `);
      if (check.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });

      await pool.request()
        .input('Id', sql.UniqueIdentifier, interviewId)
        .query(`UPDATE Interviews SET CandidateConfirmed = 1, UpdatedAt = GETDATE() WHERE Id = @Id`);

      res.json({ message: 'Ứng viên đã xác nhận lịch phỏng vấn.' });
    } else if (role === 'Employer') {
      // Employer xác nhận (chuyển status sang confirmed)
      const check = await pool.request()
        .input('InterviewId', sql.UniqueIdentifier, interviewId)
        .input('EmployerId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT i.Id FROM Interviews i
          INNER JOIN Applications a ON i.ApplicationId = a.Id
          INNER JOIN Jobs j ON a.JobId = j.Id
          WHERE i.Id = @InterviewId AND j.EmployerId = @EmployerId
        `);
      if (check.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });

      await pool.request()
        .input('Id', sql.UniqueIdentifier, interviewId)
        .query(`UPDATE Interviews SET Status = 'confirmed', UpdatedAt = GETDATE() WHERE Id = @Id`);

      res.json({ message: 'Đã xác nhận lịch phỏng vấn.' });
    } else {
      res.status(403).json({ message: 'Không có quyền.' });
    }
  } catch (err) {
    console.error('Lỗi xác nhận lịch PV:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/interviews/:id/cancel – Hủy lịch PV
// ────────────────────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const interviewId = req.params.id;
    const pool = await poolPromise;

    // Kiểm tra quyền
    let check;
    if (role === 'Employer') {
      check = await pool.request()
        .input('InterviewId', sql.UniqueIdentifier, interviewId)
        .input('EmployerId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT i.Id, i.ApplicationId FROM Interviews i
          INNER JOIN Applications a ON i.ApplicationId = a.Id
          INNER JOIN Jobs j ON a.JobId = j.Id
          WHERE i.Id = @InterviewId AND j.EmployerId = @EmployerId
        `);
    } else if (role === 'Candidate') {
      check = await pool.request()
        .input('InterviewId', sql.UniqueIdentifier, interviewId)
        .input('CandidateId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT i.Id, i.ApplicationId FROM Interviews i
          INNER JOIN Applications a ON i.ApplicationId = a.Id
          WHERE i.Id = @InterviewId AND a.CandidateId = @CandidateId
        `);
    } else {
      return res.status(403).json({ message: 'Không có quyền.' });
    }

    if (check.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });

    await pool.request()
      .input('Id', sql.UniqueIdentifier, interviewId)
      .query(`UPDATE Interviews SET Status = 'cancelled', UpdatedAt = GETDATE() WHERE Id = @Id`);

    // Cập nhật lại Application stage về reviewing
    const appId = check.recordset[0].ApplicationId;
    await pool.request()
      .input('AppId', sql.UniqueIdentifier, appId)
      .query(`UPDATE Applications SET Stage = 'reviewing', InterviewDate = NULL, UpdatedAt = GETDATE() WHERE Id = @AppId`);

    res.json({ message: 'Đã hủy lịch phỏng vấn.' });
  } catch (err) {
    console.error('Lỗi hủy lịch PV:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// POST /api/interviews/:id/remind – Gửi email nhắc lịch
// ────────────────────────────────────────────────
router.post('/:id/remind', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });

    const interviewId = req.params.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('InterviewId', sql.UniqueIdentifier, interviewId)
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query(`
        SELECT 
          i.ScheduledDate, i.ScheduledTime, i.InterviewType, i.Location, i.InterviewerName,
          c.FullName, u.Email AS CandidateEmail, a.CandidateId,
          j.Title AS JobTitle, e.CompanyName
        FROM Interviews i
        INNER JOIN Applications a ON i.ApplicationId = a.Id
        INNER JOIN Jobs j ON a.JobId = j.Id
        INNER JOIN Candidates c ON a.CandidateId = c.UserId
        INNER JOIN Users u ON c.UserId = u.Id
        INNER JOIN Employers e ON j.EmployerId = e.UserId
        WHERE i.Id = @InterviewId AND j.EmployerId = @EmployerId
      `);

    if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy.' });

    const info = result.recordset[0];
    const dateStr = new Date(info.ScheduledDate).toISOString().split('T')[0];
    const typeLabel = info.InterviewType === 'video' ? 'Video Call' : info.InterviewType === 'onsite' ? 'Tại văn phòng' : 'Điện thoại';

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0;">⏰ Nhắc lịch phỏng vấn</h2>
        </div>
        <div style="background: white; padding: 28px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="color: #374151;">Xin chào <strong>${info.FullName}</strong>,</p>
          <p style="color: #6b7280;">Đây là email nhắc lịch phỏng vấn sắp tới của bạn:</p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
            <p style="margin: 4px 0; color: #92400e;"><strong>Vị trí:</strong> ${info.JobTitle}</p>
            <p style="margin: 4px 0; color: #92400e;"><strong>Công ty:</strong> ${info.CompanyName}</p>
            <p style="margin: 4px 0; color: #92400e;"><strong>Ngày:</strong> ${dateStr}</p>
            <p style="margin: 4px 0; color: #92400e;"><strong>Giờ:</strong> ${info.ScheduledTime}</p>
            <p style="margin: 4px 0; color: #92400e;"><strong>Hình thức:</strong> ${typeLabel}</p>
            ${info.Location ? `<p style="margin: 4px 0; color: #92400e;"><strong>Địa điểm:</strong> ${info.Location}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 20px;">
            Vui lòng chuẩn bị đúng giờ. Chúc bạn phỏng vấn thành công! 🍀
          </p>
        </div>
      </div>
    `;

    // Gửi email nhắc lịch
    sendEmail(
      info.CandidateEmail,
      `[Nhắc lịch] Phỏng vấn ${info.JobTitle} - ${dateStr} ${info.ScheduledTime}`,
      `Nhắc lịch phỏng vấn vị trí ${info.JobTitle} tại ${info.CompanyName} vào ngày ${dateStr} lúc ${info.ScheduledTime}.`,
      emailHtml
    ).catch(err => console.error('Lỗi gửi email nhắc:', err));

    // Tạo notification
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, info.CandidateId)
      .input('Type', sql.NVarChar, 'interview_reminder')
      .input('Title', sql.NVarChar, '⏰ Nhắc lịch phỏng vấn')
      .input('Message', sql.NVarChar, `Bạn có lịch phỏng vấn "${info.JobTitle}" vào ${dateStr} lúc ${info.ScheduledTime}.`)
      .query(`INSERT INTO Notifications (UserId, Type, Title, Message) VALUES (@UserId, @Type, @Title, @Message)`);

    // Đánh dấu đã gửi nhắc
    await pool.request()
      .input('Id', sql.UniqueIdentifier, interviewId)
      .query(`UPDATE Interviews SET ReminderSent = 1, UpdatedAt = GETDATE() WHERE Id = @Id`);

    res.json({ message: `Đã gửi nhắc lịch tới ${info.FullName}.` });
  } catch (err) {
    console.error('Lỗi gửi nhắc lịch:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

module.exports = router;
