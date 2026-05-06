require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./initDb');
const { swaggerUi, specs } = require('./swagger');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://deloy-ai-recruit.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/cv', require('./routes/cv'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/notifications', require('./routes/notifications'));

// Phục vụ file tĩnh (CV uploads)
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/', (req, res) => {
  res.send('AI Recruitment API is running');
});

// Initialize Database connection and tables
const startServer = async () => {
  try {
    await initializeDatabase();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
