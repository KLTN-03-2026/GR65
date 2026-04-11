import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

// Các module định tuyến
import authRoutes from './routes/auth';
import cvRoutes from './routes/cv';
import jobRoutes from './routes/jobs';
import employerRoutes from './routes/employers';
import profileRoutes from './routes/profile';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Phục vụ file ảnh/CV tĩnh

// Kết nối SQL Server
connectDB();

// Thiết lập các Route API
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('AIRecruit API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server Backend đã khởi động tại: http://localhost:${PORT}`);
});
