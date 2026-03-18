import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
};

export const getSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM subjects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Failed to get subject' });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon } = req.body;
    
    const result = await pool.query(
      'INSERT INTO subjects (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, description, icon]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

export const getStudentSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user?.id;
    
    const result = await pool.query(
      `SELECT s.*, u.full_name as teacher_name, u.id as teacher_id
       FROM student_subjects ss
       JOIN subjects s ON ss.subject_id = s.id
       LEFT JOIN users u ON ss.assigned_teacher_id = u.id
       WHERE ss.student_id = $1`,
      [studentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get student subjects error:', error);
    res.status(500).json({ error: 'Failed to get student subjects' });
  }
};

export const updateStudentSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user?.id;
    const { subjectIds } = req.body;

    await pool.query('DELETE FROM student_subjects WHERE student_id = $1', [studentId]);

    for (const subjectId of subjectIds) {
      await pool.query(
        'INSERT INTO student_subjects (student_id, subject_id) VALUES ($1, $2)',
        [studentId, subjectId]
      );
    }

    res.json({ message: 'Subjects updated successfully' });
  } catch (error) {
    console.error('Update subjects error:', error);
    res.status(500).json({ error: 'Failed to update subjects' });
  }
};
