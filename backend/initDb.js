const { pool } = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Connected to PostgreSQL. Synchronizing database schema...');

    // Read and execute SQL file
    const sqlFilePath = path.join(__dirname, 'AIRecruiDB.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
      try {
        await pool.query(sqlScript);
      } catch (err) {
        // Log warning but continue — tables likely already exist
        if (!err.message.includes('already exists')) {
          console.warn('Warning executing SQL schema:', err.message);
        }
      }
      console.log('Database schema synchronization completed.');
    }

    // Đảm bảo cột GoogleId và AuthProvider tồn tại (cho Google SSO)
    const alterQueries = [
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='authprovider') THEN
          ALTER TABLE Users ADD COLUMN AuthProvider VARCHAR(50) DEFAULT 'local';
        END IF;
      END $$`,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='googleid') THEN
          ALTER TABLE Users ADD COLUMN GoogleId VARCHAR(255) NULL;
        END IF;
      END $$`,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cvs' AND column_name='status') THEN
          ALTER TABLE CVs ADD COLUMN Status VARCHAR(50) DEFAULT 'approved';
        END IF;
      END $$`,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='status') THEN
          ALTER TABLE Jobs ADD COLUMN Status VARCHAR(50) DEFAULT 'active';
        END IF;
      END $$`
    ];
    for (const q of alterQueries) {
      try { await pool.query(q); } catch (e) { console.warn('Alter query warning:', e.message); }
    }
    console.log('Database columns ensured.');

    // Seed Roles
    const roles = [
      { name: 'Admin', desc: 'System Administrator', isSystem: true },
      { name: 'Candidate', desc: 'Job Seeker', isSystem: true },
      { name: 'Employer', desc: 'Recruiter', isSystem: true }
    ];
    for (const r of roles) {
      await pool.query(
        `INSERT INTO Roles (Id, Name, Description, IsSystem)
         SELECT gen_random_uuid(), $1, $2, $3
         WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Name = $1)`,
        [r.name, r.desc, r.isSystem]
      );
    }

    // Seed Permissions
    const permissions = [
      { code: 'MANAGE_USERS', name: 'Quản lý người dùng', mod: 'Users' },
      { code: 'POST_JOB', name: 'Đăng tin tuyển dụng', mod: 'Jobs' },
      { code: 'MANAGE_ROLES', name: 'Quản lý vai trò & quyền', mod: 'Settings' },
      { code: 'VIEW_STATS', name: 'Xem thống kê hệ thống', mod: 'Dashboard' },
      { code: 'MODERATE_CONTENT', name: 'Kiểm duyệt nội dung', mod: 'Moderation' }
    ];
    for (const p of permissions) {
      await pool.query(
        `INSERT INTO Permissions (Id, Code, Name, Module)
         SELECT gen_random_uuid(), $1, $2, $3
         WHERE NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = $1)`,
        [p.code, p.name, p.mod]
      );
    }
    
    console.log('Seed roles and permissions completed.');

    // Seed Admin user
    const adminEmail = 'admin@demo.vn';
    const result = await pool.query('SELECT * FROM Users WHERE Email = $1 LIMIT 1', [adminEmail]);

    if (result.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      await pool.query(
        `INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
        [adminEmail, hashedPassword, 'Admin']
      );
      console.log('Seed Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = { initializeDatabase };
