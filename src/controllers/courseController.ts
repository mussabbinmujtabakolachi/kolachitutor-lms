import { Request, Response } from 'express';
import { pool } from '../config/database';
import path from 'path';

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, teacherId } = req.query;
    
    let query = `
      SELECT c.*, s.name as subject_name, s.icon as subject_icon, u.full_name as teacher_name
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (subjectId) {
      params.push(subjectId);
      query += ` AND c.subject_id = $${params.length}`;
    }
    
    if (teacherId) {
      params.push(teacherId);
      query += ` AND c.teacher_id = $${params.length}`;
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, s.name as subject_name, s.icon as subject_icon, u.full_name as teacher_name
       FROM courses c
       JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, subjectId } = req.body;
    const teacherId = (req as any).user?.id;
    
    let filePath = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;
    
    if (req.file) {
      filePath = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      fileSize = req.file.size;
    }
    
    const result = await pool.query(
      `INSERT INTO courses (title, description, subject_id, teacher_id, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, subjectId, teacherId, filePath, fileName, fileType, fileSize]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const downloadCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    const course = result.rows[0];
    
    if (!course.file_path) {
      res.status(404).json({ error: 'No file available for download' });
      return;
    }
    
    const fileName = course.file_path.split('/').pop();
    const filePath = path.join(__dirname, '../../public/uploads', fileName);
    res.download(filePath, course.file_name);
  } catch (error) {
    console.error('Download course error:', error);
    res.status(500).json({ error: 'Failed to download course' });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
