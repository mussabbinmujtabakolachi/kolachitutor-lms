"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLesson = exports.updateLesson = exports.getLessons = exports.createLesson = exports.deleteResource = exports.getResources = exports.createLinkResource = exports.uploadResource = exports.deleteFolder = exports.getFolders = exports.createFolder = exports.deleteCourseDetail = exports.updateCourseDetail = exports.createCourseDetail = exports.getAllCourseDetails = exports.getCourseDetails = void 0;
const database_1 = require("../config/database");
const getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const courseResult = await database_1.pool.query(`SELECT cd.*, u.full_name as teacher_name 
       FROM course_details cd
       LEFT JOIN users u ON cd.teacher_id = u.id
       WHERE cd.id = $1`, [id]);
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const foldersResult = await database_1.pool.query(`SELECT * FROM course_folders WHERE course_id = $1 ORDER BY name`, [id]);
        const resourcesResult = await database_1.pool.query(`SELECT cr.*, cf.name as folder_name
       FROM course_resources cr
       LEFT JOIN course_folders cf ON cr.folder_id = cf.id
       WHERE cr.course_id = $1
       ORDER BY cr.created_at DESC`, [id]);
        const lessonsResult = await database_1.pool.query(`SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index`, [id]);
        res.json({
            course: courseResult.rows[0],
            folders: foldersResult.rows,
            resources: resourcesResult.rows,
            lessons: lessonsResult.rows
        });
    }
    catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({ error: 'Failed to get course details' });
    }
};
exports.getCourseDetails = getCourseDetails;
const getAllCourseDetails = async (req, res) => {
    const userId = req.user?.id;
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
            query += ` WHERE cd.teacher_id = $1`;
            const result = await database_1.pool.query(query + ` ORDER BY cd.created_at DESC`, [userId]);
            return res.json(result.rows);
        }
        const result = await database_1.pool.query(query + ` ORDER BY cd.created_at DESC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get all courses error:', error);
        res.status(500).json({ error: 'Failed to get courses' });
    }
};
exports.getAllCourseDetails = getAllCourseDetails;
const createCourseDetail = async (req, res) => {
    const { title, description, subject, thumbnail, isPublished } = req.body;
    const teacherId = req.user?.id;
    try {
        const result = await database_1.pool.query(`INSERT INTO course_details (title, description, subject, thumbnail, teacher_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [title, description, subject, thumbnail, teacherId, isPublished || false]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
};
exports.createCourseDetail = createCourseDetail;
const updateCourseDetail = async (req, res) => {
    const { id } = req.params;
    const { title, description, subject, thumbnail, isPublished } = req.body;
    try {
        const result = await database_1.pool.query(`UPDATE course_details 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           subject = COALESCE($3, subject),
           thumbnail = COALESCE($4, thumbnail),
           is_published = COALESCE($5, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`, [title, description, subject, thumbnail, isPublished, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
};
exports.updateCourseDetail = updateCourseDetail;
const deleteCourseDetail = async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.pool.query('DELETE FROM course_details WHERE id = $1', [id]);
        res.json({ message: 'Course deleted successfully' });
    }
    catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
};
exports.deleteCourseDetail = deleteCourseDetail;
const createFolder = async (req, res) => {
    const { name, courseId, parentId } = req.body;
    try {
        const result = await database_1.pool.query(`INSERT INTO course_folders (name, course_id, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`, [name, courseId, parentId || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
};
exports.createFolder = createFolder;
const getFolders = async (req, res) => {
    const { courseId } = req.query;
    try {
        let query = `SELECT * FROM course_folders`;
        let params = [];
        if (courseId) {
            query += ` WHERE course_id = $1`;
            params = [courseId];
        }
        query += ` ORDER BY name`;
        const result = await database_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({ error: 'Failed to get folders' });
    }
};
exports.getFolders = getFolders;
const deleteFolder = async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.pool.query('DELETE FROM course_folders WHERE id = $1', [id]);
        res.json({ message: 'Folder deleted successfully' });
    }
    catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
};
exports.deleteFolder = deleteFolder;
const uploadResource = async (req, res) => {
    const { title, folderId, courseId, resourceType } = req.body;
    const uploadedBy = req.user?.id;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const fileUrl = `/uploads/${file.filename}`;
        const result = await database_1.pool.query(`INSERT INTO course_resources (title, file_path, file_name, file_type, file_size, folder_id, course_id, uploaded_by, resource_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [title, fileUrl, file.originalname, file.mimetype, file.size, folderId || null, courseId, uploadedBy, resourceType || 'file']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({ error: 'Failed to upload resource' });
    }
};
exports.uploadResource = uploadResource;
const createLinkResource = async (req, res) => {
    const { title, linkUrl, courseId, folderId } = req.body;
    const uploadedBy = req.user?.id;
    try {
        const result = await database_1.pool.query(`INSERT INTO course_resources (title, file_path, resource_type, folder_id, course_id, uploaded_by)
       VALUES ($1, $2, 'link', $3, $4, $5)
       RETURNING *`, [title, linkUrl, folderId || null, courseId, uploadedBy]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create link error:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
};
exports.createLinkResource = createLinkResource;
const getResources = async (req, res) => {
    const { courseId, folderId } = req.query;
    try {
        let query = `
      SELECT cr.*, cf.name as folder_name, u.full_name as uploaded_by_name
      FROM course_resources cr
      LEFT JOIN course_folders cf ON cr.folder_id = cf.id
      LEFT JOIN users u ON cr.uploaded_by = u.id
      WHERE 1=1
    `;
        const params = [];
        if (courseId) {
            params.push(courseId);
            query += ` AND cr.course_id = $${params.length}`;
        }
        if (folderId) {
            params.push(folderId);
            query += ` AND cr.folder_id = $${params.length}`;
        }
        query += ` ORDER BY cr.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ error: 'Failed to get resources' });
    }
};
exports.getResources = getResources;
const deleteResource = async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.pool.query('DELETE FROM course_resources WHERE id = $1', [id]);
        res.json({ message: 'Resource deleted successfully' });
    }
    catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({ error: 'Failed to delete resource' });
    }
};
exports.deleteResource = deleteResource;
const createLesson = async (req, res) => {
    const { title, content, courseId, orderIndex } = req.body;
    try {
        const result = await database_1.pool.query(`INSERT INTO course_lessons (title, content, course_id, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [title, content, courseId, orderIndex || 0]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create lesson error:', error);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
};
exports.createLesson = createLesson;
const getLessons = async (req, res) => {
    const { courseId } = req.query;
    try {
        const result = await database_1.pool.query(`SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index`, [courseId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ error: 'Failed to get lessons' });
    }
};
exports.getLessons = getLessons;
const updateLesson = async (req, res) => {
    const { id } = req.params;
    const { title, content, orderIndex } = req.body;
    try {
        const result = await database_1.pool.query(`UPDATE course_lessons 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           order_index = COALESCE($3, order_index)
       WHERE id = $4
       RETURNING *`, [title, content, orderIndex, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
};
exports.updateLesson = updateLesson;
const deleteLesson = async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.pool.query('DELETE FROM course_lessons WHERE id = $1', [id]);
        res.json({ message: 'Lesson deleted successfully' });
    }
    catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
};
exports.deleteLesson = deleteLesson;
//# sourceMappingURL=courseDetailController.js.map