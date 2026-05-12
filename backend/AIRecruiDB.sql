-- =============================================
-- CƠ SỞ DỮ LIỆU HỆ THỐNG TUYỂN DỤNG THÔNG MINH (AI RECRUIT)
-- PostgreSQL Version
-- =============================================

-- Bật extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng Users (Tài khoản lõi)
CREATE TABLE IF NOT EXISTS Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL CHECK (Role IN ('Admin', 'Candidate', 'Employer')),
    LoginAttempts INT DEFAULT 0,
    LockoutUntil TIMESTAMPTZ NULL,
    AuthProvider VARCHAR(50) DEFAULT 'local',
    GoogleId VARCHAR(255) NULL,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng AdminProfiles (Thông tin chi tiết Admin)
CREATE TABLE IF NOT EXISTS AdminProfiles (
    UserId UUID PRIMARY KEY REFERENCES Users(Id) ON DELETE CASCADE,
    FullName VARCHAR(255),
    Phone VARCHAR(20),
    Department VARCHAR(100),
    Timezone VARCHAR(50) DEFAULT 'SE Asia Standard Time',
    Language VARCHAR(10) DEFAULT 'vi',
    AvatarUrl VARCHAR(500)
);

-- 3. Bảng Candidates (Ứng viên)
CREATE TABLE IF NOT EXISTS Candidates (
    UserId UUID PRIMARY KEY REFERENCES Users(Id) ON DELETE CASCADE,
    FullName VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    AvatarUrl VARCHAR(500),
    Title VARCHAR(255),
    Location VARCHAR(255),
    ExperienceYears VARCHAR(50),
    Education VARCHAR(500),
    SkillsJson TEXT,
    AIScore NUMERIC(5,2) DEFAULT 0,
    ExpectedSalary VARCHAR(255),
    Availability VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Employers (Nhà tuyển dụng)
CREATE TABLE IF NOT EXISTS Employers (
    UserId UUID PRIMARY KEY REFERENCES Users(Id) ON DELETE CASCADE,
    CompanyName VARCHAR(255) NOT NULL,
    LogoUrl VARCHAR(500),
    Industry VARCHAR(100),
    Size VARCHAR(100),
    Location VARCHAR(255),
    Website VARCHAR(255),
    Description TEXT,
    Phone VARCHAR(20),
    ContactName VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'suspended', 'pending')),
    Credits INT DEFAULT 0,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Jobs (Tin tuyển dụng)
CREATE TABLE IF NOT EXISTS Jobs (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EmployerId UUID NOT NULL REFERENCES Employers(UserId),
    Title VARCHAR(255) NOT NULL,
    Location VARCHAR(255),
    JobType VARCHAR(50) DEFAULT 'Full-time',
    SalaryRange VARCHAR(100),
    ExperienceReq VARCHAR(100),
    SkillsReqJson TEXT,
    Description TEXT,
    Requirements TEXT,
    Benefits TEXT,
    Category VARCHAR(100),
    IsFeatured BOOLEAN DEFAULT FALSE,
    Status VARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'closed', 'draft', 'pending', 'rejected')),
    PostedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    Deadline TIMESTAMPTZ,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng CVs (Hồ sơ ứng viên)
CREATE TABLE IF NOT EXISTS CVs (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CandidateId UUID NOT NULL REFERENCES Candidates(UserId) ON DELETE CASCADE,
    FileName VARCHAR(255) NOT NULL,
    FileUrl VARCHAR(500) NOT NULL,
    FileSize VARCHAR(50),
    Format VARCHAR(20),
    IsDefault BOOLEAN DEFAULT FALSE,
    AIParsed BOOLEAN DEFAULT FALSE,
    AIScore NUMERIC(5,2) DEFAULT 0,
    AIExtractedJson TEXT,
    Status VARCHAR(50) DEFAULT 'approved' CHECK (Status IN ('pending', 'approved', 'rejected')),
    UploadedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Applications (Đơn ứng tuyển)
CREATE TABLE IF NOT EXISTS Applications (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    JobId UUID NOT NULL REFERENCES Jobs(Id),
    CandidateId UUID NOT NULL REFERENCES Candidates(UserId),
    Stage VARCHAR(50) DEFAULT 'pending' CHECK (Stage IN ('pending', 'reviewing', 'interview', 'offer', 'rejected')),
    ApplicationType VARCHAR(50) DEFAULT 'applied',
    AIMatchScore NUMERIC(5,2),
    CvRead BOOLEAN DEFAULT FALSE,
    InterviewDate TIMESTAMPTZ,
    AppliedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng SystemSettings (Cài đặt hệ thống)
CREATE TABLE IF NOT EXISTS SystemSettings (
    SettingKey VARCHAR(100) PRIMARY KEY,
    SettingValue TEXT,
    Description VARCHAR(255),
    Category VARCHAR(50),
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chèn cài đặt mặc định (bỏ qua nếu đã tồn tại)
INSERT INTO SystemSettings (SettingKey, SettingValue, Category, Description) VALUES
('ai_parsing_threshold', '0.6', 'AI', 'Ngưỡng tin cậy bóc tách CV'),
('ai_matching_weight_skills', '0.7', 'AI', 'Trọng số kỹ năng khi so khớp'),
('security_max_login_attempts', '5', 'Security', 'Số lần đăng nhập sai tối đa'),
('session_timeout_minutes', '1440', 'Session', 'Thời gian hết hạn phiên (phút)')
ON CONFLICT (SettingKey) DO NOTHING;

-- 9. Bảng Roles & Permissions (Phân quyền nâng cao)
CREATE TABLE IF NOT EXISTS Roles (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    IsSystem BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Permissions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(50) NOT NULL UNIQUE,
    Module VARCHAR(50),
    Description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS RolePermissions (
    RoleId UUID REFERENCES Roles(Id) ON DELETE CASCADE,
    PermissionId UUID REFERENCES Permissions(Id) ON DELETE CASCADE,
    PRIMARY KEY (RoleId, PermissionId)
);

CREATE TABLE IF NOT EXISTS RoleChangeLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    AdminId UUID REFERENCES Users(Id),
    Action VARCHAR(100),
    RoleId UUID,
    Details TEXT,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Nhật ký hoạt động & Hiệu năng AI
CREATE TABLE IF NOT EXISTS ActivityLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID REFERENCES Users(Id) ON DELETE SET NULL,
    Action VARCHAR(100) NOT NULL,
    EntityType VARCHAR(50),
    EntityId UUID,
    Details TEXT,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bảng Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    Type VARCHAR(50),
    Title VARCHAR(255),
    Message TEXT,
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Bảng Interviews (Lịch phỏng vấn)
CREATE TABLE IF NOT EXISTS Interviews (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ApplicationId UUID NOT NULL REFERENCES Applications(Id),
    ScheduledDate TIMESTAMPTZ NOT NULL,
    ScheduledTime VARCHAR(10) NOT NULL,
    InterviewType VARCHAR(50) DEFAULT 'video',
    Location VARCHAR(500),
    InterviewerName VARCHAR(255),
    Notes TEXT,
    Status VARCHAR(50) DEFAULT 'pending' CHECK (Status IN ('pending','confirmed','cancelled','completed')),
    CandidateConfirmed BOOLEAN DEFAULT FALSE,
    ReminderSent BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
