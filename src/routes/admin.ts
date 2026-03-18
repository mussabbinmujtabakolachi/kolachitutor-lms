import { Router } from 'express';
import { 
  getAllUsers, 
  getDashboardStats, 
  assignTeacher,
  getStudentTeacherAssignments,
  deleteUser,
  createAdmin 
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/stats', authenticate, authorize('admin'), getDashboardStats);
router.post('/assign-teacher', authenticate, authorize('admin'), assignTeacher);
router.get('/assignments', authenticate, authorize('admin'), getStudentTeacherAssignments);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.post('/admin', createAdmin);

export default router;
