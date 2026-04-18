const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');

// Tất cả route trong file này đều cần xác thực JWT
router.use(authMiddleware);

// ────────────────────────────────────────────────
// GET /api/profile/me  – Lấy toàn bộ thông tin hồ sơ
// ────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const { id, role } = req.user;
    const pool = await poolPromise;

    // Lấy thông tin cơ bản từ Users
    const userRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('SELECT Id, Email, Role FROM Users WHERE Id = @Id');

    const user = userRes.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    let profile = null;

    if (role === 'Candidate') {
      // Lấy toàn bộ thông tin ứng viên
      const pRes = await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .query(`
          SELECT FullName, Phone, AvatarUrl, Title, Location,
                 ExperienceYears, Education, SkillsJson,
                 ExpectedSalary, Availability, Status
          FROM Candidates WHERE UserId = @UserId
        `);
      const c = pRes.recordset[0];

      profile = {
        // Thông tin cơ bản (từ đăng ký)
        name: c?.FullName || '',
        email: user.Email,
        phone: c?.Phone || '',
        // Thông tin nghề nghiệp
        title: c?.Title || '',
        location: c?.Location || '',
        experienceYears: c?.ExperienceYears || '0',
        education: c?.Education || '',
        skills: c?.SkillsJson ? JSON.parse(c.SkillsJson) : [],
        expectedSalary: c?.ExpectedSalary || '',
        availability: c?.Availability || 'immediate',
        // Avatar
        avatarUrl: c?.AvatarUrl || null,
        // Tính %  hoàn thiện hồ sơ
        isProfileComplete: !!(c?.Title && c?.SkillsJson),
      };

    } else if (role === 'Employer') {
      // Lấy toàn bộ thông tin nhà tuyển dụng
      const pRes = await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .query(`
          SELECT CompanyName, LogoUrl, Industry, Size, Location,
                 Website, Description, Status, Phone, ContactName
          FROM Employers WHERE UserId = @UserId
        `);
      const e = pRes.recordset[0];

      profile = {
        companyName: e?.CompanyName || '',
        email: user.Email,
        phone: e?.Phone || '',
        contactName: e?.ContactName || '',
        industry: e?.Industry || '',
        size: e?.Size || '',
        location: e?.Location || '',
        website: e?.Website || '',
        description: e?.Description || '',
        logoUrl: e?.LogoUrl || null,
        isProfileComplete: !!(e?.Industry && e?.Location),
      };
    }

    res.json({ role, profile });

  } catch (err) {
    console.error('Lỗi khi lấy profile:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/profile/me  – Cập nhật hồ sơ
// ────────────────────────────────────────────────
router.put('/me', async (req, res) => {
  try {
    const { id, role } = req.user;
    const pool = await poolPromise;
    const body = req.body;

    if (role === 'Candidate') {
      const {
        name, phone, title, location, experienceYears,
        education, skills, expectedSalary, availability
      } = body;

      const skillsJson = skills && Array.isArray(skills)
        ? JSON.stringify(skills)
        : (typeof skills === 'string' ? skills : null);

      await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .input('FullName', sql.NVarChar, name || null)
        .input('Phone', sql.NVarChar, phone || null)
        .input('Title', sql.NVarChar, title || null)
        .input('Location', sql.NVarChar, location || null)
        .input('ExperienceYears', sql.NVarChar, experienceYears || null)
        .input('Education', sql.NVarChar, education || null)
        .input('SkillsJson', sql.NVarChar, skillsJson)
        .input('ExpectedSalary', sql.NVarChar, expectedSalary || null)
        .input('Availability', sql.NVarChar, availability || null)
        .query(`
          UPDATE Candidates SET
            FullName = @FullName,
            Phone = @Phone,
            Title = @Title,
            Location = @Location,
            ExperienceYears = @ExperienceYears,
            Education = @Education,
            SkillsJson = @SkillsJson,
            ExpectedSalary = @ExpectedSalary,
            Availability = @Availability,
            UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);

      const isProfileComplete = !!(title && skillsJson);
      return res.json({ message: 'Cập nhật hồ sơ ứng viên thành công.', isProfileComplete });

    } else if (role === 'Employer') {
      const {
        companyName, phone, contactName, industry,
        size, location, website, description
      } = body;

      await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .input('CompanyName', sql.NVarChar, companyName || null)
        .input('Phone', sql.NVarChar, phone || null)
        .input('ContactName', sql.NVarChar, contactName || null)
        .input('Industry', sql.NVarChar, industry || null)
        .input('Size', sql.NVarChar, size || null)
        .input('Location', sql.NVarChar, location || null)
        .input('Website', sql.NVarChar, website || null)
        .input('Description', sql.NVarChar, description || null)
        .query(`
          UPDATE Employers SET
            CompanyName = @CompanyName,
            Phone = @Phone,
            ContactName = @ContactName,
            Industry = @Industry,
            Size = @Size,
            Location = @Location,
            Website = @Website,
            Description = @Description,
            UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);

      const isProfileComplete = !!(industry && location);
      return res.json({ message: 'Cập nhật hồ sơ nhà tuyển dụng thành công.', isProfileComplete });

    } else {
      return res.status(403).json({ message: 'Admin không có trang hồ sơ.' });
    }

  } catch (err) {
    console.error('Lỗi khi cập nhật profile:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});


// ────────────────────────────────────────────────
// PUT /api/profile/change-password – Đổi mật khẩu
// ────────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('SELECT PasswordHash FROM Users WHERE Id = @Id');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('PasswordHash', sql.NVarChar, newHash)
      .query('UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE() WHERE Id = @Id');

    res.json({ message: 'Đổi mật khẩu thành công.' });

  } catch (err) {
    console.error('Lỗi khi đổi mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
