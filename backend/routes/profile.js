const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/profile/me
router.get('/me', async (req, res) => {
  try {
    const { id, role } = req.user;
    const userRes = await pool.query('SELECT Id, Email, Role FROM Users WHERE Id = $1', [id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    let profile = null;
    if (role === 'Candidate') {
      const pRes = await pool.query('SELECT FullName, Phone, AvatarUrl, Title, Location, ExperienceYears, Education, SkillsJson, ExpectedSalary, Availability, Status FROM Candidates WHERE UserId = $1', [id]);
      const c = pRes.rows[0];
      profile = {
        name: c?.fullname || '', email: user.email, phone: c?.phone || '',
        title: c?.title || '', location: c?.location || '', experienceYears: c?.experienceyears || '0',
        education: c?.education || '', skills: c?.skillsjson ? JSON.parse(c.skillsjson) : [],
        expectedSalary: c?.expectedsalary || '', availability: c?.availability || 'immediate',
        avatarUrl: c?.avatarurl || null, isProfileComplete: !!(c?.title && c?.skillsjson),
      };
      const aiScoreRes = await pool.query(
        `SELECT MAX(CAST(AIScore AS FLOAT)) as bestaiscore, COUNT(*) as totalcvs,
                SUM(CASE WHEN AIParsed = true THEN 1 ELSE 0 END) as parsedcvs
         FROM CVs WHERE CandidateId = $1 AND AIScore > 0`, [id]);
      const aiData = aiScoreRes.rows[0];
      profile.aiScore = aiData?.bestaiscore ? Math.round(aiData.bestaiscore * 100) / 100 : 0;
      profile.totalCVs = parseInt(aiData?.totalcvs) || 0;
      profile.parsedCVs = parseInt(aiData?.parsedcvs) || 0;
    } else if (role === 'Employer') {
      const pRes = await pool.query('SELECT CompanyName, LogoUrl, Industry, Size, Location, Website, Description, Status, Phone, ContactName FROM Employers WHERE UserId = $1', [id]);
      const e = pRes.rows[0];
      profile = {
        companyName: e?.companyname || '', email: user.email, phone: e?.phone || '',
        contactName: e?.contactname || '', industry: e?.industry || '', size: e?.size || '',
        location: e?.location || '', website: e?.website || '', description: e?.description || '',
        logoUrl: e?.logourl || null, isProfileComplete: !!(e?.industry && e?.location),
      };
    }
    res.json({ role, profile });
  } catch (err) { console.error('Lỗi khi lấy profile:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PUT /api/profile/me
router.put('/me', async (req, res) => {
  try {
    const { id, role } = req.user;
    const body = req.body;
    if (role === 'Candidate') {
      const { name, phone, title, location, experienceYears, education, skills, expectedSalary, availability } = body;
      const skillsJson = skills && Array.isArray(skills) ? JSON.stringify(skills) : (typeof skills === 'string' ? skills : null);
      await pool.query(
        `UPDATE Candidates SET FullName=$1, Phone=$2, Title=$3, Location=$4, ExperienceYears=$5, Education=$6, SkillsJson=$7, ExpectedSalary=$8, Availability=$9, UpdatedAt=NOW() WHERE UserId=$10`,
        [name||null, phone||null, title||null, location||null, experienceYears||null, education||null, skillsJson, expectedSalary||null, availability||null, id]
      );
      return res.json({ message: 'Cập nhật hồ sơ ứng viên thành công.', isProfileComplete: !!(title && skillsJson) });
    } else if (role === 'Employer') {
      const { companyName, phone, contactName, industry, size, location, website, description } = body;
      await pool.query(
        `UPDATE Employers SET CompanyName=$1, Phone=$2, ContactName=$3, Industry=$4, Size=$5, Location=$6, Website=$7, Description=$8, UpdatedAt=NOW() WHERE UserId=$9`,
        [companyName||null, phone||null, contactName||null, industry||null, size||null, location||null, website||null, description||null, id]
      );
      return res.json({ message: 'Cập nhật hồ sơ nhà tuyển dụng thành công.', isProfileComplete: !!(industry && location) });
    } else {
      return res.status(403).json({ message: 'Admin không có trang hồ sơ.' });
    }
  } catch (err) { console.error('Lỗi khi cập nhật profile:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PUT /api/profile/change-password
router.put('/change-password', async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    const result = await pool.query('SELECT PasswordHash FROM Users WHERE Id = $1', [id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordhash);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE Users SET PasswordHash = $1, UpdatedAt = NOW() WHERE Id = $2', [newHash, id]);
    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err) { console.error('Lỗi khi đổi mật khẩu:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

module.exports = router;
