import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getAuthUrl, getTokenFromCode, createMeetEvent, getUpcomingMeetings } from '../services/meetService';

export const getGoogleAuthUrl = (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Google Auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code, userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or userId' });
  }

  try {
    const tokens = await getTokenFromCode(code as string);
    
    await pool.query(
      `UPDATE users SET google_access_token = $1, google_refresh_token = $2 WHERE id = $3`,
      [tokens.access_token, tokens.refresh_token, userId]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}#/classes?success=true&message=Google%20connected%20successfully`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}#/classes?error=Failed%20to%20connect%20Google%20account`);
  }
};

export const createClass = async (req: Request, res: Response) => {
  const { title, description, scheduledAt, duration, subject, attendees } = req.body;
  const teacherId = (req as any).user?.id;

  if (!teacherId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!title || !scheduledAt || !duration) {
    return res.status(400).json({ error: 'Title, scheduled time, and duration are required' });
  }

  try {
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    let meetLink = '';
    let googleEventId = '';
    let accessToken = '';

    const userResult = await pool.query(
      `SELECT google_access_token FROM users WHERE id = $1`,
      [teacherId]
    );

    if (userResult.rows[0]?.google_access_token) {
      accessToken = userResult.rows[0].google_access_token;
      
      try {
        const { meetLink: link, eventId } = await createMeetEvent(
          accessToken,
          title,
          description || `Online class for ${subject || 'General'}`,
          startTime,
          endTime,
          attendees || []
        );
        meetLink = link;
        googleEventId = eventId;
      } catch (googleError) {
        console.error('Google Meet creation failed:', googleError);
        meetLink = `https://meet.google.com/${generateFallbackMeetCode()}`;
      }
    } else {
      meetLink = `https://meet.google.com/${generateFallbackMeetCode()}`;
    }

    const result = await pool.query(
      `INSERT INTO classes 
       (title, description, teacher_id, scheduled_at, duration, meet_link, google_event_id, subject, attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, teacherId, scheduledAt, duration, meetLink, googleEventId, subject, JSON.stringify(attendees || [])]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
};

function generateFallbackMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
}

export const getClasses = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  try {
    let query_text: string;
    let params: any[];

    if (userRole === 'admin') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        ORDER BY c.scheduled_at DESC
      `;
      params = [];
    } else if (userRole === 'teacher') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = $1
        ORDER BY c.scheduled_at DESC
      `;
      params = [userId];
    } else {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email,
               (SELECT COUNT(*) FROM class_attendees ca WHERE ca.class_id = c.id AND ca.student_id = $1) as is_enrolled
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        ORDER BY c.scheduled_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query_text, params);
    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getClassById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  try {
    const result = await pool.query(
      `SELECT c.*, u.name as teacher_name, u.email as teacher_email
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const classData = result.rows[0];

    const attendeesResult = await pool.query(
      `SELECT ca.*, us.name, us.email 
       FROM class_attendees ca
       JOIN users us ON ca.student_id = us.id
       WHERE ca.class_id = $1`,
      [id]
    );

    classData.attendee_list = attendeesResult.rows;

    res.json({ class: classData });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
};

export const updateClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, scheduledAt, duration, subject } = req.body;
  const teacherId = (req as any).user?.id;

  try {
    const checkResult = await pool.query(
      `SELECT teacher_id FROM classes WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (checkResult.rows[0].teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Not authorized to update this class' });
    }

    const result = await pool.query(
      `UPDATE classes 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           scheduled_at = COALESCE($3, scheduled_at),
           duration = COALESCE($4, duration),
           subject = COALESCE($5, subject),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description, scheduledAt, duration, subject, id]
    );

    res.json({
      message: 'Class updated successfully',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  try {
    const checkResult = await pool.query(
      `SELECT teacher_id FROM classes WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (userRole !== 'admin' && checkResult.rows[0].teacher_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this class' });
    }

    await pool.query(`DELETE FROM class_attendees WHERE class_id = $1`, [id]);
    await pool.query(`DELETE FROM classes WHERE id = $1`, [id]);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

export const enrollInClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const studentId = (req as any).user?.id;

  if (!studentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await pool.query(
      `INSERT INTO class_attendees (class_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (class_id, student_id) DO NOTHING`,
      [id, studentId]
    );

    res.json({ message: 'Enrolled in class successfully' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in class' });
  }
};

export const getClassHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  try {
    let query_text: string;
    let params: any[];

    const now = new Date();

    if (userRole === 'admin') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email,
               (SELECT COUNT(*) FROM class_attendees WHERE class_id = c.id) as attendee_count
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.scheduled_at < $1
        ORDER BY c.scheduled_at DESC
      `;
      params = [now];
    } else if (userRole === 'teacher') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email,
               (SELECT COUNT(*) FROM class_attendees WHERE class_id = c.id) as attendee_count
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = $1 AND c.scheduled_at < $2
        ORDER BY c.scheduled_at DESC
      `;
      params = [userId, now];
    } else {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        JOIN class_attendees ca ON c.id = ca.class_id
        WHERE ca.student_id = $1 AND c.scheduled_at < $2
        ORDER BY c.scheduled_at DESC
      `;
      params = [userId, now];
    }

    const result = await pool.query(query_text, params);
    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get class history error:', error);
    res.status(500).json({ error: 'Failed to fetch class history' });
  }
};

export const getUpcomingClasses = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  try {
    const now = new Date();

    let query_text: string;
    let params: any[];

    if (userRole === 'admin') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.scheduled_at >= $1
        ORDER BY c.scheduled_at ASC
      `;
      params = [now];
    } else if (userRole === 'teacher') {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = $1 AND c.scheduled_at >= $2
        ORDER BY c.scheduled_at ASC
      `;
      params = [userId, now];
    } else {
      query_text = `
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        JOIN class_attendees ca ON c.id = ca.class_id
        WHERE ca.student_id = $1 AND c.scheduled_at >= $2
        ORDER BY c.scheduled_at ASC
      `;
      params = [userId, now];
    }

    const result = await pool.query(query_text, params);
    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get upcoming classes error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming classes' });
  }
};
