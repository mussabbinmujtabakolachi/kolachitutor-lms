"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSubjects = exports.getStudentSubjects = exports.createSubject = exports.getSubject = exports.getSubjects = void 0;
const database_1 = require("../config/database");
const getSubjects = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT * FROM subjects ORDER BY name');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ error: 'Failed to get subjects' });
    }
};
exports.getSubjects = getSubjects;
const getSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.pool.query('SELECT * FROM subjects WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Subject not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: 'Failed to get subject' });
    }
};
exports.getSubject = getSubject;
const createSubject = async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        const result = await database_1.pool.query('INSERT INTO subjects (name, description, icon) VALUES ($1, $2, $3) RETURNING *', [name, description, icon]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
};
exports.createSubject = createSubject;
const getStudentSubjects = async (req, res) => {
    try {
        const studentId = req.user?.id;
        const result = await database_1.pool.query(`SELECT s.*, u.full_name as teacher_name, u.id as teacher_id
       FROM student_subjects ss
       JOIN subjects s ON ss.subject_id = s.id
       LEFT JOIN users u ON ss.assigned_teacher_id = u.id
       WHERE ss.student_id = $1`, [studentId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get student subjects error:', error);
        res.status(500).json({ error: 'Failed to get student subjects' });
    }
};
exports.getStudentSubjects = getStudentSubjects;
const updateStudentSubjects = async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { subjectIds } = req.body;
        await database_1.pool.query('DELETE FROM student_subjects WHERE student_id = $1', [studentId]);
        for (const subjectId of subjectIds) {
            await database_1.pool.query('INSERT INTO student_subjects (student_id, subject_id) VALUES ($1, $2)', [studentId, subjectId]);
        }
        res.json({ message: 'Subjects updated successfully' });
    }
    catch (error) {
        console.error('Update subjects error:', error);
        res.status(500).json({ error: 'Failed to update subjects' });
    }
};
exports.updateStudentSubjects = updateStudentSubjects;
//# sourceMappingURL=subjectController.js.map