const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

/**
 * Middleware to ensure user is Admin
 */
const requireAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'Admin') {
      next();
    } else {
      console.warn(`Unauthorized admin access attempt by user: ${req.user?.id}, role: ${req.user?.role}`);
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối. Yêu cầu quyền Admin.' });
    }
  } catch (err) {
    console.error('Error in requireAdmin middleware:', err);
    res.status(500).json({ success: false, message: 'Lỗi xác thực quyền admin.' });
  }
};

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(requireAdmin);

// ==========================================
// 1. DASHBOARD & STATISTICS
// ==========================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get overall system statistics for dashboard
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 */
router.get('/dashboard', async (req, res) => {
  try {
    const pool = await poolPromise;
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM Users) as totalUsers,
        (SELECT COUNT(*) FROM Jobs WHERE Status = 'active') as activeJobs,
        (SELECT COUNT(*) FROM Applications) as totalApplications,
        (SELECT COUNT(*) FROM Applications WHERE Stage = 'offer') as successfulHires,
        (SELECT COUNT(*) FROM CVs WHERE AIParsed = 1) as aiProcessed,
        (SELECT COUNT(*) FROM Users WHERE Role = 'Employer') as totalEmployers
    `;
    const result = await pool.request().query(statsQuery);
    const stats = result.recordset[0];
    res.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers,
        activeJobs: stats.activeJobs,
        totalApplications: stats.totalApplications,
        successfulHires: stats.successfulHires,
        aiProcessed: stats.aiProcessed,
        totalEmployers: stats.totalEmployers,
        monthlyGrowth: { users: 12.5, jobs: 8.2, applications: 15.3, hires: 5.1 },
        aiAccuracy: 89,
        aiImprovement: 2.4
      }
    });
  } catch (err) {
    console.error('Error in GET /admin/dashboard:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu dashboard.' });
  }
});

/**
 * @swagger
 * /api/admin/stats/growth:
 *   get:
 *     summary: Get user growth data by month
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Growth data retrieved successfully
 */
router.get('/stats/growth', async (req, res) => {
  try {
    const pool = await poolPromise;
    const growthQuery = `
      SELECT FORMAT(CreatedAt, 'yyyy-MM') as Month, COUNT(*) as Count
      FROM Users WHERE CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY FORMAT(CreatedAt, 'yyyy-MM') ORDER BY Month ASC
    `;
    const result = await pool.request().query(growthQuery);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/stats/growth:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu tăng trưởng.' });
  }
});

/**
 * @swagger
 * /api/admin/stats/jobs:
 *   get:
 *     summary: Detailed job statistics by status and time
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed job stats retrieved successfully
 */
router.get('/stats/jobs', async (req, res) => {
  try {
    const pool = await poolPromise;
    const statusStats = await pool.request().query(`SELECT Status, COUNT(*) as Count FROM Jobs GROUP BY Status`);
    const timeStats = await pool.request().query(`
      SELECT FORMAT(CreatedAt, 'yyyy-MM') as Month, COUNT(*) as Count
      FROM Jobs WHERE CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY FORMAT(CreatedAt, 'yyyy-MM') ORDER BY Month ASC
    `);
    const categoryStats = await pool.request().query(`SELECT Category, COUNT(*) as Count FROM Jobs GROUP BY Category`);
    res.json({ success: true, data: { byStatus: statusStats.recordset, byTime: timeStats.recordset, byCategory: categoryStats.recordset } });
  } catch (err) {
    console.error('Error in GET /admin/stats/jobs:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê bài tuyển dụng.' });
  }
});

/**
 * @swagger
 * /api/admin/stats/moderation:
 *   get:
 *     summary: Get moderation statistics for Jobs and CVs
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderation statistics retrieved successfully
 */
router.get('/stats/moderation', async (req, res) => {
  try {
    const pool = await poolPromise;
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Jobs WHERE Status = 'active') as approvedJobs,
        (SELECT COUNT(*) FROM Jobs WHERE Status = 'pending') as pendingJobs,
        (SELECT COUNT(*) FROM Jobs WHERE Status = 'rejected') as rejectedJobs,
        (SELECT COUNT(*) FROM CVs WHERE Status = 'approved') as approvedCVs,
        (SELECT COUNT(*) FROM CVs WHERE Status = 'pending') as pendingCVs,
        (SELECT COUNT(*) FROM CVs WHERE Status = 'rejected') as rejectedCVs
    `);
    res.json({ success: true, data: stats.recordset[0] });
  } catch (err) {
    console.error('Error in GET /admin/stats/moderation:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê kiểm duyệt.' });
  }
});

/**
 * @swagger
 * /api/admin/ai-stats:
 *   get:
 *     summary: Get AI processing statistics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI statistics retrieved successfully
 */
router.get('/ai-stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT COUNT(*) as totalCVs, SUM(CASE WHEN AIParsed = 1 THEN 1 ELSE 0 END) as parsedCVs, AVG(CAST(AIScore AS FLOAT)) as averageScore FROM CVs");
    const stats = result.recordset[0];
    res.json({ 
      success: true, 
      data: { 
        totalCVs: stats.totalCVs || 0, parsedCVs: stats.parsedCVs || 0, 
        averageScore: stats.averageScore ? Math.round(stats.averageScore * 100) / 100 : 0, 
        radarData: [{ skill: "CV Parsing", accuracy: 92 }, { skill: "JD Analysis", accuracy: 88 }, { skill: "Skill Matching", accuracy: 85 }, { skill: "Scoring", accuracy: 89 }, { skill: "Ranking", accuracy: 87 }] 
      } 
    });
  } catch (err) {
    console.error('Error in GET /admin/ai-stats:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê AI.' });
  }
});

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get users with pagination and filtering
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [Candidate, Employer, Admin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, suspended, pending] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of users with pagination info
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    let whereClause = "WHERE 1=1";
    if (role) {
      whereClause += " AND u.Role = @role";
      request.input('role', sql.NVarChar, role);
    }
    if (status) {
      whereClause += " AND (CASE WHEN u.Role = 'Candidate' THEN c.Status WHEN u.Role = 'Employer' THEN e.Status ELSE 'active' END) = @status";
      request.input('status', sql.NVarChar, status);
    }
    if (search) {
      whereClause += " AND (u.Email LIKE @search OR c.FullName LIKE @search OR e.CompanyName LIKE @search)";
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) as total FROM Users u LEFT JOIN Candidates c ON u.Id = c.UserId LEFT JOIN Employers e ON u.Id = e.UserId ${whereClause}`;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT u.Id, u.Email, u.Role, u.CreatedAt, u.AuthProvider,
        CASE WHEN u.Role = 'Candidate' THEN ISNULL(c.FullName, u.Email)
             WHEN u.Role = 'Employer' THEN ISNULL(e.CompanyName, u.Email)
             ELSE u.Email END as DisplayName,
        CASE WHEN u.Role = 'Candidate' THEN ISNULL(c.Status, 'active')
             WHEN u.Role = 'Employer' THEN ISNULL(e.Status, 'active')
             ELSE 'active' END as Status,
        CASE WHEN u.Role = 'Candidate' THEN c.AvatarUrl
             WHEN u.Role = 'Employer' THEN e.LogoUrl
             ELSE NULL END as AvatarUrl
      FROM Users u
      LEFT JOIN Candidates c ON u.Id = c.UserId
      LEFT JOIN Employers e ON u.Id = e.UserId
      ${whereClause}
      ORDER BY u.CreatedAt DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;
    
    const result = await request.query(query);
    res.json({ success: true, data: result.recordset, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error in GET /admin/users:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người dùng.' });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin functionality)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [Candidate, Employer, Admin] }
 *               fullName: { type: string }
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', async (req, res) => {
  const { email, password, role, fullName } = req.body;
  try {
    const pool = await poolPromise;
    const check = await pool.request().input('Email', sql.NVarChar, email).query("SELECT Id FROM Users WHERE Email = @Email");
    if (check.recordset.length > 0) return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = require('crypto').randomUUID();

    await pool.request()
      .input('Id', sql.UniqueIdentifier, userId).input('Email', sql.NVarChar, email)
      .input('PasswordHash', sql.NVarChar, hashedPassword).input('Role', sql.NVarChar, role)
      .query("INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt) VALUES (@Id, @Email, @PasswordHash, @Role, GETDATE(), GETDATE())");

    if (role === 'Candidate') {
      await pool.request().input('Id', sql.UniqueIdentifier, userId).input('Name', sql.NVarChar, fullName || 'New Candidate').query("INSERT INTO Candidates (UserId, FullName, Status) VALUES (@Id, @Name, 'active')");
    } else if (role === 'Employer') {
      await pool.request().input('Id', sql.UniqueIdentifier, userId).input('Name', sql.NVarChar, fullName || 'New Company').query("INSERT INTO Employers (UserId, CompanyName, Status) VALUES (@Id, @Name, 'active')");
    }
    
    await logActivity(req.user.id, 'ADMIN_CREATE_USER', 'User', userId, `Admin created ${role}: ${email}`);
    res.status(201).json({ success: true, message: 'Người dùng đã được tạo.', userId });
  } catch (err) {
    console.error('Error in POST /admin/users:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo người dùng.' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get detailed information about a specific user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 */
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const userResult = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT Id, Email, Role, CreatedAt, AuthProvider FROM Users WHERE Id = @id");
    if (userResult.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    
    const user = userResult.recordset[0];
    let profile = null;
    
    if (user.Role === 'Candidate') {
      const candidateResult = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT * FROM Candidates WHERE UserId = @id");
      profile = candidateResult.recordset[0];
      const cvsResult = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT * FROM CVs WHERE CandidateId = @id");
      profile.cvs = cvsResult.recordset;
    } else if (user.Role === 'Employer') {
      const employerResult = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT * FROM Employers WHERE UserId = @id");
      profile = employerResult.recordset[0];
      const jobsResult = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT * FROM Jobs WHERE EmployerId = @id");
      profile.jobs = jobsResult.recordset;
    }
    
    res.json({ success: true, user, profile });
  } catch (err) {
    console.error('Error in GET /admin/users/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin chi tiết người dùng.' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Lock/Unlock user account
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [active, suspended] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const pool = await poolPromise;
    const user = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT Role FROM Users WHERE Id = @id");
    if (user.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    
    const role = user.recordset[0].Role;
    let query = role === 'Candidate' ? "UPDATE Candidates SET Status = @status WHERE UserId = @id" :
                role === 'Employer' ? "UPDATE Employers SET Status = @status WHERE UserId = @id" : "";
    
    if (query) await pool.request().input('id', sql.UniqueIdentifier, id).input('status', sql.NVarChar, status).query(query);
    
    await logActivity(req.user.id, 'ADMIN_UPDATE_USER_STATUS', 'User', id, `Changed status to ${status}`);
    res.json({ success: true, message: `Tài khoản đã được cập nhật trạng thái: ${status}` });
  } catch (err) {
    console.error('Error in PATCH /admin/users/:id/status:', err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái.' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query("DELETE FROM Users WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    
    await logActivity(req.user.id, 'ADMIN_DELETE_USER', 'User', id, `Deleted user ${id}`);
    res.json({ success: true, message: 'Người dùng đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in DELETE /admin/users/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa người dùng.' });
  }
});

/**
 * @swagger
 * /api/admin/search/users:
 *   get:
 *     summary: Advanced search for users
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search/users', async (req, res) => {
  const { q } = req.query;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('q', sql.NVarChar, `%${q}%`).query(`
      SELECT u.Id, u.Email, u.Role, ISNULL(c.FullName, e.CompanyName) as DisplayName 
      FROM Users u LEFT JOIN Candidates c ON u.Id = c.UserId LEFT JOIN Employers e ON u.Id = e.UserId 
      WHERE u.Email LIKE @q OR c.FullName LIKE @q OR e.CompanyName LIKE @q
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/search/users:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm người dùng.' });
  }
});

/**
 * @swagger
 * /api/admin/employers/{id}/credits:
 *   put:
 *     summary: Manage credits for an employer
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Credits updated successfully
 */
router.put('/employers/:id/credits', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ success: false, message: 'Số lượng credit phải là một con số.' });
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).input('amount', sql.Int, amount).query("UPDATE Employers SET Credits = Credits + @amount WHERE UserId = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà tuyển dụng.' });
    
    await logActivity(req.user.id, 'ADMIN_UPDATE_CREDITS', 'User', id, `Updated credits by ${amount}`);
    res.json({ success: true, message: `Đã cập nhật ${amount} credits cho nhà tuyển dụng.` });
  } catch (err) {
    console.error('Error in PUT /admin/employers/:id/credits:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật credits.' });
  }
});

// ==========================================
// 3. JOB MODERATION & MANAGEMENT
// ==========================================

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: Get all jobs with pagination, filtering and search
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, closed, draft, pending, rejected] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 */
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const offset = (page - 1) * limit;
    const pool = await poolPromise;
    const request = pool.request();
    
    let whereClause = "WHERE 1=1";
    if (status) { whereClause += " AND j.Status = @status"; request.input('status', sql.NVarChar, status); }
    if (category) { whereClause += " AND j.Category = @category"; request.input('category', sql.NVarChar, category); }
    if (search) { whereClause += " AND (j.Title LIKE @search OR e.CompanyName LIKE @search)"; request.input('search', sql.NVarChar, `%${search}%`); }

    const countRes = await request.query(`SELECT COUNT(*) as total FROM Jobs j JOIN Employers e ON j.EmployerId = e.UserId ${whereClause}`);
    const total = countRes.recordset[0].total;

    const result = await request.query(`
      SELECT j.Id, j.Title, j.Location, j.JobType, j.SalaryRange, j.Category, j.Status, j.PostedDate, j.IsFeatured,
             e.CompanyName, e.LogoUrl as EmployerLogo
      FROM Jobs j JOIN Employers e ON j.EmployerId = e.UserId
      ${whereClause}
      ORDER BY j.CreatedAt DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);
    
    res.json({ success: true, data: result.recordset, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error in GET /admin/jobs:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách công việc.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs:
 *   post:
 *     summary: Create a new job posting (Admin functionality)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employerId, title, category]
 *             properties:
 *               employerId: { type: string }
 *               title: { type: string }
 *               location: { type: string }
 *               jobType: { type: string }
 *               salaryRange: { type: string }
 *               experienceReq: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Job created successfully
 */
router.post('/jobs', async (req, res) => {
  const { employerId, title, location, jobType, salaryRange, experienceReq, description, category, requirements, benefits } = req.body;
  try {
    const pool = await poolPromise;
    const jobId = require('crypto').randomUUID();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, jobId).input('EmployerId', sql.UniqueIdentifier, employerId)
      .input('Title', sql.NVarChar, title).input('Location', sql.NVarChar, location)
      .input('JobType', sql.NVarChar, jobType).input('SalaryRange', sql.NVarChar, salaryRange)
      .input('ExperienceReq', sql.NVarChar, experienceReq).input('Description', sql.NVarChar, description)
      .input('Category', sql.NVarChar, category).input('Requirements', sql.NVarChar, JSON.stringify(requirements || []))
      .input('Benefits', sql.NVarChar, JSON.stringify(benefits || []))
      .query(`
        INSERT INTO Jobs (Id, EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, Description, Category, Requirements, Benefits, Status, CreatedAt)
        VALUES (@Id, @EmployerId, @Title, @Location, @JobType, @SalaryRange, @ExperienceReq, @Description, @Category, @Requirements, @Benefits, 'active', GETDATE())
      `);
    
    await logActivity(req.user.id, 'ADMIN_CREATE_JOB', 'Job', jobId, `Admin created job: ${title}`);
    res.status(201).json({ success: true, message: 'Bài tuyển dụng đã được tạo.', jobId });
  } catch (err) {
    console.error('Error in POST /admin/jobs:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bài tuyển dụng.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   get:
 *     summary: Get job details for moderation
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('Id', sql.UniqueIdentifier, req.params.id).query(`
      SELECT j.*, e.CompanyName, e.LogoUrl as EmployerLogo, e.Description as CompanyDesc
      FROM Jobs j JOIN Employers e ON j.EmployerId = e.UserId
      WHERE j.Id = @Id
    `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng.' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('Error in GET /admin/jobs/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết công việc.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   put:
 *     summary: Update a job posting
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Job updated successfully
 */
router.put('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, location, jobType, salaryRange, experienceReq, description, category, status, requirements, benefits } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id).input('Title', sql.NVarChar, title)
      .input('Location', sql.NVarChar, location).input('JobType', sql.NVarChar, jobType)
      .input('SalaryRange', sql.NVarChar, salaryRange).input('ExperienceReq', sql.NVarChar, experienceReq)
      .input('Description', sql.NVarChar, description).input('Category', sql.NVarChar, category)
      .input('Status', sql.NVarChar, status).input('Requirements', sql.NVarChar, JSON.stringify(requirements || []))
      .input('Benefits', sql.NVarChar, JSON.stringify(benefits || []))
      .query(`
        UPDATE Jobs SET Title = @Title, Location = @Location, JobType = @JobType, SalaryRange = @SalaryRange,
        ExperienceReq = @ExperienceReq, Description = @Description, Category = @Category,
        Status = @Status, Requirements = @Requirements, Benefits = @Benefits, UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);
      
    await logActivity(req.user.id, 'ADMIN_UPDATE_JOB', 'Job', id, `Updated job details`);
    res.json({ success: true, message: 'Cập nhật bài tuyển dụng thành công.' });
  } catch (err) {
    console.error('Error in PUT /admin/jobs/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài tuyển dụng.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs/{id}/status:
 *   put:
 *     summary: Approve, Reject or Close a job
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Job status updated successfully
 */
router.put('/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Thiếu thông tin status.' });
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).input('status', sql.NVarChar, status).query("UPDATE Jobs SET Status = @status WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng.' });
    
    await logActivity(req.user.id, 'MODERATE_JOB', 'Job', id, `Changed job status to ${status}`);
    res.json({ success: true, message: `Trạng thái tin tuyển dụng đã được cập nhật thành ${status}` });
  } catch (err) {
    console.error('Error in PUT /admin/jobs/:id/status:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái tin tuyển dụng.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs/{id}/featured:
 *   put:
 *     summary: Toggle featured status for a job
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFeatured: { type: boolean }
 *     responses:
 *       200:
 *         description: Featured status updated successfully
 */
router.put('/jobs/:id/featured', async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).input('isFeatured', sql.Bit, isFeatured).query("UPDATE Jobs SET IsFeatured = @isFeatured WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng.' });
    
    await logActivity(req.user.id, 'ADMIN_FEATURE_JOB', 'Job', id, `Set featured status to ${isFeatured}`);
    res.json({ success: true, message: `Đã cập nhật trạng thái nổi bật.` });
  } catch (err) {
    console.error('Error in PUT /admin/jobs/:id/featured:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái tin tuyển dụng.' });
  }
});

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   delete:
 *     summary: Delete a job posting
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job posting deleted successfully
 */
router.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query("DELETE FROM Jobs WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng.' });
    
    await logActivity(req.user.id, 'ADMIN_DELETE_JOB', 'Job', id, `Deleted job posting`);
    res.json({ success: true, message: 'Tin tuyển dụng đã được xóa.' });
  } catch (err) {
    console.error('Error in DELETE /admin/jobs/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tin tuyển dụng.' });
  }
});

// ==========================================
// 4. CV MODERATION
// ==========================================

/**
 * @swagger
 * /api/admin/cvs:
 *   get:
 *     summary: Get all CVs with pagination and filtering
 *     tags: [Admin - CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of CVs retrieved successfully
 */
router.get('/cvs', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    const pool = await poolPromise;
    const request = pool.request();
    
    let whereClause = "WHERE 1=1";
    if (status) { whereClause += " AND cv.Status = @status"; request.input('status', sql.NVarChar, status); }
    if (search) { whereClause += " AND (cv.FileName LIKE @search OR c.FullName LIKE @search)"; request.input('search', sql.NVarChar, `%${search}%`); }

    const countRes = await request.query(`SELECT COUNT(*) as total FROM CVs cv JOIN Candidates c ON cv.CandidateId = c.UserId ${whereClause}`);
    const total = countRes.recordset[0].total;

    const result = await request.query(`
      SELECT cv.Id, cv.FileName, cv.FileUrl, cv.UploadedDate, cv.AIScore, cv.AIParsed, cv.Status,
             c.FullName as CandidateName, c.UserId as CandidateId
      FROM CVs cv JOIN Candidates c ON cv.CandidateId = c.UserId
      ${whereClause}
      ORDER BY cv.UploadedDate DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);
    
    res.json({ success: true, data: result.recordset, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error in GET /admin/cvs:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách CV.' });
  }
});

/**
 * @swagger
 * /api/admin/cvs/{id}:
 *   get:
 *     summary: Get CV details for moderation
 *     tags: [Admin - CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CV details retrieved successfully
 */
router.get('/cvs/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('Id', sql.UniqueIdentifier, req.params.id).query(`
      SELECT cv.*, c.FullName as CandidateName, u.Email as CandidateEmail
      FROM CVs cv JOIN Candidates c ON cv.CandidateId = c.UserId JOIN Users u ON c.UserId = u.Id
      WHERE cv.Id = @Id
    `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy CV.' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('Error in GET /admin/cvs/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết CV.' });
  }
});

/**
 * @swagger
 * /api/admin/cvs/{id}/status:
 *   put:
 *     summary: Approve or Reject a CV
 *     tags: [Admin - CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *     responses:
 *       200:
 *         description: CV status updated successfully
 */
router.put('/cvs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).input('status', sql.NVarChar, status).query("UPDATE CVs SET Status = @status WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy CV.' });
    
    await logActivity(req.user.id, 'MODERATE_CV', 'CV', id, `Set CV status to ${status}`);
    res.json({ success: true, message: `Trạng thái CV đã được cập nhật thành ${status}` });
  } catch (err) {
    console.error('Error in PUT /admin/cvs/:id/status:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái CV.' });
  }
});

/**
 * @swagger
 * /api/admin/cvs/{id}:
 *   delete:
 *     summary: Delete a CV
 *     tags: [Admin - CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CV deleted successfully
 */
router.delete('/cvs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query("DELETE FROM CVs WHERE Id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy CV.' });
    
    await logActivity(req.user.id, 'ADMIN_DELETE_CV', 'CV', id, `Deleted CV`);
    res.json({ success: true, message: 'CV đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in DELETE /admin/cvs/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa CV.' });
  }
});

// ==========================================
// 5. APPLICATIONS MANAGEMENT
// ==========================================

/**
 * @swagger
 * /api/admin/applications:
 *   get:
 *     summary: Get all applications in the system
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 */
router.get('/applications', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT a.Id, a.Stage, a.AppliedDate, a.AIMatchScore, j.Title as JobTitle, e.CompanyName, c.FullName as CandidateName FROM Applications a JOIN Jobs j ON a.JobId = j.Id JOIN Employers e ON j.EmployerId = e.UserId JOIN Candidates c ON a.CandidateId = c.UserId ORDER BY a.AppliedDate DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/applications:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn ứng tuyển.' });
  }
});

/**
 * @swagger
 * /api/admin/applications/{id}:
 *   get:
 *     summary: Get full details of a specific application
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 */
router.get('/applications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query("SELECT a.*, j.Title as JobTitle, j.Description as JobDescription, c.FullName as CandidateName, c.ExperienceYears, c.Education, c.SkillsJson, e.CompanyName, e.LogoUrl as EmployerLogo FROM Applications a JOIN Jobs j ON a.JobId = j.Id JOIN Employers e ON j.EmployerId = e.UserId JOIN Candidates c ON a.CandidateId = c.UserId WHERE a.Id = @id");
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn ứng tuyển.' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('Error in GET /admin/applications/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết đơn ứng tuyển.' });
  }
});

// ==========================================
// 6. RBAC (ROLES & PERMISSIONS)
// ==========================================

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/roles', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Roles ORDER BY Name ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) { 
    console.error('Error in GET /admin/roles:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách vai trò.' }); 
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/permissions', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Permissions ORDER BY Module, Name ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) { 
    console.error('Error in GET /admin/permissions:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách quyền hạn.' }); 
  }
});

/**
 * @swagger
 * /api/admin/roles/{roleId}/permissions:
 *   get:
 *     summary: Get permissions for a specific role
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role permissions matrix
 */
router.get('/roles/:roleId/permissions', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('RoleId', sql.UniqueIdentifier, req.params.roleId).query(`
      SELECT p.*, CASE WHEN rp.PermissionId IS NOT NULL THEN 1 ELSE 0 END as Assigned
      FROM Permissions p LEFT JOIN RolePermissions rp ON p.Id = rp.PermissionId AND rp.RoleId = @RoleId
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/roles/:roleId/permissions:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy ma trận phân quyền.' });
  }
});

/**
 * @swagger
 * /api/admin/roles/{roleId}/permissions:
 *   post:
 *     summary: Update permission matrix for a role
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Permission matrix updated successfully
 */
router.post('/roles/:roleId/permissions', async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await transaction.request().input('rId', sql.UniqueIdentifier, roleId).query("DELETE FROM RolePermissions WHERE RoleId = @rId");
      for (const pId of permissionIds) {
        await transaction.request().input('rId', sql.UniqueIdentifier, roleId).input('pId', sql.UniqueIdentifier, pId)
          .query("INSERT INTO RolePermissions (RoleId, PermissionId) VALUES (@rId, @pId)");
      }
      await transaction.request().input('aId', sql.UniqueIdentifier, req.user.id).input('rId', sql.UniqueIdentifier, roleId)
        .query("INSERT INTO RoleChangeLog (AdminId, Action, RoleId, CreatedAt) VALUES (@aId, 'UPDATE_MATRIX', @rId, GETDATE())");
      await transaction.commit();
      res.json({ success: true, message: 'Cập nhật ma trận quyền thành công.' });
    } catch (err) { await transaction.rollback(); throw err; }
  } catch (err) { 
    console.error('Error in POST /admin/roles/:roleId/permissions:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật ma trận phân quyền.' }); 
  }
});

/**
 * @swagger
 * /api/admin/rbac/history:
 *   get:
 *     summary: Get RBAC change history
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History of RBAC changes
 */
router.get('/rbac/history', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT h.*, u.Email as AdminEmail, r.Name as RoleName
      FROM RoleChangeLog h JOIN Users u ON h.AdminId = u.Id LEFT JOIN Roles r ON h.RoleId = r.Id
      ORDER BY h.CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/rbac/history:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử thay đổi.' });
  }
});

/**
 * @swagger
 * /api/admin/rbac/stats:
 *   get:
 *     summary: RBAC Statistics
 *     tags: [Admin - RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics about roles and permissions
 */
router.get('/rbac/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Roles) as totalRoles,
        (SELECT COUNT(*) FROM Permissions) as totalPermissions,
        (SELECT COUNT(*) FROM RolePermissions) as totalAssignments
    `);
    res.json({ success: true, data: stats.recordset[0] });
  } catch (err) {
    console.error('Error in GET /admin/rbac/stats:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê RBAC.' });
  }
});

// ==========================================
// 7. SYSTEM LOGS & NOTIFICATIONS
// ==========================================

/**
 * @swagger
 * /api/admin/activities:
 *   get:
 *     summary: Get system activity history
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity history retrieved successfully
 */
router.get('/activities', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 100 a.*, u.Email, ISNULL(c.FullName, e.CompanyName) as UserName
      FROM ActivityLog a LEFT JOIN Users u ON a.UserId = u.Id
      LEFT JOIN Candidates c ON u.Id = c.UserId LEFT JOIN Employers e ON u.Id = e.UserId
      ORDER BY a.CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) { 
    console.error('Error in GET /admin/activities:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử hoạt động.' }); 
  }
});

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get list of recent system notifications
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 */
router.get('/notifications', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 50 n.*, u.Email as UserEmail FROM Notifications n LEFT JOIN Users u ON n.UserId = u.Id WHERE n.Type IN ('System', 'Admin Direct') ORDER BY n.CreatedDate DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error in GET /admin/notifications:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách thông báo.' });
  }
});

/**
 * @swagger
 * /api/admin/notifications/broadcast:
 *   post:
 *     summary: Send a notification to all users
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Broadcast notification sent successfully
 */
router.post('/notifications/broadcast', async (req, res) => {
  const { title, message } = req.body;
  try {
    const pool = await poolPromise;
    const users = await pool.request().query("SELECT Id FROM Users");
    for (const user of users.recordset) {
      await pool.request().input('uId', sql.UniqueIdentifier, user.Id).input('t', sql.NVarChar, title).input('m', sql.NVarChar, message)
        .query("INSERT INTO Notifications (Id, UserId, Title, Message, IsRead, CreatedDate) VALUES (NEWID(), @uId, @t, @m, 0, GETDATE())");
    }
    await logActivity(req.user.id, 'BROADCAST_NOTIF', 'System', null, `Title: ${title}`);
    res.json({ success: true, message: 'Đã gửi thông báo toàn hệ thống.' });
  } catch (err) { 
    console.error('Error in POST /admin/notifications/broadcast:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi thông báo hệ thống.' }); 
  }
});

/**
 * @swagger
 * /api/admin/notifications/user/{id}:
 *   post:
 *     summary: Send a targeted notification to a specific user
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               type: { type: string }
 *     responses:
 *       200:
 *         description: Direct notification sent successfully
 */
router.post('/notifications/user/:id', async (req, res) => {
  const { id } = req.params;
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung thông báo.' });
  try {
    const pool = await poolPromise;
    await pool.request().input('UserId', sql.UniqueIdentifier, id).input('Type', sql.NVarChar, type || 'Admin Direct').input('Title', sql.NVarChar, title).input('Message', sql.NVarChar, message).query("INSERT INTO Notifications (Id, UserId, Type, Title, Message, IsRead, CreatedDate) VALUES (NEWID(), @UserId, @Type, @Title, @Message, 0, GETDATE())");
    
    await logActivity(req.user.id, 'SEND_NOTIF', 'User', id, `Sent direct notification: ${title}`);
    res.json({ success: true, message: 'Đã gửi thông báo tới người dùng thành công.' });
  } catch (err) {
    console.error('Error in POST /admin/notifications/user/:id:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi thông báo.' });
  }
});

module.exports = router;