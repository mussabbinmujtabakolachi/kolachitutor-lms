import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { pool, initDatabase } from './config/database';

import authRoutes from './routes/auth';
import subjectRoutes from './routes/subjects';
import courseRoutes from './routes/courses';
import questionRoutes from './routes/questions';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

const startServer = async () => {
  try {
    await initDatabase();
    
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await pool.query(`
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, 'Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@kolachi.edu.pk', adminPassword]);

    app.listen(PORT, () => {
      console.log(`Kolachi Tutors LMS running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
