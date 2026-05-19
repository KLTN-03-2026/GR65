const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const pool = await poolPromise;
    console.log('Connected to SQL Server. Synchronizing database schema...');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'AIRecruiDB.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split by GO keyword
      const statements = sqlScript.split(/\bGO\b/i);

      for (let statement of statements) {
        statement = statement.trim();
        if (!statement) continue;

        // Skip CREATE DATABASE and USE statements if they might fail 
        // because we are already connected to the database
        if (statement.toUpperCase().startsWith('CREATE DATABASE') || 
            statement.toUpperCase().startsWith('USE ')) {
          continue;
        }

        try {
          await pool.request().query(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already an object named') || 
              err.message.includes('already has a primary key') ||
              err.message.includes('Column names in each table must be unique') ||
              err.message.includes('already exists on table')) {
            // This is expected if the script is run multiple times
            continue;
          }
          console.warn('Warning executing SQL statement:', err.message);
        }
      }
      console.log('Database schema synchronization completed.');
    }

    // Đảm bảo cột GoogleId và AuthProvider tồn tại (cho Google SSO)
    // Đảm bảo cột Status tồn tại trong bảng CVs và Jobs cho kiểm duyệt
    const alterQueries = [
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AuthProvider')
       ALTER TABLE Users ADD AuthProvider NVARCHAR(50) DEFAULT 'local'`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'GoogleId')
       ALTER TABLE Users ADD GoogleId NVARCHAR(255) NULL`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVs') AND name = 'Status')
       ALTER TABLE CVs ADD Status NVARCHAR(50) DEFAULT 'approved' CHECK (Status IN ('pending', 'approved', 'rejected'))`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'Status')
       ALTER TABLE Jobs ADD Status NVARCHAR(50) DEFAULT 'active' CHECK (Status IN ('active', 'closed', 'draft', 'pending', 'rejected'))`
    ];
    for (const q of alterQueries) {
      try { await pool.request().query(q); } catch (e) { console.warn('Alter query warning:', e.message); }
    }

    // Migration: Cập nhật CHECK constraint trên Jobs.Status để hỗ trợ 'pending' và 'rejected'
    try {
      const constraintResult = await pool.request().query(`
        SELECT con.name
        FROM sys.check_constraints con
        JOIN sys.columns col ON con.parent_object_id = col.object_id AND con.parent_column_id = col.column_id
        WHERE con.parent_object_id = OBJECT_ID('Jobs') AND col.name = 'Status'
      `);
      if (constraintResult.recordset.length > 0) {
        const constraintName = constraintResult.recordset[0].name;
        // Kiểm tra xem constraint hiện tại đã có 'pending' chưa
        const defResult = await pool.request()
          .input('name', sql.NVarChar, constraintName)
          .query(`SELECT definition FROM sys.check_constraints WHERE name = @name`);
        const definition = defResult.recordset[0]?.definition || '';
        if (!definition.includes('pending')) {
          console.log(`Migrating Jobs.Status constraint: ${constraintName}...`);
          await pool.request().query(`ALTER TABLE Jobs DROP CONSTRAINT [${constraintName}]`);
          await pool.request().query(`ALTER TABLE Jobs ADD CONSTRAINT CK_Jobs_Status CHECK (Status IN ('active', 'closed', 'draft', 'pending', 'rejected'))`);
          console.log('Jobs.Status constraint updated successfully (added pending, rejected).');
        }
      }
    } catch (e) { console.warn('Migration warning (Jobs.Status):', e.message); }

    console.log('Database columns ensured.');

    // Seed Roles
    const roles = [
      { name: 'Admin', desc: 'System Administrator', isSystem: 1 },
      { name: 'Candidate', desc: 'Job Seeker', isSystem: 1 },
      { name: 'Employer', desc: 'Recruiter', isSystem: 1 }
    ];
    for (const r of roles) {
      await pool.request()
        .input('Name', sql.NVarChar, r.name)
        .input('Desc', sql.NVarChar, r.desc)
        .input('IsSystem', sql.Bit, r.isSystem)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = @Name)
          INSERT INTO Roles (Id, Name, Description, IsSystem) VALUES (NEWID(), @Name, @Desc, @IsSystem)
        `);
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
      await pool.request()
        .input('Code', sql.NVarChar, p.code)
        .input('Name', sql.NVarChar, p.name)
        .input('Mod', sql.NVarChar, p.mod)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = @Code)
          INSERT INTO Permissions (Id, Code, Name, Module) VALUES (NEWID(), @Code, @Name, @Mod)
        `);
    }
    
    console.log('Seed roles and permissions completed.');

    // Seed Admin user
    const adminEmail = 'admin@demo.vn';
    const result = await pool.request()
      .input('Email', sql.NVarChar, adminEmail)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @Email');

    if (result.recordset.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      await pool.request()
        .input('Email', sql.NVarChar, adminEmail)
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .input('Role', sql.NVarChar, 'Admin')
        .query(`
          INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt)
          VALUES (NEWID(), @Email, @PasswordHash, @Role, GETDATE(), GETDATE())
        `);
      console.log('Seed Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = { initializeDatabase };
