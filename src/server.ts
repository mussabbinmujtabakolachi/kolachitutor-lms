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
import meetRoutes from './routes/meets';
import courseDetailRoutes from './routes/courseDetails';

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
app.use('/api/meets', meetRoutes);
app.use('/api/course-details', courseDetailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

const startServer = async () => {
  try {
    console.log('Connecting to database...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('RENDER:', process.env.RENDER);
    if (process.env.DATABASE_URL) {
      const maskedUrl = process.env.DATABASE_URL.replace(/\/\/.*@/, '//***@');
      console.log('DATABASE_URL (masked):', maskedUrl);
      // Check for truncated render.com hostname
      if (process.env.DATABASE_URL.includes('render.com') === false && process.env.RENDER === 'true') {
        console.error('='.repeat(60));
        console.error('DATABASE_URL ERROR: Missing .render.com in hostname!');
        console.error('The hostname appears to be truncated.');
        console.error('Please go to Render dashboard:');
        console.error('1. Click your PostgreSQL database');
        console.error('2. Copy the FULL Internal Database URL');
        console.error('3. Paste it into your Web Service > Environment > DATABASE_URL');
        console.error('='.repeat(60));
      }
    } else {
      console.log('No DATABASE_URL found, using local config');
    }
    
    await initDatabase();
    console.log('Database connected and initialized');
    
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await pool.query(`
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, 'Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@kolachi.edu.pk', adminPassword]);
    
    console.log('Admin user ensured');
  } catch (error: any) {
    console.error('Database initialization error:', error.message);
    if (error.message && error.message.includes('ENOTFOUND')) {
      console.error('This is a DNS error - DATABASE_URL hostname is invalid or truncated!');
      console.error('Please check your Render dashboard and update DATABASE_URL.');
    }
  }

  app.listen(PORT, () => {
    console.log(`Kolachi Tutors LMS running on port ${PORT}`);
  });
};

startServer();
