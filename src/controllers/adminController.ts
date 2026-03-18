import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    
    let query = 'SELECT id, email, full_name, role, phone, created_at FROM users';
    const params: any[] = [];
    
    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const teacherCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
    const courseCount = await pool.query('SELECT COUNT(*) as count FROM courses');
    const questionCount = await pool.query('SELECT COUNT(*) as count FROM questions');
    
    res.json({
      students: parseInt(studentCount.rows[0].count),
      teachers: parseInt(teacherCount.rows[0].count),
      courses: parseInt(courseCount.rows[0].count),
      questions: parseInt(questionCount.rows[0].count)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

export const assignTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, subjectId, teacherId } = req.body;
    
    const result = await pool.query(
      `UPDATE student_subjects 
       SET assigned_teacher_id = $1 
       WHERE student_id = $2 AND subject_id = $3 
       RETURNING *`,
      [teacherId, studentId, subjectId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Student subject assignment not found' });
      return;
    }
    
    res.json({
      message: 'Teacher assigned successfully',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
};

export const getStudentTeacherAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT ss.id, u.full_name as student_name, u.email as student_email,
              s.name as subject_name, s.id as subject_id,
              t.full_name as teacher_name, t.id as teacher_id
       FROM student_subjects ss
       JOIN users u ON ss.student_id = u.id
       JOIN subjects s ON ss.subject_id = s.id
       LEFT JOIN users t ON ss.assigned_teacher_id = t.id
       ORDER BY u.full_name, s.name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, hashedPassword, fullName, 'admin']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};
