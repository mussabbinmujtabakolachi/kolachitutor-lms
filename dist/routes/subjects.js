"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectController_1 = require("../controllers/subjectController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', subjectController_1.getSubjects);
router.get('/:id', subjectController_1.getSubject);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), subjectController_1.createSubject);
router.get('/my/subjects', auth_1.authenticate, subjectController_1.getStudentSubjects);
router.put('/my/subjects', auth_1.authenticate, (0, auth_1.authorize)('student'), subjectController_1.updateStudentSubjects);
exports.default = router;
//# sourceMappingURL=subjects.js.map