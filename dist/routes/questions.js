"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const questionController_1 = require("../controllers/questionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('student'), questionController_1.askQuestion);
router.get('/', auth_1.authenticate, questionController_1.getQuestions);
router.get('/search', questionController_1.searchQuestions);
router.get('/all', auth_1.authenticate, (0, auth_1.authorize)('admin', 'teacher'), questionController_1.getAllQuestions);
exports.default = router;
//# sourceMappingURL=questions.js.map