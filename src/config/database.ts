import { Pool } from 'pg';

let poolConfig: any;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kolachi_lms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export const pool = new Pool(poolConfig);

export const initDatabase = async () => {
  const client = await pool.connect();
  console.log('Database connection established');
  try {
    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        avatar VARCHAR(255),
        qualifications TEXT,
        bio TEXT,
        google_access_token TEXT,
        google_refresh_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_subjects (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        assigned_teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, subject_id)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size BIGINT,
        thumbnail VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        ai_answer TEXT,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        scheduled_at TIMESTAMP NOT NULL,
        duration INTEGER DEFAULT 60,
        meet_link VARCHAR(500),
        google_event_id VARCHAR(255),
        subject VARCHAR(255),
        attendees JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS class_attendees (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attended BOOLEAN DEFAULT FALSE,
        UNIQUE(class_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS course_details (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail VARCHAR(255),
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS course_folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course_id INTEGER REFERENCES course_details(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES course_folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS course_resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size BIGINT,
        resource_type VARCHAR(50) DEFAULT 'file',
        folder_id INTEGER REFERENCES course_folders(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES course_details(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS course_lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        course_id INTEGER REFERENCES course_details(id) ON DELETE CASCADE,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created');

    console.log('Inserting subjects...');
    await client.query(`
      INSERT INTO subjects (name, description, icon) VALUES
        ('Mathematics', 'Advanced Mathematics courses', '📐'),
        ('Physics', 'Physics and Applied Physics', '⚛️'),
        ('Chemistry', 'Chemistry and Organic Chemistry', '🧪'),
        ('Biology', 'Biology and Life Sciences', '🧬'),
        ('Computer Science', 'Programming and IT', '💻'),
        ('English', 'English Language and Literature', '📚'),
        ('Urdu', 'Urdu Language and Literature', '📖'),
        ('Pakistan Studies', 'History and Geography of Pakistan', '🇵🇰'),
        ('Islamic Studies', 'Islamic Education', '🕌'),
        ('Economics', 'Economics and Commerce', '📈')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Subjects inserted');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};
