"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const courseController_1 = require("../controllers/courseController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});
router.get('/', courseController_1.getCourses);
router.get('/:id', courseController_1.getCourse);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'teacher'), upload.single('file'), courseController_1.createCourse);
router.get('/:id/download', auth_1.authenticate, courseController_1.downloadCourse);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'teacher'), courseController_1.deleteCourse);
exports.default = router;
//# sourceMappingURL=courses.js.map