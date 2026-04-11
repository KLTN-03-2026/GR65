import { sql, connectDB } from './config/db';

async function seed() {
  await connectDB();
  const employerId = 'E1234567-89AB-CDEF-0123-456789ABCDEF';
  try {
     console.log("Bắt đầu nạp dữ liệu mẫu...");
     await sql.query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '${employerId}')
        BEGIN
            INSERT INTO Users (Id, Email, PasswordHash, Role)
            VALUES ('${employerId}', 'employer@demo.com', 'hash', 'Employer');
            
            INSERT INTO Employers (UserId, CompanyName, LogoUrl, Industry, Size, Location, Description)
            VALUES ('${employerId}', 'Tech Corp Vietnam', 'T', 'Software', '100-500', 'Hồ Chí Minh', 'Công ty công nghệ chuyên giải pháp AI và Blockchain.');
        END
        
        INSERT INTO Jobs (EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, SkillsReqJson, Description, Requirements, Benefits, Category)
        VALUES (
          '${employerId}', 
          'Senior React Developer', 
          'TP. Hồ Chí Minh', 
          'Full-time', 
          '35-50 triệu', 
          'Senior (3+ năm)', 
          '["React", "TypeScript", "TailwindCSS"]', 
          'Tham gia dự án phát triển hệ thống AI ATS cho thị trường toàn cầu.', 
          'Kinh nghiệm Frontend trên 3 năm\nThành thạo tối ưu hoá component\nHỗ trợ thiết kế UI/UX', 
          'Thưởng doanh thu\nBảo hiểm sức khoẻ PVI\nCấp MacBook Pro', 
          'Lập trình'
        );
        
        INSERT INTO Jobs (EmployerId, Title, Location, JobType, SalaryRange, ExperienceReq, SkillsReqJson, Description, Requirements, Benefits, Category)
        VALUES (
          '${employerId}', 
          'Backend Node.js Engineer', 
          'Hà Nội', 
          'Remote', 
          '20-35 triệu', 
          'Mid (1-3 năm)', 
          '["Node.js", "Express", "SQL Server"]', 
          'Thiết kế và xây dựng API RESTful hiệu năng cao cho hệ thống AI Matcher.', 
          'Làm việc tốt với SQL Server\nHiểu biết về bảo mật hệ thống\nKĩ năng viết tài liệu API', 
          '14 tháng lương\nLàm việc từ xa siêu linh hoạt', 
          'Lập trình'
        );
     `);
     console.log("Seeding thành công!");
  } catch(e) {
     console.error("Seeding thất bại", e);
  }
  process.exit();
}
seed();
