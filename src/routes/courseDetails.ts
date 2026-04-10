import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import {
  getCourseDetails,
  getAllCourseDetails,
  createCourseDetail,
  updateCourseDetail,
  deleteCourseDetail,
  createFolder,
  getFolders,
  deleteFolder,
  uploadResource,
  createLinkResource,
  getResources,
  deleteResource,
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson
} from '../controllers/courseDetailController';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const router = Router();

router.get('/', getAllCourseDetails);
router.get('/:id', getCourseDetails);
router.post('/', authenticate, createCourseDetail);
router.put('/:id', authenticate, updateCourseDetail);
router.delete('/:id', authenticate, deleteCourseDetail);

router.post('/folders', authenticate, createFolder);
router.get('/folders/list', getFolders);
router.delete('/folders/:id', authenticate, deleteFolder);

router.post('/resources/upload', authenticate, upload.single('file'), uploadResource);
router.post('/resources/link', authenticate, createLinkResource);
router.get('/resources/list', getResources);
router.delete('/resources/:id', authenticate, deleteResource);

router.post('/lessons', authenticate, createLesson);
router.get('/lessons/list', getLessons);
router.put('/lessons/:id', authenticate, updateLesson);
router.delete('/lessons/:id', authenticate, deleteLesson);

export default router;
