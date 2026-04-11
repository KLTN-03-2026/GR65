import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER || 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // Tắt encrypt cho Local
    trustServerCertificate: true 
  }
};

export const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log('✅ Kết nối SQL Server (AIRecruitDB) thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối CSDL:', err);
    // Không exit ngay để server vẫn chạy và debug được
  }
};

export { sql };
