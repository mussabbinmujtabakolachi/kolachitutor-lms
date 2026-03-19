const API_URL = window.location.origin + '/api';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  checkAuth();
  setupEventListeners();
});

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    
    const sizes = [15, 20, 25, 30, 35, 40, 50];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    container.appendChild(particle);
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    fetchProfile();
  }
}

async function fetchProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      currentUser = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        phone: data.phone,
        qualifications: data.qualifications,
        bio: data.bio
      };
      updateUIForLoggedInUser();
    } else {
      logout();
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
  }
}

function updateUIForLoggedInUser() {
  const authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) return;

  if (currentUser && currentUser.fullName) {
    authButtons.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-secondary" onclick="toggleDropdown()">
          <div class="avatar">${currentUser.fullName.charAt(0)}</div>
          ${currentUser.fullName}
        </button>
        <div class="dropdown-menu" id="userDropdown">
          <a class="dropdown-item" href="#dashboard">Dashboard</a>
          <a class="dropdown-item" href="#courses">My Courses</a>
          <a class="dropdown-item" href="#questions">Questions</a>
          ${currentUser.role === 'admin' ? '<a class="dropdown-item" href="#admin">Admin Panel</a>' : ''}
          <a class="dropdown-item" onclick="logout()">Logout</a>
        </div>
      </div>
    `;
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown?.classList.toggle('active');
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !e.target.closest('.dropdown')) {
      dropdown.classList.remove('active');
    }
  });

  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  mobileMenuBtn?.addEventListener('click', () => {
    const mobileNav = document.querySelector('.mobile-nav');
    mobileNav?.classList.toggle('active');
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId)?.classList.add('active');

  const hash = pageId === 'home' ? '' : pageId;
  window.location.hash = hash;

  window.scrollTo(0, 0);

  if (pageId === 'courses') {
    loadCoursesForStudent();
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      updateUIForLoggedInUser();
      showToast('Login successful!', 'success');
      showPage('dashboard');
      loadDashboardData();
    } else {
      const data = await response.json();
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Login failed: ' + error.message, 'error');
  }
}

async function registerStudent(formData) {
  try {
    const response = await fetch(`${API_URL}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      updateUIForLoggedInUser();
      showToast('Registration successful!', 'success');
      showPage('dashboard');
      loadDashboardData();
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Registration failed', 'error');
  }
}

async function registerTeacher(formData) {
  try {
    const response = await fetch(`${API_URL}/auth/register/teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      updateUIForLoggedInUser();
      showToast('Registration successful!', 'success');
      showPage('dashboard');
      loadDashboardData();
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Registration failed', 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  showToast('Logged out successfully', 'success');
  showPage('home');
  
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.innerHTML = `
      <a href="#login" class="btn btn-secondary">Login</a>
      <a href="#student-register" class="btn btn-primary">Sign Up</a>
    `;
  }
}

async function loadSubjects() {
  try {
    const response = await fetch(`${API_URL}/subjects`);
    return await response.json();
  } catch (error) {
    console.error('Load subjects error:', error);
    return [];
  }
}

async function loadCourses(subjectId = null) {
  try {
    const url = subjectId 
      ? `${API_URL}/courses?subjectId=${subjectId}` 
      : `${API_URL}/courses`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Load courses error:', error);
    return [];
  }
}

async function loadDashboardData() {
  if (!currentUser) return;

  if (currentUser.role === 'admin') {
    loadAdminDashboard();
  } else if (currentUser.role === 'teacher') {
    loadTeacherDashboard();
  } else {
    loadStudentDashboard();
  }
}

async function loadAdminDashboard() {
  try {
    const statsRes = await fetch(`${API_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const stats = await statsRes.json();

    document.getElementById('stat-students').textContent = stats.students;
    document.getElementById('stat-teachers').textContent = stats.teachers;
    document.getElementById('stat-courses').textContent = stats.courses;
    document.getElementById('stat-questions').textContent = stats.questions;

    loadTeacherAssignments();
  } catch (error) {
    console.error('Admin dashboard error:', error);
  }
}

async function loadTeacherAssignments() {
  try {
    const response = await fetch(`${API_URL}/admin/assignments`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const assignments = await response.json();

    const tbody = document.getElementById('assignments-body');
    if (tbody) {
      tbody.innerHTML = assignments.map(a => `
        <tr>
          <td>${a.student_name}</td>
          <td>${a.student_email}</td>
          <td>${a.subject_name}</td>
          <td>
            <span class="status-badge ${a.teacher_name ? 'assigned' : 'pending'}">
              ${a.teacher_name || 'Not Assigned'}
            </span>
          </td>
          <td>
            ${!a.teacher_name ? `<button class="btn btn-primary" onclick="showAssignModal(${a.subject_id}, ${a.student_email})">Assign</button>` : ''}
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Load assignments error:', error);
  }
}

async function loadStudentDashboard() {
  try {
    const subjectsRes = await fetch(`${API_URL}/subjects/my/subjects`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const subjects = await subjectsRes.json();

    const subjectList = document.getElementById('my-subjects');
    if (subjectList) {
      subjectList.innerHTML = subjects.map(s => `
        <div class="card-3d">
          <div class="feature-icon">${s.icon}</div>
          <h3>${s.name}</h3>
          <p>Teacher: ${s.teacher_name || 'Not assigned yet'}</p>
        </div>
      `).join('');
    }

    loadCoursesForStudent();
  } catch (error) {
    console.error('Student dashboard error:', error);
  }
}

async function loadCoursesForStudent() {
  const courses = await loadCourses();
  displayCourses(courses);
}

async function loadTeacherDashboard() {
  const courses = await loadCourses(currentUser.id);
  displayCourses(courses);
}

function displayCourses(courses) {
  const courseGrid = document.getElementById('courses-grid');
  if (!courseGrid) return;

  if (courses.length === 0) {
    courseGrid.innerHTML = '<p>No courses available yet.</p>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'admin';
  const deleteBtn = isAdmin ? 
    `<button class="btn btn-secondary" onclick="deleteCourse(${c.id})" style="margin-top: 5px; width: 100%; background: #ff3333;">Delete</button>` : '';

  courseGrid.innerHTML = courses.map(c => `
    <div class="course-card">
      <div class="course-thumbnail">${c.subject_icon || '📚'}</div>
      <div class="course-content">
        <h3>${c.title}</h3>
        <p>${c.description || 'No description'}</p>
        <div class="course-meta">
          <span>${c.subject_name || 'General'}</span>
          <span>${c.teacher_name || 'Admin'}</span>
        </div>
        ${c.file_path ? `<button class="btn btn-primary" onclick="downloadCourse(${c.id}, '${c.file_name}')" style="margin-top: 15px; width: 100%;">Download File</button>` : '<p style="color: var(--text-secondary); margin-top: 10px;">No file attached</p>'}
        ${deleteBtn}
      </div>
    </div>
  `).join('');
}

async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) return;
  
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      showToast('Course deleted successfully!', 'success');
      loadCoursesForStudent();
    } else {
      showToast('Failed to delete course', 'error');
    }
  } catch (error) {
    showToast('Failed to delete course', 'error');
  }
}

async function downloadCourse(courseId, fileName) {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/download`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Download started!', 'success');
    } else {
      showToast('Download failed', 'error');
    }
  } catch (error) {
    showToast('Download failed', 'error');
  }
}

async function uploadCourse(formData) {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });

    if (response.ok) {
      showToast('Course uploaded successfully!', 'success');
      closeUploadModal();
      loadCoursesForStudent();
    } else {
      showToast('Upload failed', 'error');
    }
  } catch (error) {
    showToast('Upload failed', 'error');
  }
}

async function askQuestion(question, subjectId) {
  try {
    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ question, subjectId })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Question answered!', 'success');
      return data;
    } else {
      showToast(data.error || 'Failed to get answer', 'error');
    }
  } catch (error) {
    showToast('Failed to get answer', 'error');
  }
}

async function searchAIQuestion(query, subjectId = null) {
  try {
    const url = subjectId 
      ? `${API_URL}/questions/search?q=${encodeURIComponent(query)}&subjectId=${subjectId}`
      : `${API_URL}/questions/search?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

async function assignTeacher(studentId, subjectId, teacherId) {
  try {
    const response = await fetch(`${API_URL}/admin/assign-teacher`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ studentId, subjectId, teacherId })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Teacher assigned successfully!', 'success');
      loadTeacherAssignments();
    } else {
      showToast(data.error || 'Assignment failed', 'error');
    }
  } catch (error) {
    showToast('Assignment failed', 'error');
  }
}

async function loadTeachers() {
  try {
    const response = await fetch(`${API_URL}/admin/users?role=teacher`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return await response.json();
  } catch (error) {
    console.error('Load teachers error:', error);
    return [];
  }
}

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  existingToast?.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('active'), 10);
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    showPage(hash);
  } else {
    showPage('home');
  }
});

if (window.location.hash) {
  showPage(window.location.hash.slice(1));
} else {
  showPage('home');
}

window.login = login;
window.registerStudent = registerStudent;
window.registerTeacher = registerTeacher;
window.logout = logout;
window.showPage = showPage;
window.downloadCourse = downloadCourse;
window.deleteCourse = deleteCourse;
window.askQuestion = askQuestion;
window.searchAIQuestion = searchAIQuestion;
window.assignTeacher = assignTeacher;
window.loadTeachers = loadTeachers;
window.loadSubjects = loadSubjects;
window.uploadCourse = uploadCourse;
window.toggleDropdown = toggleDropdown;
window.showToast = showToast;
