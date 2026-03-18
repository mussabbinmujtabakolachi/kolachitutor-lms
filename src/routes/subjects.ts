import { Router } from 'express';
import { 
  getSubjects, 
  getSubject, 
  createSubject, 
  getStudentSubjects, 
  updateStudentSubjects 
} from '../controllers/subjectController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getSubjects);
router.get('/:id', getSubject);
router.post('/', authenticate, authorize('admin'), createSubject);
router.get('/my/subjects', authenticate, getStudentSubjects);
router.put('/my/subjects', authenticate, authorize('student'), updateStudentSubjects);

export default router;
