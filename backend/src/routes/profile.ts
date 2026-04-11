import express from 'express';
import { sql } from '../config/db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Lấy thông tin tài khoản hiện tại
router.get('/me', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        const request = new sql.Request();
        request.input('id', sql.UniqueIdentifier, userId);
        
        let query = '';
        if(role === 'Candidate') {
            query = `
               SELECT u.Email, u.Role, c.* 
               FROM Users u
               JOIN Candidates c ON u.Id = c.UserId
               WHERE u.Id = @id
            `;
        } else if (role === 'Employer') {
            query = `
               SELECT u.Email, u.Role, e.* 
               FROM Users u
               JOIN Employers e ON u.Id = e.UserId
               WHERE u.Id = @id
            `;
        } else {
            return res.status(400).json({message: "Vai trò không khả dụng"});
        }
        
        const result = await request.query(query);
        if(result.recordset.length === 0) return res.status(404).json({message: "Hồ sơ của bạn không tồn tại"});
        
        res.json(result.recordset[0]);
    } catch(err) {
        res.status(500).json({message: "Máy chủ SQL lỗi khi đọc hồ sơ"});
    }
});

// Chỉnh sửa hồ sơ Ứng viên
router.put('/me/candidate', authMiddleware, async (req: any, res: any) => {
    const { FullName, Phone, Title, Location, SkillsJson, ExperienceYears, ExpectedSalary, Availability, Education } = req.body;
    try {
       const request = new sql.Request();
       request.input('id', sql.UniqueIdentifier, req.user.id);
       request.input('name', sql.NVarChar, FullName || '');
       request.input('phone', sql.NVarChar, Phone || '');
       request.input('title', sql.NVarChar, Title || '');
       request.input('location', sql.NVarChar, Location || '');
       request.input('skills', sql.NVarChar, SkillsJson || '[]');
       request.input('expected', sql.NVarChar, ExpectedSalary || '');
       request.input('avail', sql.NVarChar, Availability || '');
       request.input('exp', sql.NVarChar, ExperienceYears || '');
       request.input('edu', sql.NVarChar, Education || '');
       
       await request.query(`
          UPDATE Candidates 
          SET FullName = @name, Phone = @phone, Title = @title, Location = @location, 
              SkillsJson = @skills, ExpectedSalary = @expected, Availability = @avail,
              ExperienceYears = @exp, Education = @edu
          WHERE UserId = @id
       `);
       res.json({message: "Bản lưu trữ hồ sơ đã được đồng bộ hóa lên máy chủ!"});
    } catch(err) {
        console.log(err);
        res.status(500).json({message: "Kết nối CSDL thất bại"});
    }
});

// Chỉnh sửa hồ sơ Doanh nghiệp
router.put('/me/employer', authMiddleware, async (req: any, res: any) => {
    const { CompanyName, Industry, Size, Location, Website, Description } = req.body;
    try {
       const request = new sql.Request();
       request.input('id', sql.UniqueIdentifier, req.user.id);
       request.input('company', sql.NVarChar, CompanyName || '');
       request.input('industry', sql.NVarChar, Industry || '');
       request.input('size', sql.NVarChar, Size || '');
       request.input('loc', sql.NVarChar, Location || '');
       request.input('web', sql.NVarChar, Website || '');
       request.input('desc', sql.NVarChar, Description || '');
       
       await request.query(`
          UPDATE Employers 
          SET CompanyName = @company, Industry = @industry, Size = @size, 
              Location = @loc, Website = @web, Description = @desc
          WHERE UserId = @id
       `);
       res.json({message: "Hồ sơ Công ty đã được đồng bộ lên CSDL hệ thống!"});
    } catch(err) {
        console.log(err);
        res.status(500).json({message: "Kết nối CSDL thất bại"});
    }
});

export default router;
