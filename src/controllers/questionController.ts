import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getAIAnswer } from '../services/aiService';

export const askQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user?.id;
    const { question, subjectId } = req.body;
    
    const subjectResult = await pool.query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
    const subjectName = subjectResult.rows[0]?.name;
    
    const aiAnswer = await getAIAnswer(question, subjectName);
    
    const result = await pool.query(
      'INSERT INTO questions (student_id, question, ai_answer, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [studentId, question, aiAnswer, subjectId]
    );
    
    res.status(201).json({
      question: result.rows[0],
      answer: aiAnswer
    });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to ask question' });
  }
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user?.id;
    
    const result = await pool.query(
      `SELECT q.*, s.name as subject_name, s.icon as subject_icon
       FROM questions q
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE q.student_id = $1
       ORDER BY q.created_at DESC`,
      [studentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

export const searchQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, subjectId } = req.query;
    
    if (!q) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }
    
    let subjectName = null;
    if (subjectId) {
      const subjectResult = await pool.query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
      subjectName = subjectResult.rows[0]?.name;
    }
    
    const aiAnswer = await getAIAnswer(q as string, subjectName || undefined);
    
    res.json({
      query: q,
      answer: aiAnswer,
      subject: subjectName
    });
  } catch (error) {
    console.error('Search questions error:', error);
    res.status(500).json({ error: 'Failed to search questions' });
  }
};

export const getAllQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT q.*, u.full_name as student_name, s.name as subject_name
       FROM questions q
       JOIN users u ON q.student_id = u.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       ORDER BY q.created_at DESC
       LIMIT 100`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};
