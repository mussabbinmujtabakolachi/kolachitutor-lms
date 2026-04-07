import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGoogleAuthUrl,
  googleCallback,
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  enrollInClass,
  getClassHistory,
  getUpcomingClasses
} from '../controllers/meetController';

const router = Router();

router.get('/auth/google', getGoogleAuthUrl);
router.get('/auth/google/callback', googleCallback);

router.post('/', authenticate, createClass);
router.get('/', authenticate, getClasses);
router.get('/upcoming', authenticate, getUpcomingClasses);
router.get('/history', authenticate, getClassHistory);
router.get('/:id', authenticate, getClassById);
router.put('/:id', authenticate, updateClass);
router.delete('/:id', authenticate, deleteClass);
router.post('/:id/enroll', authenticate, enrollInClass);

export default router;
