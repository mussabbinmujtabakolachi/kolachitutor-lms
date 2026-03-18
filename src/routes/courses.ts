import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  getCourses, 
  getCourse, 
  createCourse, 
  downloadCourse,
  deleteCourse 
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authenticate, authorize('admin', 'teacher'), upload.single('file'), createCourse);
router.get('/:id/download', authenticate, downloadCourse);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), deleteCourse);

export default router;
