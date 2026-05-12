const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// GET /api/jobs – public
router.get('/', async (req, res) => {
  try {
    const { category, location, type, q } = req.query;
    let query = `SELECT j.Id, j.Title, j.Location, j.JobType, j.SalaryRange, j.ExperienceReq, j.SkillsReqJson, j.Description, j.Requirements, j.Benefits, j.Category, j.IsFeatured, j.Status, j.PostedDate, j.Deadline, e.CompanyName, e.LogoUrl, e.Industry, (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount FROM Jobs j INNER JOIN Employers e ON j.EmployerId = e.UserId WHERE j.Status = 'active'`;
    const params = [];
    let paramIdx = 1;
    if (q) { query += ` AND (j.Title ILIKE $${paramIdx} OR e.CompanyName ILIKE $${paramIdx} OR j.Description ILIKE $${paramIdx})`; params.push(`%${q}%`); paramIdx++; }
    if (category && category !== 'Tất cả') { query += ` AND j.Category = $${paramIdx}`; params.push(category); paramIdx++; }
    if (location && location !== 'Tất cả địa điểm') { query += ` AND j.Location ILIKE $${paramIdx}`; params.push(`%${location}%`); paramIdx++; }
    if (type && type !== 'Tất cả loại') { query += ` AND j.JobType = $${paramIdx}`; params.push(type); paramIdx++; }
    query += ' ORDER BY j.IsFeatured DESC, j.PostedDate DESC';
    const result = await pool.query(query, params);
    const jobs = result.rows.map(j => ({
      id: j.id, title: j.title, company: j.companyname, companyLogo: j.logourl || j.companyname?.charAt(0) || '?',
      location: j.location || '', type: j.jobtype || 'Full-time', salary: j.salaryrange || 'Thương lượng',
      experience: j.experiencereq || '', skills: j.skillsreqjson ? JSON.parse(j.skillsreqjson) : [],
      description: j.description || '',
      requirements: j.requirements ? (typeof j.requirements === 'string' && j.requirements.startsWith('[') ? JSON.parse(j.requirements) : j.requirements.split('\n').filter(Boolean)) : [],
      benefits: j.benefits ? (typeof j.benefits === 'string' && j.benefits.startsWith('[') ? JSON.parse(j.benefits) : j.benefits.split('\n').filter(Boolean)) : [],
      category: j.category || '', featured: !!j.isfeatured, status: j.status, postedDate: j.posteddate,
      deadline: j.deadline ? new Date(j.deadline).toLocaleDateString('vi-VN') : 'Không xác định',
      applicants: parseInt(j.applicantcount) || 0, views: 0, aiMatchScore: 0,
    }));
    res.json({ jobs, total: jobs.length });
  } catch (err) { console.error('Lỗi khi lấy danh sách jobs:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// GET /api/jobs/employer/me
router.get('/employer/me', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền này.' });
    const result = await pool.query(
      `SELECT j.*, (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount,
       (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id AND a.ApplicationType = 'ai_suggested') as aisuggestedcount
       FROM Jobs j WHERE j.EmployerId = $1 ORDER BY j.CreatedAt DESC`, [id]);
    const jobs = result.rows.map(j => ({
      id: j.id, title: j.title, location: j.location || '', type: j.jobtype || 'Full-time',
      salary: j.salaryrange || 'Thương lượng', experience: j.experiencereq || '',
      skills: j.skillsreqjson ? JSON.parse(j.skillsreqjson) : [], description: j.description || '',
      requirements: j.requirements ? JSON.parse(j.requirements) : [], benefits: j.benefits ? JSON.parse(j.benefits) : [],
      category: j.category || '', featured: !!j.isfeatured, status: j.status, postedDate: j.posteddate,
      deadline: j.deadline ? new Date(j.deadline).toLocaleDateString('vi-VN') : 'Không xác định',
      applicants: parseInt(j.applicantcount) || 0, aiSuggestedCount: parseInt(j.aisuggestedcount) || 0, views: 0
    }));
    res.json({ jobs, total: jobs.length });
  } catch (err) { console.error('Lỗi khi lấy jobs của employer:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// POST /api/jobs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền đăng.' });
    const { title, location, type, salary, experience, skills, description, requirements, benefits, category } = req.body;
    const jobId = require('crypto').randomUUID();
    await pool.query(
      `INSERT INTO Jobs (Id, EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, SkillsReqJson, Description, Requirements, Benefits, Category, Status, CreatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW())`,
      [jobId, id, title, location, type, salary, experience, JSON.stringify(skills||[]), description, JSON.stringify(requirements||[]), JSON.stringify(benefits||[]), category]
    );
    await logActivity(id, 'POST_JOB', 'Job', jobId, `Employer posted a new job: ${title}`);
    res.status(201).json({ message: 'Tạo công việc thành công!', jobId });
  } catch (err) { console.error('Lỗi tao job:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PUT /api/jobs/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Chỉ công ty mới có quyền.' });
    const { title, location, type, salary, experience, skills, description, requirements, benefits, category } = req.body;
    const jobId = req.params.id;
    const check = await pool.query('SELECT Id FROM Jobs WHERE Id = $1 AND EmployerId = $2', [jobId, empId]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền sửa bài đăng này.' });
    await pool.query(
      `UPDATE Jobs SET Title=$1, Location=$2, JobType=$3, SalaryRange=$4, ExperienceReq=$5, SkillsReqJson=$6, Description=$7, Requirements=$8, Benefits=$9, Category=$10, UpdatedAt=NOW() WHERE Id=$11`,
      [title, location, type, salary, experience, JSON.stringify(skills||[]), description, JSON.stringify(requirements||[]), JSON.stringify(benefits||[]), category, jobId]
    );
    res.json({ message: 'Cập nhật thành công!' });
  } catch (err) { console.error('Lỗi sua job:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PATCH /api/jobs/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Forbidden' });
    const jobId = req.params.id;
    const { status } = req.body;
    const check = await pool.query('SELECT Id FROM Jobs WHERE Id = $1 AND EmployerId = $2', [jobId, empId]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền.' });
    await pool.query("UPDATE Jobs SET Status = $1, UpdatedAt = NOW() WHERE Id = $2", [status, jobId]);
    res.json({ message: 'Đổi trạng thái thành công!' });
  } catch (err) { res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// DELETE /api/jobs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: empId, role } = req.user;
    if (role !== 'Employer') return res.status(403).json({ message: 'Forbidden' });
    const jobId = req.params.id;
    const check = await pool.query('SELECT Id FROM Jobs WHERE Id = $1 AND EmployerId = $2', [jobId, empId]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền.' });
    const apps = await pool.query('SELECT COUNT(*) as appcount FROM Applications WHERE JobId = $1', [jobId]);
    if (parseInt(apps.rows[0].appcount) > 0) {
      await pool.query("UPDATE Jobs SET Status = 'closed', UpdatedAt = NOW() WHERE Id = $1", [jobId]);
      return res.json({ message: 'Đã có người nộp CV. Hệ thống tự động chuyển Trạng thái thành Đã đóng.' });
    } else {
      await pool.query("DELETE FROM Jobs WHERE Id = $1", [jobId]);
      return res.json({ message: 'Đã xóa bài tuyển dụng vĩnh viễn.' });
    }
  } catch (err) { res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// GET /api/jobs/:id – public
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.Id, j.Title, j.Location, j.JobType, j.SalaryRange, j.ExperienceReq, j.SkillsReqJson, j.Description, j.Requirements, j.Benefits, j.Category, j.IsFeatured, j.Status, j.PostedDate, j.Deadline, e.CompanyName, e.LogoUrl, e.Industry, e.Website, e.Description AS CompanyDesc, (SELECT COUNT(*) FROM Applications a WHERE a.JobId = j.Id) AS ApplicantCount FROM Jobs j INNER JOIN Employers e ON j.EmployerId = e.UserId WHERE j.Id = $1`, [req.params.id]);
    const j = result.rows[0];
    if (!j) return res.status(404).json({ message: 'Không tìm thấy công việc.' });
    res.json({
      id: j.id, title: j.title, company: j.companyname, companyLogo: j.logourl || j.companyname?.charAt(0) || '?',
      companyWebsite: j.website, companyDesc: j.companydesc, industry: j.industry,
      location: j.location || '', type: j.jobtype || 'Full-time', salary: j.salaryrange || 'Thương lượng',
      experience: j.experiencereq || '', skills: j.skillsreqjson ? JSON.parse(j.skillsreqjson) : [],
      description: j.description || '',
      requirements: j.requirements ? (typeof j.requirements === 'string' && j.requirements.startsWith('[') ? JSON.parse(j.requirements) : j.requirements.split('\n').filter(Boolean)) : [],
      benefits: j.benefits ? (typeof j.benefits === 'string' && j.benefits.startsWith('[') ? JSON.parse(j.benefits) : j.benefits.split('\n').filter(Boolean)) : [],
      category: j.category || '', featured: !!j.isfeatured, status: j.status, postedDate: j.posteddate,
      deadline: j.deadline ? new Date(j.deadline).toLocaleDateString('vi-VN') : 'Không xác định',
      applicants: parseInt(j.applicantcount) || 0, views: 0, aiMatchScore: 0,
    });
  } catch (err) { console.error('Lỗi khi lấy chi tiết job:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// POST /api/jobs/:id/apply
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { id: candidateId, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Chỉ ứng viên mới có thể ứng tuyển.' });
    const jobId = req.params.id;
    const jobRes = await pool.query('SELECT Id, Status FROM Jobs WHERE Id = $1', [jobId]);
    const job = jobRes.rows[0];
    if (!job) return res.status(404).json({ message: 'Không tìm thấy công việc.' });
    if (job.status !== 'active') return res.status(400).json({ message: 'Công việc đã đóng.' });
    const dupRes = await pool.query('SELECT Id FROM Applications WHERE JobId = $1 AND CandidateId = $2', [jobId, candidateId]);
    if (dupRes.rows.length > 0) return res.status(400).json({ message: 'Bạn đã ứng tuyển công việc này rồi.' });
    const appId = require('crypto').randomUUID();
    await pool.query(
      `INSERT INTO Applications (Id, JobId, CandidateId, Stage, ApplicationType, AppliedDate, UpdatedAt)
       VALUES ($1, $2, $3, 'pending', 'applied', NOW(), NOW())`, [appId, jobId, candidateId]);
    await logActivity(candidateId, 'APPLY_JOB', 'Application', appId, `Candidate applied for job ID: ${jobId}`);
    res.json({ message: 'Ứng tuyển thành công!' });
  } catch (err) { console.error('Lỗi khi ứng tuyển:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

module.exports = router;
