"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminController_1.getAllUsers);
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminController_1.getDashboardStats);
router.post('/assign-teacher', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminController_1.assignTeacher);
router.get('/assignments', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminController_1.getStudentTeacherAssignments);
router.delete('/users/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminController_1.deleteUser);
router.post('/admin', adminController_1.createAdmin);
exports.default = router;
//# sourceMappingURL=admin.js.map