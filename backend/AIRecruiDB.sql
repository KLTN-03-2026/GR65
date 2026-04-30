-- =============================================
-- CƠ SỞ DỮ LIỆU HỆ THỐNG TUYỂN DỤNG THÔNG MINH (AI RECRUIT)
-- Cập nhật mới nhất: Tích hợp AI, Bảo mật và RBAC
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AIRecruitDB')
BEGIN
    CREATE DATABASE AIRecruitDB;
END
GO

USE AIRecruitDB;
GO

-- 1. Bảng Users (Tài khoản lõi)
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Admin', 'Candidate', 'Employer')),
    LoginAttempts INT DEFAULT 0,
    LockoutUntil DATETIME NULL,
    AuthProvider NVARCHAR(50) DEFAULT 'local', -- local, google
    GoogleId NVARCHAR(255) NULL,
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2. Bảng AdminProfiles (Thông tin chi tiết Admin)
CREATE TABLE AdminProfiles (
    UserId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    FullName NVARCHAR(255),
    Phone NVARCHAR(20),
    Department NVARCHAR(100),
    Timezone NVARCHAR(50) DEFAULT 'SE Asia Standard Time',
    Language NVARCHAR(10) DEFAULT 'vi',
    AvatarUrl NVARCHAR(500)
);
GO

-- 3. Bảng Candidates (Ứng viên)
CREATE TABLE Candidates (
    UserId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    FullName NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    AvatarUrl NVARCHAR(500),
    Title NVARCHAR(255),
    Location NVARCHAR(255),
    ExperienceYears NVARCHAR(50),
    Education NVARCHAR(500),
    SkillsJson NVARCHAR(MAX), 
    AIScore DECIMAL(5,2) DEFAULT 0,
    ExpectedSalary NVARCHAR(255),
    Availability NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 4. Bảng Employers (Nhà tuyển dụng)
CREATE TABLE Employers (
    UserId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    CompanyName NVARCHAR(255) NOT NULL,
    LogoUrl NVARCHAR(500),
    Industry NVARCHAR(100),
    Size NVARCHAR(100),
    Location NVARCHAR(255),
    Website NVARCHAR(255),
    Description NVARCHAR(MAX),
    Phone NVARCHAR(20),
    ContactName NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    Credits INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 5. Bảng Jobs (Tin tuyển dụng)
CREATE TABLE Jobs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EmployerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Employers(UserId),
    Title NVARCHAR(255) NOT NULL,
    Location NVARCHAR(255),
    JobType NVARCHAR(50) DEFAULT 'Full-time',
    SalaryRange NVARCHAR(100),
    ExperienceReq NVARCHAR(100),
    SkillsReqJson NVARCHAR(MAX), -- Lưu mảng JSON kỹ năng
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX), 
    Benefits NVARCHAR(MAX),
    Category NVARCHAR(100),
    IsFeatured BIT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'closed', 'draft', 'pending', 'rejected')),
    PostedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    Deadline DATETIME2,
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 6. Bảng CVs (Hồ sơ ứng viên)
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
    AIExtractedJson NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'approved' CHECK (Status IN ('pending', 'approved', 'rejected')),
    UploadedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 7. Bảng Applications (Đơn ứng tuyển)
CREATE TABLE Applications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    JobId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Jobs(Id),
    CandidateId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Candidates(UserId),
    Stage NVARCHAR(50) DEFAULT 'pending' CHECK (Stage IN ('pending', 'reviewing', 'interview', 'offer', 'rejected')),
    ApplicationType NVARCHAR(50) DEFAULT 'applied', -- applied, ai_suggested, v.v.
    AIMatchScore DECIMAL(5,2),
    CvRead BIT DEFAULT 0,
    InterviewDate DATETIME2,
    AppliedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 8. Bảng SystemSettings (Cài đặt hệ thống)
CREATE TABLE SystemSettings (
    SettingKey NVARCHAR(100) PRIMARY KEY,
    SettingValue NVARCHAR(MAX),
    Description NVARCHAR(255),
    Category NVARCHAR(50), -- AI, Security, Session
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Chèn cài đặt mặc định
INSERT INTO SystemSettings (SettingKey, SettingValue, Category, Description) VALUES 
('ai_parsing_threshold', '0.6', 'AI', 'Ngưỡng tin cậy bóc tách CV'),
('ai_matching_weight_skills', '0.7', 'AI', 'Trọng số kỹ năng khi so khớp'),
('security_max_login_attempts', '5', 'Security', 'Số lần đăng nhập sai tối đa'),
('session_timeout_minutes', '1440', 'Session', 'Thời gian hết hạn phiên (phút)');
GO

-- 9. Bảng Roles & Permissions (Phân quyền nâng cao)
CREATE TABLE Roles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Permissions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Code NVARCHAR(50) NOT NULL UNIQUE, -- VD: 'MANAGE_USERS'
    Module NVARCHAR(50),
    Description NVARCHAR(255)
);

CREATE TABLE RolePermissions (
    RoleId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Roles(Id) ON DELETE CASCADE,
    PermissionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Permissions(Id) ON DELETE CASCADE,
    PRIMARY KEY (RoleId, PermissionId)
);

CREATE TABLE RoleChangeLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AdminId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Action NVARCHAR(100),
    RoleId UNIQUEIDENTIFIER,
    Details NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- 10. Nhật ký hoạt động & Hiệu năng AI
CREATE TABLE ActivityLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
    Action NVARCHAR(100) NOT NULL,
    EntityType NVARCHAR(50),
    EntityId UNIQUEIDENTIFIER,
    Details NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AIPerformanceLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Operation NVARCHAR(100), -- CV_PARSING, JOB_MATCHING
    LatencyMs INT,
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 11. Bảng Notifications
CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    Type NVARCHAR(50),
    Title NVARCHAR(255),
    Message NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO
