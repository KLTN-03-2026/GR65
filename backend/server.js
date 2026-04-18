require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./initDb');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Database connection and tables
initializeDatabase();

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/cv', require('./routes/cv'));
app.use('/api/applications', require('./routes/applications'));

// Phục vụ file tĩnh (CV uploads)
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/', (req, res) => {
  res.send('AI Recruitment API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
