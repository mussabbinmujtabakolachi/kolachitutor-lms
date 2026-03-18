export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  avatar?: string;
  qualifications?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  created_at: Date;
}

export interface StudentSubject {
  id: number;
  student_id: number;
  subject_id: number;
  assigned_teacher_id?: number;
  created_at: Date;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  subject_id: number;
  teacher_id?: number;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  thumbnail?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  student_id: number;
  question: string;
  ai_answer?: string;
  subject_id?: number;
  created_at: Date;
}

export interface AuthRequest {
  user?: User;
}
