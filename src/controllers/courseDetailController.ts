import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getCourseDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const courseResult = await pool.query(
      `SELECT cd.*, u.full_name as teacher_name 
       FROM course_details cd
       LEFT JOIN users u ON cd.teacher_id = u.id
       WHERE cd.id = $1`,
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const foldersResult = await pool.query(
      `SELECT * FROM course_folders WHERE course_id = $1 ORDER BY name`,
      [id]
    );

    const resourcesResult = await pool.query(
      `SELECT cr.*, cf.name as folder_name
       FROM course_resources cr
       LEFT JOIN course_folders cf ON cr.folder_id = cf.id
       WHERE cr.course_id = $1
       ORDER BY cr.created_at DESC`,
      [id]
    );

    const lessonsResult = await pool.query(
      `SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index`,
      [id]
    );

    res.json({
      course: courseResult.rows[0],
      folders: foldersResult.rows,
      resources: resourcesResult.rows,
      lessons: lessonsResult.rows
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Failed to get course details' });
  }
};

export const getAllCourseDetails = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  const { myCourses } = req.query;

  try {
    let query = `
      SELECT cd.*, u.full_name as teacher_name,
              (SELECT COUNT(*) FROM course_folders WHERE course_id = cd.id) as folder_count,
              (SELECT COUNT(*) FROM course_resources WHERE course_id = cd.id) as resource_count
       FROM course_details cd
       LEFT JOIN users u ON cd.teacher_id = u.id
    `;
    
    if (myCourses === 'true' && userId) {
      if (userRole === 'admin') {
        const result = await pool.query(query + ` ORDER BY cd.created_at DESC`);
        return res.json(result.rows);
      }
      query += ` WHERE cd.teacher_id = $1`;
      const result = await pool.query(query + ` ORDER BY cd.created_at DESC`, [userId]);
      return res.json(result.rows);
    }
    
    const result = await pool.query(query + ` ORDER BY cd.created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
};

export const createCourseDetail = async (req: Request, res: Response) => {
  const { title, description, subject, thumbnail, isPublished } = req.body;
  const teacherId = (req as any).user?.id;

  try {
    const result = await pool.query(
      `INSERT INTO course_details (title, description, subject, thumbnail, teacher_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, subject, thumbnail, teacherId, isPublished || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const updateCourseDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, subject, thumbnail, isPublished } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_details 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           subject = COALESCE($3, subject),
           thumbnail = COALESCE($4, thumbnail),
           is_published = COALESCE($5, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description, subject, thumbnail, isPublished, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourseDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM course_details WHERE id = $1', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

export const createFolder = async (req: Request, res: Response) => {
  const { name, courseId, parentId } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO course_folders (name, course_id, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, courseId, parentId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

export const getFolders = async (req: Request, res: Response) => {
  const { courseId } = req.query;

  try {
    let query = `SELECT * FROM course_folders`;
    let params: any[] = [];
    
    if (courseId) {
      query += ` WHERE course_id = $1`;
      params = [courseId];
    }
    
    query += ` ORDER BY name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM course_folders WHERE id = $1', [id]);
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

export const uploadResource = async (req: Request, res: Response) => {
  const { title, folderId, courseId, resourceType } = req.body;
  const uploadedBy = (req as any).user?.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileUrl = `/uploads/${file.filename}`;
    
    const result = await pool.query(
      `INSERT INTO course_resources (title, file_path, file_name, file_type, file_size, folder_id, course_id, uploaded_by, resource_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, fileUrl, file.originalname, file.mimetype, file.size, folderId || null, courseId, uploadedBy, resourceType || 'file']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
};

export const createLinkResource = async (req: Request, res: Response) => {
  const { title, linkUrl, courseId, folderId } = req.body;
  const uploadedBy = (req as any).user?.id;

  try {
    const result = await pool.query(
      `INSERT INTO course_resources (title, file_path, resource_type, folder_id, course_id, uploaded_by)
       VALUES ($1, $2, 'link', $3, $4, $5)
       RETURNING *`,
      [title, linkUrl, folderId || null, courseId, uploadedBy]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
};

export const getResources = async (req: Request, res: Response) => {
  const { courseId, folderId } = req.query;

  try {
    let query = `
      SELECT cr.*, cf.name as folder_name, u.full_name as uploaded_by_name
      FROM course_resources cr
      LEFT JOIN course_folders cf ON cr.folder_id = cf.id
      LEFT JOIN users u ON cr.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (courseId) {
      params.push(courseId);
      query += ` AND cr.course_id = $${params.length}`;
    }
    
    if (folderId) {
      params.push(folderId);
      query += ` AND cr.folder_id = $${params.length}`;
    }
    
    query += ` ORDER BY cr.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get resources' });
  }
};

export const deleteResource = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM course_resources WHERE id = $1', [id]);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

export const createLesson = async (req: Request, res: Response) => {
  const { title, content, courseId, orderIndex } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO course_lessons (title, content, course_id, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, courseId, orderIndex || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

export const getLessons = async (req: Request, res: Response) => {
  const { courseId } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index`,
      [courseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to get lessons' });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, orderIndex } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_lessons 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           order_index = COALESCE($3, order_index)
       WHERE id = $4
       RETURNING *`,
      [title, content, orderIndex, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM course_lessons WHERE id = $1', [id]);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

export const getFolderContents = async (req: Request, res: Response) => {
  const { courseId, folderId } = req.query;

  try {
    let foldersQuery = `SELECT * FROM course_folders WHERE course_id = $1`;
    let foldersParams = [courseId];

    if (folderId && folderId !== 'root') {
      foldersQuery += ` AND parent_id = $2`;
      foldersParams.push(folderId);
    } else {
      foldersQuery += ` AND parent_id IS NULL`;
    }
    foldersQuery += ` ORDER BY name`;

    const foldersResult = await pool.query(foldersQuery, foldersParams);

    let resourcesQuery = `
      SELECT cr.*, u.full_name as uploaded_by_name
      FROM course_resources cr
      LEFT JOIN users u ON cr.uploaded_by = u.id
      WHERE cr.course_id = $1
    `;
    let resourcesParams = [courseId];

    if (folderId && folderId !== 'root') {
      resourcesQuery += ` AND cr.folder_id = $2`;
      resourcesParams.push(folderId);
    } else {
      resourcesQuery += ` AND cr.folder_id IS NULL`;
    }
    resourcesQuery += ` ORDER BY cr.title`;

    const resourcesResult = await pool.query(resourcesQuery, resourcesParams);

    res.json({
      folders: foldersResult.rows,
      resources: resourcesResult.rows
    });
  } catch (error) {
    console.error('Get folder contents error:', error);
    res.status(500).json({ error: 'Failed to get folder contents' });
  }
};

export const renameFolder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_folders SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
};

export const moveFolder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { parentId } = req.body;

  if (parentId) {
    const cycleCheck = await pool.query(
      `WITH RECURSIVE folder_tree AS (
        SELECT id, parent_id FROM course_folders WHERE id = $1
        UNION ALL
        SELECT f.id, f.parent_id FROM course_folders f
        INNER JOIN folder_tree ft ON f.id = ft.parent_id
      ) SELECT id FROM folder_tree WHERE id = $2`,
      [id, parentId]
    );
    if (cycleCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE course_folders SET parent_id = $1 WHERE id = $2 RETURNING *`,
      [parentId || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ error: 'Failed to move folder' });
  }
};

export const moveResource = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { folderId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_resources SET folder_id = $1 WHERE id = $2 RETURNING *`,
      [folderId || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Move resource error:', error);
    res.status(500).json({ error: 'Failed to move resource' });
  }
};

export const getFolderPath = async (req: Request, res: Response) => {
  const { folderId } = req.query;

  try {
    const path: any[] = [];
    let currentId = folderId;

    while (currentId) {
      const result = await pool.query(
        `SELECT id, name, parent_id, course_id FROM course_folders WHERE id = $1`,
        [currentId]
      );
      if (result.rows.length === 0) break;
      const folder = result.rows[0];
      path.unshift({ id: folder.id, name: folder.name, courseId: folder.course_id });
      currentId = folder.parent_id;
    }

    if (folderId) {
      const courseResult = await pool.query(
        `SELECT id, title FROM course_details WHERE id = (SELECT course_id FROM course_folders WHERE id = $1)`,
        [folderId]
      );
      if (courseResult.rows.length > 0) {
        path.unshift({ id: courseResult.rows[0].id, name: courseResult.rows[0].title, isCourse: true });
      }
    }

    res.json(path);
  } catch (error) {
    console.error('Get folder path error:', error);
    res.status(500).json({ error: 'Failed to get folder path' });
  }
};

export const getAllFoldersTree = async (req: Request, res: Response) => {
  const { courseId } = req.query;

  try {
    const result = await pool.query(
      `SELECT id, name, parent_id, course_id FROM course_folders WHERE course_id = $1 ORDER BY name`,
      [courseId]
    );

    const buildTree = (parentId: number | null): any[] => {
      return result.rows
        .filter(f => f.parent_id === parentId)
        .map(f => ({
          ...f,
          children: buildTree(f.id)
        }));
    };

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    console.error('Get folders tree error:', error);
    res.status(500).json({ error: 'Failed to get folders tree' });
  }
};

export const renameResource = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_resources SET title = $1 WHERE id = $2 RETURNING *`,
      [title, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Rename resource error:', error);
    res.status(500).json({ error: 'Failed to rename resource' });
  }
};
