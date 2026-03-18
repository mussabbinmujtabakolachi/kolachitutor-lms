# Kolachi Tutors LMS - Specification Document

## 1. Project Overview

**Project Name:** Kolachi Tutors LMS  
**Project Type:** Full-stack Learning Management System  
**Core Functionality:** A comprehensive platform for managing courses, students, teachers, with AI-powered question answering and course content management  
**Target Users:** Students, Teachers, Administrators

## 2. Tech Stack

- **Frontend:** HTML5, CSS3 (with 3D animations), Vanilla JavaScript/TypeScript
- **Backend:** Node.js with Express.js & TypeScript
- **Database:** PostgreSQL
- **AI Integration:** OpenAI API for question answering
- **File Storage:** Local filesystem with multer

## 3. UI/UX Specification

### Color Palette
- **Primary Background:** #0a0a0a (Deep Black)
- **Secondary Background:** #1a1a1a (Dark Gray)
- **Card Background:** #252525 (Charcoal)
- **Primary Accent:** #ff6b00 (Vibrant Orange)
- **Secondary Accent:** #ff8c00 (Light Orange)
- **Text Primary:** #ffffff (White)
- **Text Secondary:** #b0b0b0 (Light Gray)
- **Success:** #00d26a (Green)
- **Error:** #ff3333 (Red)
- **Border:** #333333 (Dark Border)

### Typography
- **Primary Font:** 'Orbitron', sans-serif (Headings)
- **Secondary Font:** 'Rajdhani', sans-serif (Body)
- **Heading Sizes:** H1: 48px, H2: 36px, H3: 28px, H4: 22px
- **Body Size:** 16px
- **Small Text:** 14px

### Layout Structure
- **Header:** Fixed navigation with logo, nav links, user menu
- **Hero Section:** 3D animated welcome screen
- **Content Areas:** Responsive grid layouts
- **Footer:** Links, copyright, social icons

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### 3D Animations
- 3D card flips on hover
- Floating particles background
- 3D button effects with transform
- Animated gradient borders
- 3D modal windows
- Smooth page transitions
- 3D rotating elements
- Parallax scrolling effects

## 4. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'student', 'teacher', 'admin'
  phone VARCHAR(20),
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subjects Table
```sql
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Student_Subjects Table
```sql
CREATE TABLE student_subjects (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  subject_id INTEGER REFERENCES subjects(id),
  assigned_teacher_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Courses Table
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  thumbnail VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  question TEXT NOT NULL,
  ai_answer TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Functionality Specification

### 5.1 Authentication
- Student registration with form (name, email, password, phone, subjects)
- Teacher registration form
- Login system with role-based access
- Session management with JWT

### 5.2 Student Features
- Sign up with subject selection (multi-select)
- View assigned courses
- Download course materials
- Ask questions with AI-powered answers
- View teacher assignments

### 5.3 Teacher Features
- Register as teacher
- View assigned students
- Upload course materials
- View courses

### 5.4 Admin Features
- Dashboard with statistics
- Assign teachers to student subjects
- Manage all users
- View all courses
- Upload courses

### 5.5 Course Management
- Upload courses (PDF, video, documents)
- Download courses
- Course categories by subject
- Course thumbnails

### 5.6 AI Question Search
- Search bar for questions
- AI-powered answers using OpenAI
- Question history
- Subject-based filtering

## 6. Pages Structure

1. **index.html** - Landing page with 3D hero
2. **login.html** - Login form
3. **student-register.html** - Student registration with subject selection
4. **teacher-register.html** - Teacher registration
5. **dashboard.html** - Main dashboard (role-based)
6. **courses.html** - Course listing and upload/download
7. **questions.html** - AI question search
8. **admin.html** - Admin panel for teacher assignment
9. **profile.html** - User profile

## 7. Acceptance Criteria

- [ ] Student can register and select multiple subjects
- [ ] Teacher can register with qualification details
- [ ] Admin can assign teachers to student subjects
- [ ] Courses can be uploaded and downloaded
- [ ] AI returns relevant answers to questions
- [ ] 3D animations work smoothly
- [ ] All pages are responsive
- [ ] Black/orange/white theme is consistent
- [ ] Database operations work correctly
- [ ] Role-based access control works
