"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const meetController_1 = require("../controllers/meetController");
const router = (0, express_1.Router)();
router.get('/auth/google', meetController_1.getGoogleAuthUrl);
router.get('/auth/google/callback', meetController_1.googleCallback);
router.post('/', auth_1.authenticate, meetController_1.createClass);
router.get('/', auth_1.authenticate, meetController_1.getClasses);
router.get('/upcoming', auth_1.authenticate, meetController_1.getUpcomingClasses);
router.get('/history', auth_1.authenticate, meetController_1.getClassHistory);
router.get('/:id', auth_1.authenticate, meetController_1.getClassById);
router.put('/:id', auth_1.authenticate, meetController_1.updateClass);
router.delete('/:id', auth_1.authenticate, meetController_1.deleteClass);
router.post('/:id/enroll', auth_1.authenticate, meetController_1.enrollInClass);
exports.default = router;
//# sourceMappingURL=meets.js.map