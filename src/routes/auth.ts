import { Router } from 'express';
import { registerStudent, registerTeacher, login, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register/student', registerStudent);
router.post('/register/teacher', registerTeacher);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

export default router;
