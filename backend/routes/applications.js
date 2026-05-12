const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/applications/employer/me
router.get('/employer/me', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    const appsRes = await pool.query(
      `SELECT a.Id AS applicationid, a.Stage, a.AIMatchScore, a.CvRead, a.InterviewDate, a.AppliedDate,
              c.UserId AS candidateid, c.FullName, c.Title, c.AvatarUrl, c.ExperienceYears, c.SkillsJson,
              j.Title AS jobtitle, j.Id AS jobid, j.Description AS jobdesc, j.Requirements AS jobreq, j.SkillsReqJson AS jobskills,
              (SELECT FileUrl FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC LIMIT 1) AS cvurl,
              (SELECT CAST(Id AS VARCHAR(50)) FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC LIMIT 1) AS cvid
       FROM Applications a
       INNER JOIN Jobs j ON a.JobId = j.Id
       INNER JOIN Candidates c ON a.CandidateId = c.UserId
       WHERE j.EmployerId = $1 ORDER BY a.AppliedDate DESC`, [employerId]);
    let applicants = appsRes.rows.map(a => ({
      applicationId: a.applicationid, jobId: a.jobid, jobTitle: a.jobtitle,
      candidateId: a.candidateid, cvId: a.cvid,
      name: a.fullname, title: a.title || 'Ứng viên', avatar: a.avatarurl || (a.fullname||'?').charAt(0),
      experience: a.experienceyears || '0 năm', skills: a.skillsjson ? JSON.parse(a.skillsjson) : [],
      matchScore: parseFloat(a.aimatchscore) || 0, stage: a.stage, appliedDate: a.applieddate,
      interviewDate: a.interviewdate, cvUrl: a.cvurl,
      _jdText: `${a.jobtitle||''} ${a.jobdesc||''} ${a.jobreq||''} ${a.jobskills||''}`
    }));
    // AI Scoring
    const unScored = applicants.filter(a => a.matchScore === 0);
    if (unScored.length > 0) {
      const groupedByJob = {};
      for (const app of unScored) { if (!groupedByJob[app.jobId]) groupedByJob[app.jobId] = { jdText: app._jdText, apps: [] }; groupedByJob[app.jobId].apps.push(app); }
      const http = require('http');
      for (const jobId in groupedByJob) {
        const group = groupedByJob[jobId];
        const cvIdsToScore = [], fallbackCvs = [];
        for (const x of group.apps) { if (x.cvId) cvIdsToScore.push(x.cvId); else fallbackCvs.push({ id: x.applicationId, text: `${x.title||''} ${x.experience||''} ${(x.skills||[]).join(', ')}` }); }
        const postData = JSON.stringify({ jd_text: group.jdText, cv_ids: cvIdsToScore, fallback_cvs: fallbackCvs });
        try {
          const aiData = await new Promise((resolve, reject) => {
            const req = http.request({ hostname: '127.0.0.1', port: 8000, path: '/api/ai/match-jd', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }, (res) => { let raw = ''; res.on('data', c => raw += c); res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); } }); });
            req.on('error', e => reject(e)); req.write(postData); req.end();
          });
          if (aiData.success && aiData.scores) {
            for (const app of group.apps) { const trackId = app.cvId || app.applicationId; if (aiData.scores[trackId] !== undefined) { const finalScore = aiData.scores[trackId]; await pool.query('UPDATE Applications SET AIMatchScore = $1 WHERE Id = $2', [finalScore, app.applicationId]); app.matchScore = finalScore; } }
          }
        } catch (e) { console.error("Lỗi AI ở Job " + jobId, e.message); }
      }
      applicants.sort((a, b) => b.matchScore - a.matchScore);
    }
    applicants.forEach(a => delete a._jdText);
    res.json(applicants);
  } catch (err) { console.error('Lỗi lấy tất cả ứng viên:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// GET /api/applications/job/:jobId
router.get('/job/:jobId', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền truy cập.' });
    const jobId = req.params.jobId;
    const jobRes = await pool.query('SELECT Id, Title, Description, Requirements, SkillsReqJson FROM Jobs WHERE Id = $1 AND EmployerId = $2', [jobId, employerId]);
    if (jobRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy Job hoặc bạn không có quyền.' });
    const jobData = jobRes.rows[0];
    const jdText = `${jobData.title||''} ${jobData.description||''} ${jobData.requirements||''} ${jobData.skillsreqjson||''}`;
    const appsRes = await pool.query(
      `SELECT a.Id AS applicationid, a.Stage, a.AIMatchScore, a.CvRead, a.InterviewDate, a.AppliedDate,
              c.UserId AS candidateid, c.FullName, c.Title, c.AvatarUrl, c.ExperienceYears, c.SkillsJson,
              (SELECT FileUrl FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC LIMIT 1) AS cvurl,
              (SELECT CAST(Id AS VARCHAR(50)) FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC LIMIT 1) AS cvid
       FROM Applications a INNER JOIN Candidates c ON a.CandidateId = c.UserId
       WHERE a.JobId = $1 ORDER BY a.AIMatchScore DESC NULLS LAST, a.AppliedDate DESC`, [jobId]);
    let applicants = appsRes.rows.map(a => ({
      applicationId: a.applicationid, candidateId: a.candidateid, cvId: a.cvid,
      name: a.fullname, title: a.title || 'Ứng viên', avatar: a.avatarurl || (a.fullname||'?').charAt(0),
      experience: a.experienceyears || '0 năm', skills: a.skillsjson ? JSON.parse(a.skillsjson) : [],
      matchScore: parseFloat(a.aimatchscore) || 0, stage: a.stage, appliedDate: a.applieddate,
      interviewDate: a.interviewdate, isRead: !!a.cvread, cvUrl: a.cvurl
    }));
    // Batch AI scoring
    const unScored = applicants.filter(a => a.matchScore === 0);
    if (unScored.length > 0) {
      try {
        const cvIdsToScore = [], fallbackCvs = [];
        for (const x of unScored) { if (x.cvId) cvIdsToScore.push(x.cvId); else fallbackCvs.push({ id: x.applicationId, text: `${x.title||''} ${x.experience||''} ${(x.skills||[]).join(', ')}` }); }
        const postData = JSON.stringify({ jd_text: jdText, cv_ids: cvIdsToScore, fallback_cvs: fallbackCvs });
        const http = require('http');
        const aiData = await new Promise((resolve, reject) => {
          const req = http.request({ hostname: '127.0.0.1', port: 8000, path: '/api/ai/match-jd', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }, (res) => { let raw = ''; res.on('data', c => raw += c); res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); } }); });
          req.on('error', e => reject(e)); req.write(postData); req.end();
        });
        if (aiData.success && aiData.scores) {
          for (const app of unScored) { const trackId = app.cvId || app.applicationId; if (aiData.scores[trackId] !== undefined) { const finalScore = aiData.scores[trackId]; await pool.query('UPDATE Applications SET AIMatchScore = $1 WHERE Id = $2', [finalScore, app.applicationId]); app.matchScore = finalScore; } }
          applicants.sort((a, b) => b.matchScore - a.matchScore);
        }
      } catch (err) { console.error("AI Semantic Match Failed:", err.message); }
    }
    res.json(applicants);
  } catch (err) { console.error('Lỗi khi lấy DS ứng viên:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PATCH /api/applications/:id/stage
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền truy cập.' });
    const appId = req.params.id; const { stage } = req.body;
    const checkRes = await pool.query('SELECT a.Id FROM Applications a INNER JOIN Jobs j ON a.JobId = j.Id WHERE a.Id = $1 AND j.EmployerId = $2', [appId, employerId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    await pool.query('UPDATE Applications SET Stage = $1, UpdatedAt = NOW() WHERE Id = $2', [stage, appId]);
    res.json({ message: 'Đã cập nhật trạng thái hồ sơ.' });
  } catch (err) { console.error('Lỗi khi cập nhật trạng thái:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// GET /api/applications/candidate/me
router.get('/candidate/me', async (req, res) => {
  try {
    const { id: candidateId, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Không có quyền.' });
    const result = await pool.query(
      `SELECT a.Id, a.Stage AS Status, a.AIMatchScore, a.CvRead, a.InterviewDate, a.AppliedDate,
              j.Title AS jobtitle, j.Id AS jobid, e.CompanyName, e.LogoUrl
       FROM Applications a INNER JOIN Jobs j ON a.JobId = j.Id INNER JOIN Employers e ON j.EmployerId = e.UserId
       WHERE a.CandidateId = $1 ORDER BY a.AppliedDate DESC`, [candidateId]);
    const apps = result.rows.map(a => ({ id: a.id, jobId: a.jobid, jobTitle: a.jobtitle, companyName: a.companyname, companyLogo: a.logourl, status: a.status, aiScore: parseFloat(a.aimatchscore) || 0, cvRead: !!a.cvread, interviewDate: a.interviewdate, appliedDate: a.applieddate }));
    res.json(apps);
  } catch (err) { console.error('Lỗi lấy lịch sử ứng tuyển:', err); res.status(500).json({ message: 'Lỗi hệ thống' }); }
});

// POST /api/applications/:id/contact
router.post('/:id/contact', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    const appId = req.params.id; const { subject, message } = req.body;
    const result = await pool.query(
      `SELECT a.Id, u.Email AS candidateemail, c.FullName AS candidatename, j.Title AS jobtitle, emp.CompanyName AS employername, eu.Email AS employeremail
       FROM Applications a JOIN Users u ON a.CandidateId = u.Id JOIN Candidates c ON a.CandidateId = c.UserId JOIN Jobs j ON a.JobId = j.Id JOIN Employers emp ON j.EmployerId = emp.UserId JOIN Users eu ON j.EmployerId = eu.Id
       WHERE a.Id = $1 AND j.EmployerId = $2`, [appId, employerId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Không tìm thấy ứng viên.' });
    const app = result.rows[0];
    const { sendEmail } = require('../utils/email');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const emailSubject = subject || `[${app.employername}] Thông báo về vị trí ${app.jobtitle}`;
    const emailMessage = message || `Chào ${app.candidatename}, chúng tôi muốn liên hệ với bạn về vị trí ${app.jobtitle}.`;
    const html = `<div style="font-family:'Segoe UI',Arial;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center"><h1 style="color:white;margin:0;font-size:24px">📧 Tin nhắn từ Nhà tuyển dụng</h1></div><div style="padding:32px"><p style="color:#374151;font-size:16px">Xin chào <strong>${app.candidatename}</strong>,</p><p style="color:#4b5563;font-size:15px">${emailMessage}</p><div style="background:#eef2ff;border-radius:12px;padding:20px;margin:24px 0"><p style="margin:0 0 8px;color:#6366f1;font-weight:600">📋 Vị trí: ${app.jobtitle}</p><p style="margin:0;color:#6366f1">🏢 Công ty: ${app.employername}</p></div><a href="${frontendUrl}/candidate/applications" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600">Xem chi tiết trên AI Recruit</a></div></div>`;
    await sendEmail(app.candidateemail, emailSubject, emailMessage, html);
    const candidateResult = await pool.query('SELECT CandidateId FROM Applications WHERE Id = $1', [appId]);
    if (candidateResult.rows.length) {
      await pool.query('INSERT INTO Notifications (Id, UserId, Type, Title, Message, IsRead, CreatedDate) VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())',
        [candidateResult.rows[0].candidateid, 'application_status', `Tin nhắn từ ${app.employername}`, `Nhà tuyển dụng ${app.employername} đã gửi tin nhắn liên quan đến vị trí ${app.jobtitle}.`]);
    }
    res.json({ message: `Đã gửi email tới ${app.candidatename} (${app.candidateemail})` });
  } catch (err) { console.error('Lỗi gửi email liên hệ:', err); res.status(500).json({ message: 'Lỗi hệ thống khi gửi email' }); }
});

module.exports = router;
