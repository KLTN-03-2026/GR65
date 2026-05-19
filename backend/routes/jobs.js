const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// ────────────────────────────────────────────────
// GET /api/jobs  – Lấy danh sách công việc (public)
// Query params: ?category=&location=&type=&q=
// ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, location, type, q } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT
        j.Id,
        j.Title,
        j.Location,
        j.JobType,
        j.SalaryRange,
        j.ExperienceReq,
        j.SkillsReqJson,
        j.Description,
        j.Requirements,
        j.Benefits,
        j.Category,
        j.IsFeatured,
        j.Status,
        j.PostedDate,
        j.Deadline,
        e.CompanyName,
        e.LogoUrl,
        e.Industry,
        -- Đếm số lượt ứng tuyển
        (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount
      FROM Jobs j
      INNER JOIN Employers e ON j.EmployerId = e.UserId
      WHERE j.Status = 'active'
    `;

    const request = pool.request();

    if (q) {
      query += ` AND (j.Title LIKE @q OR e.CompanyName LIKE @q OR j.Description LIKE @q)`;
      request.input('q', sql.NVarChar, `%${q}%`);
    }
    if (category && category !== 'Tất cả') {
      query += ` AND j.Category = @category`;
      request.input('category', sql.NVarChar, category);
    }
    if (location && location !== 'Tất cả địa điểm') {
      query += ` AND j.Location LIKE @location`;
      request.input('location', sql.NVarChar, `%${location}%`);
    }
    if (type && type !== 'Tất cả loại') {
      query += ` AND j.JobType = @type`;
      request.input('type', sql.NVarChar, type);
    }

    query += ` ORDER BY j.IsFeatured DESC, j.PostedDate DESC`;

    const result = await request.query(query);

    const jobs = result.recordset.map(j => ({
      id: j.Id,
      title: j.Title,
      company: j.CompanyName,
      companyLogo: j.LogoUrl || j.CompanyName?.charAt(0) || '?',
      location: j.Location || '',
      type: j.JobType || 'Full-time',
      salary: j.SalaryRange || 'Thương lượng',
      experience: j.ExperienceReq || '',
      skills: j.SkillsReqJson ? JSON.parse(j.SkillsReqJson) : [],
      description: j.Description || '',
      requirements: j.Requirements
        ? (typeof j.Requirements === 'string' && j.Requirements.startsWith('[')
          ? JSON.parse(j.Requirements)
          : j.Requirements.split('\n').filter(Boolean))
        : [],
      benefits: j.Benefits
        ? (typeof j.Benefits === 'string' && j.Benefits.startsWith('[')
          ? JSON.parse(j.Benefits)
          : j.Benefits.split('\n').filter(Boolean))
        : [],
      category: j.Category || '',
      featured: !!j.IsFeatured,
      status: j.Status,
      postedDate: j.PostedDate,
      deadline: j.Deadline
        ? new Date(j.Deadline).toLocaleDateString('vi-VN')
        : 'Không xác định',
      applicants: j.ApplicantCount || 0,
      views: 0, // Có thể thêm bảng JobViews sau
      aiMatchScore: 0, // Sẽ tính sau khi có AI
    }));

    res.json({ jobs, total: jobs.length });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách jobs:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// GET /api/jobs/employer/me – Lấy các job của công ty
// ────────────────────────────────────────────────
router.get('/employer/me', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền này.' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('EmployerId', sql.UniqueIdentifier, id)
      .query(`
        SELECT j.*,
          (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount,
          (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id AND a.ApplicationType = 'ai_suggested') as aiSuggestedCount
        FROM Jobs j
        WHERE j.EmployerId = @EmployerId
        ORDER BY j.CreatedAt DESC
      `);

    const jobs = result.recordset.map(j => ({
      id: j.Id,
      title: j.Title,
      location: j.Location || '',
      type: j.JobType || 'Full-time',
      salary: j.SalaryRange || 'Thương lượng',
      experience: j.ExperienceReq || '',
      skills: j.SkillsReqJson ? JSON.parse(j.SkillsReqJson) : [],
      description: j.Description || '',
      requirements: j.Requirements ? JSON.parse(j.Requirements) : [],
      benefits: j.Benefits ? JSON.parse(j.Benefits) : [],
      category: j.Category || '',
      featured: !!j.IsFeatured,
      status: j.Status,
      postedDate: j.PostedDate,
      deadline: j.Deadline ? new Date(j.Deadline).toLocaleDateString('vi-VN') : 'Không xác định',
      applicants: j.ApplicantCount || 0,
      aiSuggestedCount: j.aiSuggestedCount || 0,
      views: 0
    }));

    res.json({ jobs, total: jobs.length });
  } catch (err) {
    console.error('Lỗi khi lấy jobs của employer:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// POST /api/jobs – Đăng bài tuyển dụng
// ────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền đăng.' });

    const { title, location, type, salary, experience, skills, description, requirements, benefits, category } = req.body;
    const pool = await poolPromise;

    const jobId = require('crypto').randomUUID();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, jobId)
      .input('EmployerId', sql.UniqueIdentifier, id)
      .input('Title', sql.NVarChar, title || '')
      .input('Location', sql.NVarChar, location || '')
      .input('JobType', sql.NVarChar, type || 'Full-time')
      .input('SalaryRange', sql.NVarChar, salary || '')
      .input('ExperienceReq', sql.NVarChar, experience || '')
      .input('SkillsReqJson', sql.NVarChar, JSON.stringify(skills || []))
      .input('Description', sql.NVarChar, description || '')
      .input('Requirements', sql.NVarChar, JSON.stringify(requirements || []))
      .input('Benefits', sql.NVarChar, JSON.stringify(benefits || []))
      .input('Category', sql.NVarChar, category || 'Khác')
      .query(`
        INSERT INTO Jobs (Id, EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, SkillsReqJson, Description, Requirements, Benefits, Category, Status, PostedDate, CreatedAt)
        VALUES (@Id, @EmployerId, @Title, @Location, @JobType, @SalaryRange, @ExperienceReq, @SkillsReqJson, @Description, @Requirements, @Benefits, @Category, 'pending', GETDATE(), GETDATE())
      `);

    await logActivity(id, 'POST_JOB', 'Job', jobId, `Employer posted a new job: ${title}`);
    res.status(201).json({ message: 'Tạo công việc thành công! Bài đăng đang chờ Admin kiểm duyệt trước khi hiển thị.', jobId });
  } catch (err) {
    console.error('Lỗi tao job:', err.message || err);
    res.status(500).json({ message: err.message || 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/jobs/:id – Sửa bài tuyển dụng
// ────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền.' });

    const { title, location, type, salary, experience, skills, description, requirements, benefits, category } = req.body;
    const jobId = req.params.id;
    const pool = await poolPromise;

    // Check ownership
    const check = await pool.request()
      .input('Id', sql.UniqueIdentifier, jobId)
      .input('EmployerId', sql.UniqueIdentifier, empId)
      .query('SELECT Id FROM Jobs WHERE Id = @Id AND EmployerId = @EmployerId');
    if (check.recordset.length === 0) return res.status(403).json({ message: 'Không có quyền sửa bài đăng này.' });

    await pool.request()
      .input('Id', sql.UniqueIdentifier, jobId)
      .input('Title', sql.NVarChar, title)
      .input('Location', sql.NVarChar, location)
      .input('JobType', sql.NVarChar, type)
      .input('SalaryRange', sql.NVarChar, salary)
      .input('ExperienceReq', sql.NVarChar, experience)
      .input('SkillsReqJson', sql.NVarChar, JSON.stringify(skills || []))
      .input('Description', sql.NVarChar, description)
      .input('Requirements', sql.NVarChar, JSON.stringify(requirements || []))
      .input('Benefits', sql.NVarChar, JSON.stringify(benefits || []))
      .input('Category', sql.NVarChar, category)
      .query(`
        UPDATE Jobs SET
          Title = @Title, Location = @Location, JobType = @JobType, SalaryRange = @SalaryRange,
          ExperienceReq = @ExperienceReq, SkillsReqJson = @SkillsReqJson, Description = @Description,
          Requirements = @Requirements, Benefits = @Benefits, Category = @Category, UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);

    res.json({ message: 'Cập nhật thành công!' });
  } catch (err) {
    console.error('Lỗi sua job:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// PATCH /api/jobs/:id/status – Đổi trạng thái 
// ────────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Forbidden' });
    const jobId = req.params.id;
    const { status } = req.body; // 'active', 'closed'

    const pool = await poolPromise;
    const check = await pool.request().input('Id', sql.UniqueIdentifier, jobId).input('EmployerId', sql.UniqueIdentifier, empId)
      .query('SELECT Id FROM Jobs WHERE Id = @Id AND EmployerId = @EmployerId');
    if (check.recordset.length === 0) return res.status(403).json({ message: 'Không có quyền.' });

    await pool.request().input('Id', sql.UniqueIdentifier, jobId).input('Status', sql.NVarChar, status)
      .query("UPDATE Jobs SET Status = @Status, UpdatedAt = GETDATE() WHERE Id = @Id");

    res.json({ message: 'Đổi trạng thái thành công!' });
  } catch (err) { res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// ────────────────────────────────────────────────
// DELETE /api/jobs/:id – Yêu cầu 2: Giải pháp thực tế Xóa / Đóng
// ────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Forbidden' });
    const jobId = req.params.id;

    const pool = await poolPromise;
    const check = await pool.request().input('Id', sql.UniqueIdentifier, jobId).input('EmployerId', sql.UniqueIdentifier, empId)
      .query('SELECT Id FROM Jobs WHERE Id = @Id AND EmployerId = @EmployerId');
    if (check.recordset.length === 0) return res.status(403).json({ message: 'Không có quyền.' });

    // Giải pháp thực tế: Nếu đã có người nộp CV -> Ràng buộc không cho xóa, chỉ cho Closed
    const apps = await pool.request().input('JobId', sql.UniqueIdentifier, jobId)
      .query('SELECT COUNT(*) as AppCount FROM Applications WHERE JobId = @JobId');

    if (apps.recordset[0].AppCount > 0) {
      // Đã có ứng viên, tự động chuyển về trạng thái mồ côi 'closed' thay vì DELETE
      await pool.request().input('Id', sql.UniqueIdentifier, jobId)
        .query("UPDATE Jobs SET Status = 'closed', UpdatedAt = GETDATE() WHERE Id = @Id");
      return res.json({ message: 'Đã có người nộp CV. Hệ thống tự động chuyển Trạng thái thành Đã đóng (Giữ lại Data gốc).' });
    } else {
      // Xóa hoàn toàn nếu chưa ai nộp (Rác nhà)
      await pool.request().input('Id', sql.UniqueIdentifier, jobId).query("DELETE FROM Jobs WHERE Id = @Id");
      return res.json({ message: 'Đã xóa bài tuyển dụng vĩnh viễn (Chưa có ai nộp).' });
    }
  } catch (err) { res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// ────────────────────────────────────────────────
// GET /api/jobs/:id  – Lấy chi tiết 1 công việc (public)
// ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT
          j.Id, j.Title, j.Location, j.JobType, j.SalaryRange,
          j.ExperienceReq, j.SkillsReqJson, j.Description,
          j.Requirements, j.Benefits, j.Category, j.IsFeatured,
          j.Status, j.PostedDate, j.Deadline,
          e.CompanyName, e.LogoUrl, e.Industry, e.Website, e.Description AS CompanyDesc,
          (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount
        FROM Jobs j
        INNER JOIN Employers e ON j.EmployerId = e.UserId
        WHERE j.Id = @Id
      `);

    const j = result.recordset[0];
    if (!j) return res.status(404).json({ message: 'Không tìm thấy công việc.' });

    res.json({
      id: j.Id,
      title: j.Title,
      company: j.CompanyName,
      companyLogo: j.LogoUrl || j.CompanyName?.charAt(0) || '?',
      companyWebsite: j.Website,
      companyDesc: j.CompanyDesc,
      industry: j.Industry,
      location: j.Location || '',
      type: j.JobType || 'Full-time',
      salary: j.SalaryRange || 'Thương lượng',
      experience: j.ExperienceReq || '',
      skills: j.SkillsReqJson ? JSON.parse(j.SkillsReqJson) : [],
      description: j.Description || '',
      requirements: j.Requirements
        ? (typeof j.Requirements === 'string' && j.Requirements.startsWith('[')
          ? JSON.parse(j.Requirements)
          : j.Requirements.split('\n').filter(Boolean))
        : [],
      benefits: j.Benefits
        ? (typeof j.Benefits === 'string' && j.Benefits.startsWith('[')
          ? JSON.parse(j.Benefits)
          : j.Benefits.split('\n').filter(Boolean))
        : [],
      category: j.Category || '',
      featured: !!j.IsFeatured,
      status: j.Status,
      postedDate: j.PostedDate,
      deadline: j.Deadline
        ? new Date(j.Deadline).toLocaleDateString('vi-VN')
        : 'Không xác định',
      applicants: j.ApplicantCount || 0,
      views: 0,
      aiMatchScore: 0,
    });
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết job:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// POST /api/jobs/:id/apply  – Ứng tuyển (cần đăng nhập)
// ────────────────────────────────────────────────
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { id: candidateId, role } = req.user;
    if (role !== 'Candidate') {
      return res.status(403).json({ message: 'Chỉ ứng viên mới có thể ứng tuyển.' });
    }

    const jobId = req.params.id;
    const pool = await poolPromise;

    // Kiểm tra job tồn tại & còn mở
    const jobRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, jobId)
      .query(`SELECT Id, Status FROM Jobs WHERE Id = @Id`);
    const job = jobRes.recordset[0];
    if (!job) return res.status(404).json({ message: 'Không tìm thấy công việc.' });
    if (job.Status !== 'active') return res.status(400).json({ message: 'Công việc đã đóng.' });

    // Kiểm tra đã ứng tuyển chưa
    const dupRes = await pool.request()
      .input('JobId', sql.UniqueIdentifier, jobId)
      .input('CandidateId', sql.UniqueIdentifier, candidateId)
      .query(`SELECT Id FROM Applications WHERE JobId = @JobId AND CandidateId = @CandidateId`);
    if (dupRes.recordset.length > 0) {
      return res.status(400).json({ message: 'Bạn đã ứng tuyển công việc này rồi.' });
    }

    // Tạo đơn ứng tuyển
    const appId = require('crypto').randomUUID();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, appId)
      .input('JobId', sql.UniqueIdentifier, jobId)
      .input('CandidateId', sql.UniqueIdentifier, candidateId)
      .query(`
        INSERT INTO Applications (Id, JobId, CandidateId, Stage, ApplicationType, AppliedDate, UpdatedAt)
        VALUES (@Id, @JobId, @CandidateId, 'pending', 'applied', GETDATE(), GETDATE())
      `);

    await logActivity(candidateId, 'APPLY_JOB', 'Application', appId, `Candidate applied for job ID: ${jobId}`);
    res.json({ message: 'Ứng tuyển thành công!' });
  } catch (err) {
    console.error('Lỗi khi ứng tuyển:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
