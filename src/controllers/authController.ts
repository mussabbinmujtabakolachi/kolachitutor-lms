import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { User } from '../models/types';

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, subjects } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone, created_at',
      [email, hashedPassword, fullName, 'student', phone]
    );

    const user = result.rows[0];

    if (subjects && subjects.length > 0) {
      for (const subjectId of subjects) {
        await pool.query(
          'INSERT INTO student_subjects (student_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, subjectId]
        );
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const registerTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, qualifications, bio } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, role, phone, qualifications, bio) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, role, phone, qualifications, bio, created_at',
      [email, hashedPassword, fullName, 'teacher', phone, qualifications, bio]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        qualifications: user.qualifications,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        qualifications: user.qualifications,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: String(error) });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    const result = await pool.query(
      'SELECT id, email, full_name, role, phone, qualifications, bio, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    if (user.role === 'student') {
      const subjectsResult = await pool.query(
        `SELECT s.id, s.name, s.icon, s.description, 
                u.full_name as teacher_name, u.id as teacher_id,
                ss.id as assignment_id
         FROM student_subjects ss
         JOIN subjects s ON ss.subject_id = s.id
         LEFT JOIN users u ON ss.assigned_teacher_id = u.id
         WHERE ss.student_id = $1`,
        [userId]
      );
      res.json({ ...user, subjects: subjectsResult.rows });
    } else if (user.role === 'teacher') {
      const studentsResult = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone, s.name as subject_name, s.id as subject_id
         FROM student_subjects ss
         JOIN users u ON ss.student_id = u.id
         JOIN subjects s ON ss.subject_id = s.id
         WHERE ss.assigned_teacher_id = $1`,
        [userId]
      );
      res.json({ ...user, students: studentsResult.rows });
    } else {
      res.json(user);
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
