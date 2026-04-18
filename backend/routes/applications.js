const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');

// Tất cả endpoints cần xác thực
router.use(authMiddleware);

// ────────────────────────────────────────────────
// GET /api/applications/employer/me – Lấy TẤT CẢ ứng viên của công ty này
// ────────────────────────────────────────────────
router.get('/employer/me', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền.' });
    
    const pool = await poolPromise;
    const appsRes = await pool.request()
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query(`
        SELECT 
          a.Id AS ApplicationId, a.Stage, a.AIMatchScore, a.CvRead, a.InterviewDate, a.AppliedDate,
          c.UserId AS CandidateId, c.FullName, c.Title, c.AvatarUrl, c.ExperienceYears, c.SkillsJson,
          j.Title AS JobTitle, j.Id AS JobId, j.Description AS JobDesc, j.Requirements AS JobReq, j.SkillsReqJson AS JobSkills,
          (SELECT TOP 1 FileUrl FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC) AS CvUrl,
          (SELECT TOP 1 CAST(Id AS VARCHAR(50)) FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC) AS CvId
        FROM Applications a
        INNER JOIN Jobs j ON a.JobId = j.Id
        INNER JOIN Candidates c ON a.CandidateId = c.UserId
        WHERE j.EmployerId = @EmployerId
        ORDER BY a.AppliedDate DESC
      `);
      
    let applicants = appsRes.recordset.map(a => ({
      applicationId: a.ApplicationId,
      jobId: a.JobId,
      jobTitle: a.JobTitle,
      candidateId: a.CandidateId,
      cvId: a.CvId,
      name: a.FullName,
      title: a.Title || 'Ứng viên',
      avatar: a.AvatarUrl || a.FullName.charAt(0),
      experience: a.ExperienceYears || '0 năm',
      skills: a.SkillsJson ? JSON.parse(a.SkillsJson) : [],
      matchScore: a.AIMatchScore || 0,
      stage: a.Stage,
      appliedDate: a.AppliedDate,
      interviewDate: a.InterviewDate,
      cvUrl: a.CvUrl,
      
      // Khúc này chỉ ẩn đi không gửi viẽt JSON trả về, giữ tạm để nhóm
      _jdText: `${a.JobTitle || ''} ${a.JobDesc || ''} ${a.JobReq || ''} ${a.JobSkills || ''}`
    }));

    // TÌM CÁC HỒ SƠ CHƯA CHẤM ĐIỂM
    const unScored = applicants.filter(a => a.matchScore === 0);
    if (unScored.length > 0) {
      // Vì "employer/me" có nhiều ứng viên thuộc nhiều Job, phải GOM NHÓM theo JobId
      const groupedByJob = {};
      for (const app of unScored) {
        if (!groupedByJob[app.jobId]) groupedByJob[app.jobId] = { jdText: app._jdText, apps: [] };
        groupedByJob[app.jobId].apps.push(app);
      }
      
      const http = require('http');
      
      for (const jobId in groupedByJob) {
        const group = groupedByJob[jobId];
        const cvIdsToScore = [];
        const fallbackCvs = [];
        
        for (const x of group.apps) {
          if (x.cvId) {
            cvIdsToScore.push(x.cvId);
          } else {
            const text = `${x.title || ''} ${x.experience || ''} ${(x.skills || []).join(', ')}`;
            fallbackCvs.push({ id: x.applicationId, text });
          }
        }
        
        const postData = JSON.stringify({ 
           jd_text: group.jdText, 
           cv_ids: cvIdsToScore, 
           fallback_cvs: fallbackCvs 
        });

        const reqOptions = {
          hostname: '127.0.0.1', port: 8000, path: '/api/ai/match-jd', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };

        try {
          const aiData = await new Promise((resolve, reject) => {
            const req = http.request(reqOptions, (res) => {
              let raw = ''; res.on('data', chunk => raw += chunk);
              res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); } });
            });
            req.on('error', e => reject(e));
            req.write(postData); req.end();
          });

          if (aiData.success && aiData.scores) {
            for (const app of group.apps) {
              const trackId = app.cvId || app.applicationId;
              if (aiData.scores[trackId] !== undefined) {
                const finalScore = aiData.scores[trackId];
                await pool.request()
                  .input('Score', sql.Int, finalScore)
                  .input('AppId', sql.UniqueIdentifier, app.applicationId)
                  .query('UPDATE Applications SET AIMatchScore = @Score WHERE Id = @AppId');
                
                app.matchScore = finalScore;
              }
            }
          }
        } catch (e) {
          console.error("Lỗi AI ở Job " + jobId, e.message);
        }
      }
      // Sắp xếp lại danh sách ứng viên (Vì có nhiều Job, tuỳ ý UI. Ta sort nhẹ theo score cho tất cả)
      applicants.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    // Xoá trường tạm JD Text trước khi gửi
    applicants.forEach(a => delete a._jdText);
    
    res.json(applicants);
  } catch (err) {
    console.error('Lỗi lấy tất cả ứng viên:', err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// ────────────────────────────────────────────────
// GET /api/applications/job/:jobId  – Lấy DS ứng viên theo Job (Dành cho Employer)
// ────────────────────────────────────────────────
router.get('/job/:jobId', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền truy cập.' });

    const jobId = req.params.jobId;
    const pool = await poolPromise;

    // Kiểm tra job này có thuộc về Employer không
    const jobRes = await pool.request()
      .input('JobId', sql.UniqueIdentifier, jobId)
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query('SELECT Id, Title, Description, Requirements, SkillsReqJson FROM Jobs WHERE Id = @JobId AND EmployerId = @EmployerId');
    
    if (jobRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy Job hoặc bạn không có quyền.' });
    }
    
    // Lấy chuỗi mô tả JD Text để so sánh Semantic
    const jobData = jobRes.recordset[0];
    const jdText = `${jobData.Title || ''} ${jobData.Description || ''} ${jobData.Requirements || ''} ${jobData.SkillsReqJson || ''}`;

    // Lấy danh sách ứng viên đã nộp CV (hoặc được gợi ý)
    const appsRes = await pool.request()
      .input('JobId', sql.UniqueIdentifier, jobId)
      .query(`
        SELECT 
          a.Id AS ApplicationId,
          a.Stage,
          a.AIMatchScore,
          a.CvRead,
          a.InterviewDate,
          a.AppliedDate,
          c.UserId AS CandidateId,
          c.FullName,
          c.Title,
          c.AvatarUrl,
          c.ExperienceYears,
          c.SkillsJson,
          -- Lấy Default CV của Candidate
          (SELECT TOP 1 FileUrl FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC) AS CvUrl,
          (SELECT TOP 1 CAST(Id AS VARCHAR(50)) FROM CVs cv WHERE cv.CandidateId = c.UserId ORDER BY cv.UploadedDate DESC) AS CvId
        FROM Applications a
        INNER JOIN Candidates c ON a.CandidateId = c.UserId
        WHERE a.JobId = @JobId
        ORDER BY a.AIMatchScore DESC, a.AppliedDate DESC
      `);

    let applicants = appsRes.recordset.map(a => ({
      applicationId: a.ApplicationId,
      candidateId: a.CandidateId,
      cvId: a.CvId, // Lưu ID CV để gửi Python
      name: a.FullName,
      title: a.Title || 'Ứng viên',
      avatar: a.AvatarUrl || a.FullName.charAt(0),
      experience: a.ExperienceYears || '0 năm',
      skills: a.SkillsJson ? JSON.parse(a.SkillsJson) : [],
      matchScore: a.AIMatchScore || 0, // Bỏ random
      stage: a.Stage,
      appliedDate: a.AppliedDate,
      interviewDate: a.InterviewDate,
      isRead: !!a.CvRead,
      cvUrl: a.CvUrl,
    }));

    // BATCH UPDATE: Cập nhật Semantic Score cho các hồ sơ chưa được chấm điểm
    const unScored = applicants.filter(a => a.matchScore === 0);
    if (unScored.length > 0) {
      try {
        const cvIdsToScore = [];
        const fallbackCvs = [];
        
        for (const x of unScored) {
          if (x.cvId) {
            cvIdsToScore.push(x.cvId);
          } else {
            // NẾU LÀ MOCK DATA KHÔNG CÓ CV FILE MÀ CHỈ CÓ ENTRY: Chấm điểm dựa trên Kỹ năng và Chức danh
            const text = `${x.title || ''} ${x.experience || ''} ${(x.skills || []).join(', ')}`;
            fallbackCvs.push({ id: x.applicationId, text });
          }
        }
        
        const postData = JSON.stringify({ jd_text: jdText, cv_ids: cvIdsToScore, fallback_cvs: fallbackCvs });
        
        const http = require('http');
        const reqOptions = {
          hostname: '127.0.0.1',
          port: 8000,
          path: '/api/ai/match-jd',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const aiData = await new Promise((resolve, reject) => {
          const req = http.request(reqOptions, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
              try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
            });
          });
          req.on('error', e => reject(e));
          req.write(postData);
          req.end();
        });
        
        if (aiData.success && aiData.scores) {
          // Lưu điểm xuống Database
          for (const app of unScored) {
            const trackId = app.cvId || app.applicationId;
            if (aiData.scores[trackId] !== undefined) {
              const finalScore = aiData.scores[trackId];
              await pool.request()
                .input('Score', sql.Int, finalScore)
                .input('AppId', sql.UniqueIdentifier, app.applicationId)
                .query('UPDATE Applications SET AIMatchScore = @Score WHERE Id = @AppId');
              
              // Cập nhật lên memory response để UI hiển thị ngay lập tức
              app.matchScore = finalScore;
            }
          }
          // Sắp xếp danh sách mới nhất do điểm đã thay đổi
          applicants.sort((a, b) => b.matchScore - a.matchScore);
        }
      } catch (err) {
        console.error("AI Semantic Match Failed:", err.message);
      }
    }

    res.json(applicants);
  } catch (err) {
    console.error('Lỗi khi lấy DS ứng viên:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/applications/:id/stage  – Đổi trạng thái ứng tuyển (Dành cho Employer)
// ────────────────────────────────────────────────
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id: employerId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Không có quyền truy cập.' });

    const appId = req.params.id;
    const { stage } = req.body;
    const pool = await poolPromise;

    // Kiểm tra quyền
    const checkRes = await pool.request()
      .input('AppId', sql.UniqueIdentifier, appId)
      .input('EmployerId', sql.UniqueIdentifier, employerId)
      .query(`
        SELECT a.Id 
        FROM Applications a
        INNER JOIN Jobs j ON a.JobId = j.Id
        WHERE a.Id = @AppId AND j.EmployerId = @EmployerId
      `);
    
    if (checkRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ hoặc bạn không có quyền.' });
    }

    await pool.request()
      .input('AppId', sql.UniqueIdentifier, appId)
      .input('Stage', sql.NVarChar, stage)
      .query(`
        UPDATE Applications 
        SET Stage = @Stage, UpdatedAt = GETDATE()
        WHERE Id = @AppId
      `);

    res.json({ message: 'Đã cập nhật trạng thái hồ sơ.' });
  } catch (err) {
    console.error('Lỗi khi cập nhật trạng thái:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
