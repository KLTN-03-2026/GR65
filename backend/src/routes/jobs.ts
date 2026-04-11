import express from 'express';
import { sql } from '../config/db';

const router = express.Router();

// Lấy danh sách tin tuyển dụng
router.get('/', async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT j.*, e.CompanyName, e.LogoUrl as CompanyLogo
      FROM Jobs j
      JOIN Employers e ON j.EmployerId = e.UserId
      ORDER BY j.PostedDate DESC
    `);
    // Pass dạng array của SQL qua HTTP
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy tin tuyển dụng' });
  }
});

// Xem chi tiết việc làm
router.get('/:id', async (req: any, res: any) => {
  try {
    const request = new sql.Request();
    request.input('id', sql.UniqueIdentifier, req.params.id);
    const result = await request.query(`
      SELECT j.*, e.CompanyName, e.LogoUrl as CompanyLogo
      FROM Jobs j
      JOIN Employers e ON j.EmployerId = e.UserId
      WHERE j.Id = @id
    `);
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy Job' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// Đăng tuyển mới
router.post('/', async (req: any, res: any) => {
  const { title, location, type, salary, experience, skills, description, requirements, benefits, category, employerId } = req.body;
  
  if(!employerId) return res.status(400).json({message: "Thiếu mã doanh nghiệp"});
  
  try {
    const request = new sql.Request();
    request.input('employerId', sql.UniqueIdentifier, employerId); 
    request.input('title', sql.NVarChar, title);
    request.input('location', sql.NVarChar, location);
    request.input('type', sql.NVarChar, type || 'Full-time');
    request.input('salaryRange', sql.NVarChar, salary);
    request.input('experienceReq', sql.NVarChar, experience);
    request.input('skillsReqJson', sql.NVarChar, JSON.stringify(skills || []));
    request.input('description', sql.NVarChar, description);
    request.input('requirements', sql.NVarChar, requirements);
    request.input('benefits', sql.NVarChar, benefits);
    request.input('category', sql.NVarChar, category);
    
    await request.query(`
      INSERT INTO Jobs (EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, SkillsReqJson, Description, Requirements, Benefits, Category)
      VALUES (@employerId, @title, @location, @type, @salaryRange, @experienceReq, @skillsReqJson, @description, @requirements, @benefits, @category)
    `);
    
    res.status(201).json({ message: 'Tin tuyển dụng đã được lưu lên CSDL' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Máy chủ phản hồi lỗi khi nạp Job' });
  }
});

export default router;
