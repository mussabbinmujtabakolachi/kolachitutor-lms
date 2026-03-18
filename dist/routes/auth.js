"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register/student', authController_1.registerStudent);
router.post('/register/teacher', authController_1.registerTeacher);
router.post('/login', authController_1.login);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map