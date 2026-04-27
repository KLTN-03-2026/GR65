-- Tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AIRecruitDB')
BEGIN
    CREATE DATABASE AIRecruitDB;
END
GO

USE AIRecruitDB;
GO

-- 1. Bảng Users (Tài khoản)
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Admin', 'Candidate', 'Employer')),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2. Bảng Candidates (Ứng viên)
CREATE TABLE Candidates (
    UserId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    FullName NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    AvatarUrl NVARCHAR(500),
    Title NVARCHAR(255),
    Location NVARCHAR(255),
    ExperienceYears NVARCHAR(50),
    Education NVARCHAR(500),
    SkillsJson NVARCHAR(MAX), -- Lưu danh sách kỹ năng dưới dạng JSON
    AIScore DECIMAL(5,2) DEFAULT 0,
    ExpectedSalary NVARCHAR(255),
    Availability NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 3. Bảng Employers (Nhà tuyển dụng)
CREATE TABLE Employers (
    UserId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    CompanyName NVARCHAR(255) NOT NULL,
    LogoUrl NVARCHAR(500),
    Industry NVARCHAR(100),
    Size NVARCHAR(100),
    Location NVARCHAR(255),
    Website NVARCHAR(255),
    Description NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    Credits INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 4. Bảng Jobs (Tin tuyển dụng)
CREATE TABLE Jobs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EmployerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Employers(UserId),
    Title NVARCHAR(255) NOT NULL,
    Location NVARCHAR(255),
    JobType NVARCHAR(50) DEFAULT 'Full-time',
    SalaryRange NVARCHAR(100),
    ExperienceReq NVARCHAR(100),
    SkillsReqJson NVARCHAR(MAX), -- Kỹ năng yêu cầu dạng JSON
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX), 
    Benefits NVARCHAR(MAX),
    Category NVARCHAR(100),
    IsFeatured BIT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'closed', 'draft')),
    PostedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    Deadline DATETIME2,
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 5. Bảng CVs (Hồ sơ ứng viên)
CREATE TABLE CVs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CandidateId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Candidates(UserId) ON DELETE CASCADE,
    FileName NVARCHAR(255) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileSize NVARCHAR(50),
    Format NVARCHAR(20),
    IsDefault BIT DEFAULT 0,
    AIParsed BIT DEFAULT 0,
    AIScore DECIMAL(5,2) DEFAULT 0,
    AIExtractedJson NVARCHAR(MAX), -- JSON từ quá trình bóc tách bằng AI
    Status NVARCHAR(50) DEFAULT 'approved' CHECK (Status IN ('pending', 'approved', 'rejected')),
    UploadedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 6. Bảng Applications (Đơn ứng tuyển & Pipeline)
CREATE TABLE Applications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    JobId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Jobs(Id),
    CandidateId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Candidates(UserId),
    Stage NVARCHAR(50) DEFAULT 'pending' CHECK (Stage IN ('pending', 'reviewing', 'interview', 'offer', 'rejected')),
    AIMatchScore DECIMAL(5,2),
    CvRead BIT DEFAULT 0,
    InterviewDate DATETIME2,
    SalaryOffered NVARCHAR(100),
    Notes NVARCHAR(MAX),
    ApplicationType NVARCHAR(50) DEFAULT 'applied' CHECK (ApplicationType IN ('applied', 'ai_suggested')),
    AppliedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 7. Bảng Notifications (Thông báo)
CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Type NVARCHAR(50),
    Title NVARCHAR(255),
    Message NVARCHAR(MAX),
    Link NVARCHAR(500),
    IsRead BIT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 8. Bảng ActivityLog (Lịch sử hoạt động)
CREATE TABLE ActivityLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
    Action NVARCHAR(100) NOT NULL, -- Ví dụ: 'LOGIN', 'POST_JOB', 'UPLOAD_CV', 'APPLY_JOB'
    EntityType NVARCHAR(50),      -- Ví dụ: 'User', 'Job', 'CV', 'Application'
    EntityId UNIQUEIDENTIFIER,
    Details NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 9. Bảng Roles (Vai trò)
CREATE TABLE Roles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(50) NOT NULL UNIQUE, -- Admin, Candidate, Employer, v.v.
    Description NVARCHAR(255),
    IsSystem BIT DEFAULT 0, -- Vai trò hệ thống không được xóa
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 10. Bảng Permissions (Quyền hạn)
CREATE TABLE Permissions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code NVARCHAR(100) NOT NULL UNIQUE, -- VD: 'MANAGE_USERS', 'POST_JOB'
    Name NVARCHAR(100) NOT NULL,
    Module NVARCHAR(50), -- Auth, Jobs, Users, CV...
    Description NVARCHAR(255)
);
GO

-- 11. Bảng RolePermissions (Ma trận phân quyền)
CREATE TABLE RolePermissions (
    RoleId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Roles(Id) ON DELETE CASCADE,
    PermissionId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Permissions(Id) ON DELETE CASCADE,
    PRIMARY KEY (RoleId, PermissionId)
);
GO

-- 12. Bảng RoleChangeLog (Lịch sử thay đổi quyền)
CREATE TABLE RoleChangeLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AdminId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Action NVARCHAR(50), -- ADD_PERMISSION, REMOVE_PERMISSION, CREATE_ROLE
    RoleId UNIQUEIDENTIFIER,
    Details NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO
ALTER TABLE Users ADD AuthProvider NVARCHAR(50) DEFAULT 'local'; -- local, google
ALTER TABLE Users ADD GoogleId NVARCHAR(255) NULL;

ALTER TABLE Employers ADD Phone NVARCHAR(20);
ALTER TABLE Employers ADD ContactName NVARCHAR(255);
