"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const courseDetailController_1 = require("../controllers/courseDetailController");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.get('/', courseDetailController_1.getAllCourseDetails);
router.get('/:id', courseDetailController_1.getCourseDetails);
router.post('/', auth_1.authenticate, courseDetailController_1.createCourseDetail);
router.put('/:id', auth_1.authenticate, courseDetailController_1.updateCourseDetail);
router.delete('/:id', auth_1.authenticate, courseDetailController_1.deleteCourseDetail);
router.post('/folders', auth_1.authenticate, courseDetailController_1.createFolder);
router.get('/folders/list', courseDetailController_1.getFolders);
router.delete('/folders/:id', auth_1.authenticate, courseDetailController_1.deleteFolder);
router.post('/resources/upload', auth_1.authenticate, upload.single('file'), courseDetailController_1.uploadResource);
router.post('/resources/link', auth_1.authenticate, courseDetailController_1.createLinkResource);
router.get('/resources/list', courseDetailController_1.getResources);
router.delete('/resources/:id', auth_1.authenticate, courseDetailController_1.deleteResource);
router.post('/lessons', auth_1.authenticate, courseDetailController_1.createLesson);
router.get('/lessons/list', courseDetailController_1.getLessons);
router.put('/lessons/:id', auth_1.authenticate, courseDetailController_1.updateLesson);
router.delete('/lessons/:id', auth_1.authenticate, courseDetailController_1.deleteLesson);
exports.default = router;
//# sourceMappingURL=courseDetails.js.map