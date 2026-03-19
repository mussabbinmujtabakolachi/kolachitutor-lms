"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const courses_1 = __importDefault(require("./routes/courses"));
const questions_1 = __importDefault(require("./routes/questions"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const uploadsDir = path_1.default.join(__dirname, '../public/uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/subjects', subjects_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/questions', questions_1.default);
app.use('/api/admin', admin_1.default);
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/html/index.html'));
});
const startServer = async () => {
    try {
        await (0, database_1.initDatabase)();
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        await database_1.pool.query(`
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, 'Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@kolachi.edu.pk', adminPassword]);
        app.listen(PORT, () => {
            console.log(`Kolachi Tutors LMS running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map