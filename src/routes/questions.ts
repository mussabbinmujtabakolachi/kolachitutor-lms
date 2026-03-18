import { Router } from 'express';
import { 
  askQuestion, 
  getQuestions, 
  searchQuestions,
  getAllQuestions 
} from '../controllers/questionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('student'), askQuestion);
router.get('/', authenticate, getQuestions);
router.get('/search', searchQuestions);
router.get('/all', authenticate, authorize('admin', 'teacher'), getAllQuestions);

export default router;
