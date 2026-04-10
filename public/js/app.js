const API_URL = window.location.origin + '/api';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  checkAuth();
  setupEventListeners();
  loadAllCoursesOnLoad();
});

async function loadAllCoursesOnLoad() {
  try {
    const response = await fetch(`${API_URL}/courses`);
    const courses = await response.json();
    const courseGrid = document.getElementById('courses-grid');
    if (courseGrid && courses && courses.length > 0) {
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
            <button class="btn btn-primary" onclick="downloadCourse(${c.id}, '${c.file_name}')" style="margin-top: 15px; width: 100%;">Download File</button>
          </div>
        </div>
      `).join('');
    } else if (courseGrid) {
      courseGrid.innerHTML = '<p style="text-align:center; padding:40px;">No courses available yet.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

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
          <a class="dropdown-item" href="#classes">Online Classes</a>
          ${currentUser.role === 'admin' ? '<a class="dropdown-item" href="#admin">Admin Panel</a>' : ''}
          <a class="dropdown-item" onclick="logout()">Logout</a>
        </div>
      </div>
    `;
    
    // Show/hide admin nav card
    const adminNav = document.getElementById('admin-nav');
    if (adminNav) {
      adminNav.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
    
    // Show Classes nav link
    const navClasses = document.getElementById('nav-classes');
    const mobileNavClasses = document.getElementById('mobile-nav-classes');
    if (navClasses) navClasses.style.display = 'block';
    if (mobileNavClasses) mobileNavClasses.style.display = 'block';
    
    // Show course tabs and create button
    const courseTabs = document.getElementById('courses-tabs');
    const createCourseBtn = document.getElementById('create-course-btn');
    const uploadCourseBtn = document.getElementById('upload-course-btn');
    if (courseTabs) courseTabs.style.display = 'flex';
    if (createCourseBtn) createCourseBtn.style.display = 'inline-flex';
    if (uploadCourseBtn) uploadCourseBtn.style.display = 'inline-flex';
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

  if (pageId === 'questions') {
    loadSubjectsForChat();
  }

  if (pageId === 'classes') {
    loadClasses();
  }
}

async function loadSubjectsForChat() {
  const select = document.getElementById('ai-chat-subject');
  if (!select || select.options.length > 1) return;
  
  const subjects = await loadSubjects();
  subjects.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = `${s.icon} ${s.name}`;
    select.appendChild(option);
  });
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
      setTimeout(() => {
        loadStats();
        if (currentUser.role === 'admin') {
          loadAdminDashboard();
        }
      }, 100);
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
  
  // Hide Classes nav link
  const navClasses = document.getElementById('nav-classes');
  const mobileNavClasses = document.getElementById('mobile-nav-classes');
  if (navClasses) navClasses.style.display = 'none';
  if (mobileNavClasses) mobileNavClasses.style.display = 'none';
  
  // Hide course tabs and create button
  const courseTabs = document.getElementById('courses-tabs');
  const createCourseBtn = document.getElementById('create-course-btn');
  const uploadCourseBtn = document.getElementById('upload-course-btn');
  if (courseTabs) courseTabs.style.display = 'none';
  if (createCourseBtn) createCourseBtn.style.display = 'none';
  if (uploadCourseBtn) uploadCourseBtn.style.display = 'none';
}

async function loadSubjects() {
  try {
    const response = await fetch(`${API_URL}/subjects`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading subjects:', error);
  }
  return [];
}

async function connectGoogle() {
  try {
    const response = await fetch(`${API_URL}/meets/auth/google?userId=${currentUser.id}`);
    const data = await response.json();
    if (data.url) {
      localStorage.setItem('googleAuthUserId', currentUser.id);
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Google connect error:', error);
    showToast('Failed to connect Google', 'error');
  }
}

async function loadClasses() {
  const classesContainer = document.getElementById('upcoming-classes-list');
  if (!classesContainer) return;

  try {
    const response = await fetch(`${API_URL}/meets`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    
    if (data.classes && data.classes.length > 0) {
      classesContainer.innerHTML = data.classes.map(c => createClassCard(c)).join('');
    } else {
      classesContainer.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-secondary);">No upcoming classes</p>';
    }
  } catch (error) {
    console.error('Load classes error:', error);
    showToast('Failed to load classes', 'error');
  }
}

async function loadClassHistory() {
  const historyContainer = document.getElementById('class-history-list');
  if (!historyContainer) return;

  try {
    const response = await fetch(`${API_URL}/meets/history`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    
    if (data.classes && data.classes.length > 0) {
      historyContainer.innerHTML = data.classes.map(c => createClassCard(c, true)).join('');
    } else {
      historyContainer.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-secondary);">No class history</p>';
    }
  } catch (error) {
    console.error('Load class history error:', error);
    showToast('Failed to load class history', 'error');
  }
}

function createClassCard(classData, isHistory = false) {
  const status = isHistory ? 'Completed' : (new Date(classData.scheduled_at) > new Date() ? 'Upcoming' : 'Live');
  const statusClass = status.toLowerCase();
  
  return `
    <div class="course-card" style="margin-bottom: 20px;">
      <div class="course-thumbnail" style="background: ${isHistory ? 'linear-gradient(135deg, #666, #888)' : 'linear-gradient(135deg, var(--accent-orange), var(--accent-orange-light))'}">
        ${isHistory ? '📹' : '🎥'}
      </div>
      <div class="course-content">
        <h3>${classData.title}</h3>
        <p>${classData.description || 'No description'}</p>
        <div class="course-meta" style="margin-top: 10px;">
          <span>📅 ${formatClassDate(classData.scheduled_at)}</span>
          <span>⏱️ ${classData.duration} min</span>
        </div>
        <div style="margin-top: 10px;">
          <span class="status-badge ${statusClass}">${status}</span>
          ${classData.subject ? `<span class="tag">${classData.subject}</span>` : ''}
        </div>
        <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
          ${classData.meet_link ? `<a href="${classData.meet_link}" target="_blank" class="btn btn-primary" style="flex:1;">Join Meeting</a>` : ''}
          ${!isHistory && currentUser.role !== 'student' ? `<button class="btn btn-secondary" onclick="openClassModal(${classData.id})" style="flex:1;">View Details</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function formatClassDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openCreateClassModal() {
  const modal = document.getElementById('createClassModal');
  modal?.classList.add('active');
  loadSubjectsForClass();
  
  const dateTimeInput = document.getElementById('classDateTime');
  if (dateTimeInput && !dateTimeInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    dateTimeInput.value = tomorrow.toISOString().slice(0, 16);
  }
}

function closeCreateClassModal() {
  document.getElementById('createClassModal')?.classList.remove('active');
}

async function loadSubjectsForClass() {
  const select = document.getElementById('classSubject');
  if (!select || select.options.length > 1) return;
  
  const subjects = await loadSubjects();
  subjects.forEach(s => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = `${s.icon} ${s.name}`;
    select.appendChild(option);
  });
}

async function createNewClass(e) {
  e.preventDefault();
  
  const title = document.getElementById('classTitle')?.value;
  const description = document.getElementById('classDescription')?.value;
  const scheduledAt = document.getElementById('classDateTime')?.value;
  const duration = parseInt(document.getElementById('classDuration')?.value) || 60;
  const subject = document.getElementById('classSubject')?.value;

  if (!title || !scheduledAt) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/meets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, description, scheduledAt, duration, subject })
    });

    if (response.ok) {
      const data = await response.json();
      showToast('Class created successfully!', 'success');
      closeCreateClassModal();
      loadClasses();
      
      if (data.class.meet_link) {
        window.open(data.class.meet_link, '_blank');
      }
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to create class', 'error');
    }
  } catch (error) {
    console.error('Create class error:', error);
    showToast('Failed to create class', 'error');
  }
}

async function joinClass(classId) {
  try {
    const response = await fetch(`${API_URL}/meets/${classId}/enroll`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      showToast('Enrolled successfully!', 'success');
    }
  } catch (error) {
    console.error('Join class error:', error);
    showToast('Failed to join class', 'error');
  }
}

let selectedClassId = null;

function openClassModal(classId) {
  selectedClassId = classId;
  document.getElementById('classDetailModal')?.classList.add('active');
  loadClassDetails(classId);
}

function closeClassModal() {
  document.getElementById('classDetailModal')?.classList.remove('active');
  selectedClassId = null;
}

async function loadClassDetails(classId) {
  const detailsContainer = document.getElementById('classDetails');
  if (!detailsContainer) return;

  try {
    const response = await fetch(`${API_URL}/meets/${classId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    
    if (data.class) {
      const c = data.class;
      detailsContainer.innerHTML = `
        <h2 style="margin-bottom: 20px;">${c.title}</h2>
        <p style="margin-bottom: 15px; color: var(--text-secondary);">${c.description || 'No description'}</p>
        <div style="margin-bottom: 15px;">
          <strong>Teacher:</strong> ${c.teacher_name}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Date:</strong> ${formatClassDate(c.scheduled_at)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Duration:</strong> ${c.duration} minutes
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Subject:</strong> ${c.subject || 'General'}
        </div>
        ${c.meet_link ? `<a href="${c.meet_link}" target="_blank" class="btn btn-primary" style="width: 100%; margin-bottom: 10px;">Join Google Meet</a>` : ''}
        ${currentUser.role === 'admin' || currentUser.id === c.teacher_id ? `
          <button onclick="deleteClass(${c.id})" class="btn btn-secondary" style="width: 100%;">Delete Class</button>
        ` : ''}
      `;
    }
  } catch (error) {
    console.error('Load class details error:', error);
  }
}

async function deleteClass(classId) {
  if (!confirm('Are you sure you want to delete this class?')) return;

  try {
    const response = await fetch(`${API_URL}/meets/${classId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      showToast('Class deleted successfully', 'success');
      closeClassModal();
      loadClasses();
    } else {
      showToast('Failed to delete class', 'error');
    }
  } catch (error) {
    console.error('Delete class error:', error);
    showToast('Failed to delete class', 'error');
  }
}

async function loadCourses(subjectId = null) {
  try {
    const url = subjectId 
      ? `${API_URL}/courses?subjectId=${subjectId}` 
      : `${API_URL}/courses`;
    console.log('Fetching:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Courses data:', data);
    return data;
  } catch (error) {
    console.error('Load courses error:', error);
    return [];
  }
}

async function loadDashboardData() {
  if (!currentUser) return;

  loadStats();

  if (currentUser.role === 'admin') {
    loadAdminDashboard();
  } else if (currentUser.role === 'teacher') {
    loadTeacherDashboard();
  } else {
    loadStudentDashboard();
  }
}

async function loadStats() {
  try {
    console.log('Loading stats...');
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const [statsRes, coursesRes] = await Promise.all([
      fetch(`${API_URL}/admin/stats`, { headers }),
      fetch(`${API_URL}/courses`)
    ]);
    
    console.log('Stats status:', statsRes.status);
    console.log('Courses status:', coursesRes.status);
    
    const statsData = await statsRes.json().catch(() => ({}));
    const coursesData = await coursesRes.json().catch(() => []);

    console.log('Stats API response:', statsData);
    console.log('Courses API response:', coursesData);
    
    const coursesCount = Array.isArray(coursesData) ? coursesData.length : 0;
    console.log('Courses count:', coursesCount);
    
    const studentsEl = document.getElementById('stat-students');
    const teachersEl = document.getElementById('stat-teachers');
    const coursesEl = document.getElementById('stat-courses');
    const questionsEl = document.getElementById('stat-questions');
    
    console.log('Elements found:', {
      students: !!studentsEl,
      teachers: !!teachersEl,
      courses: !!coursesEl,
      questions: !!questionsEl
    });
    
    if (studentsEl) studentsEl.textContent = statsData.students || 0;
    if (teachersEl) teachersEl.textContent = statsData.teachers || 0;
    if (coursesEl) {
      coursesEl.textContent = coursesCount;
      console.log('Set courses to:', coursesCount);
    }
    if (questionsEl) questionsEl.textContent = statsData.questions || 0;
  } catch (error) {
    console.error('Stats error:', error);
  }
}

async function loadAdminDashboard() {
  try {
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
  console.log('Loading courses...');
  try {
    const courses = await loadCourses();
    console.log('Courses loaded:', courses);
    displayCourses(courses);
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

async function loadTeacherDashboard() {
  const courses = await loadCourses(currentUser.id);
  displayCourses(courses);
}

function displayCourses(courses) {
  console.log('Displaying courses:', courses);
  const courseGrid = document.getElementById('courses-grid');
  if (!courseGrid) {
    console.log('Course grid not found!');
    return;
  }

  if (!courses || courses.length === 0) {
    courseGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No courses available yet.</p>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'admin';

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
        ${isAdmin ? `<button class="btn btn-secondary" onclick="deleteCourse(${c.id})" style="margin-top: 5px; width: 100%; background: #ff3333;">Delete</button>` : ''}
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
      loadStats();
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
    const response = await fetch(`${API_URL}/course-details/resources/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });

    if (response.ok) {
      showToast('Resource uploaded successfully!', 'success');
      closeUploadModal();
      loadDetailedCourses();
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

async function loadQuestionHistory() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch(`${API_URL}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const questions = await response.json();
    displayQuestionHistory(questions);
  } catch (error) {
    console.error('Error loading question history:', error);
  }
}

function displayQuestionHistory(questions) {
  const historyDiv = document.getElementById('question-history');
  if (!historyDiv) return;
  
  if (!questions || questions.length === 0) {
    historyDiv.innerHTML = '<p style="color: var(--text-secondary);">No questions asked yet.</p>';
    return;
  }
  
  historyDiv.innerHTML = questions.map(q => `
    <div class="question-card" style="margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <span class="tag">${q.subject_name || 'General'}</span>
          <p class="question" style="margin-top: 10px;">Q: ${q.question}</p>
          <p style="color: var(--text-secondary); margin-top: 8px; font-size: 0.9rem;">${new Date(q.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="answer" style="margin-top: 10px;">${q.ai_answer || 'No answer yet'}</div>
    </div>
  `).join('');
}

function addMessageToChat(message, isUser = false) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
  messageDiv.innerHTML = `
    <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingToChat() {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-message bot';
  loadingDiv.id = 'chat-loading';
  loadingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="chat-loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingFromChat() {
  const loading = document.getElementById('chat-loading');
  if (loading) loading.remove();
}

async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const subjectSelect = document.getElementById('ai-chat-subject');
  
  if (!input) return;
  
  const message = input.value.trim();
  if (!message) return;
  
  const subjectId = subjectSelect?.value || null;
  
  addMessageToChat(message, true);
  input.value = '';
  addLoadingToChat();
  
  try {
    const token = localStorage.getItem('token');
    let result;
    
    if (token) {
      result = await askQuestion(message, subjectId);
    } else {
      result = await searchAIQuestion(message, subjectId);
    }
    
    removeLoadingFromChat();
    
    if (result) {
      addMessageToChat(result.answer || result.ai_answer, false);
    } else {
      addMessageToChat('Sorry, I could not generate an answer. Please try again.', false);
    }
  } catch (error) {
    removeLoadingFromChat();
    addMessageToChat('Error getting answer. Please try again.', false);
  }
}

async function handleAISearch() {
  const query = document.getElementById('ai-search-input').value;
  const subjectId = document.getElementById('ai-search-subject').value;
  
  if (!query) {
    showToast('Please enter a question', 'error');
    return;
  }

  const resultsDiv = document.getElementById('ai-results');
  resultsDiv.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';

  try {
    const token = localStorage.getItem('token');
    let result;
    
    if (token) {
      result = await askQuestion(query, subjectId || null);
    } else {
      result = await searchAIQuestion(query, subjectId || null);
    }
    
    if (result) {
      resultsDiv.innerHTML = `
        <div class="question-card">
          <div class="question">Q: ${query}</div>
          <div class="answer">${result.answer || result.ai_answer}</div>
        </div>
      `;
      
      if (token) {
        loadQuestionHistory();
      }
      
      document.getElementById('ai-search-input').value = '';
    } else {
      resultsDiv.innerHTML = '<p style="color: var(--error);">Failed to get answer. Please try again.</p>';
    }
  } catch (error) {
    resultsDiv.innerHTML = '<p style="color: var(--error);">Error getting answer.</p>';
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

function showUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.add('active');
    loadMyCoursesForUpload();
  }
}

async function loadMyCoursesForUpload() {
  const select = document.getElementById('course-subject');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Course</option>';
  
  try {
    const response = await fetch(`${API_URL}/course-details?myCourses=true`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const courses = await response.json();
    
    if (courses.length === 0) {
      select.innerHTML = '<option value="">No courses created yet</option>';
      showToast('Please create a course first using "New Course"', 'error');
      return;
    }
    
    courses.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.title} ${c.subject ? '(' + c.subject + ')' : ''}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Load my courses error:', error);
  }
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.remove('active');
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

// Course Detail Functions
async function loadDetailedCourses() {
  const grid = document.getElementById('detailed-courses-grid');
  if (!grid) return;

  try {
    const response = await fetch(`${API_URL}/course-details`);
    const courses = await response.json();
    
    if (courses.length > 0) {
      grid.innerHTML = courses.map(c => `
        <div class="course-card" onclick="showCourseDetail(${c.id})" style="cursor: pointer;">
          <div class="course-thumbnail" style="background: linear-gradient(135deg, var(--accent-orange), var(--accent-orange-light)); display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-size: 3rem;">📚</span>
            <span style="color: white; font-size: 0.9rem; margin-top: 10px;">${c.subject || 'General'}</span>
          </div>
          <div class="course-content">
            <h3>${c.title}</h3>
            <p>${c.description || 'No description'}</p>
            <div class="course-meta" style="margin-top: 10px;">
              <span>📁 ${c.folder_count || 0} folders</span>
              <span>📄 ${c.resource_count || 0} resources</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No detailed courses yet. Create one!</p>';
    }
  } catch (error) {
    console.error('Load detailed courses error:', error);
  }
}

async function showCourseDetail(courseId) {
  const content = document.getElementById('course-detail-content');
  content.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loader" style="margin: 0 auto;"></div></div>';
  showPage('course-detail');

  try {
    const response = await fetch(`${API_URL}/course-details/${courseId}`);
    const data = await response.json();
    
    const { course, folders, resources, lessons } = data;
    
    content.innerHTML = `
      <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px;">
        <h1 style="margin-bottom: 10px;">${course.title}</h1>
        <p style="color: #666; margin-bottom: 15px;">${course.description || 'No description'}</p>
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
          <span class="tag">${course.subject || 'General'}</span>
          <span class="tag">📁 ${folders.length} Folders</span>
          <span class="tag">📄 ${resources.length} Resources</span>
          <span class="tag">📖 ${lessons.length} Lessons</span>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="switchDetailTab('overview', event, ${courseId})">Overview</button>
        <button class="tab" onclick="switchDetailTab('lessons', event, ${courseId})">Lessons</button>
        <button class="tab" onclick="switchDetailTab('resources', event, ${courseId})">Resources</button>
      </div>

      <div id="course-overview-${courseId}" class="course-tab-content">
        <div style="background: white; border-radius: 20px; padding: 30px;">
          <h3>Course Overview</h3>
          <p style="color: #666; margin-top: 10px;">${course.description || 'No description provided for this course.'}</p>
          ${course.teacher_name ? `<p style="margin-top: 15px;">👨‍🏫 Teacher: ${course.teacher_name}</p>` : ''}
        </div>
      </div>

      <div id="course-lessons-${courseId}" class="course-tab-content" style="display: none;">
        <div style="background: white; border-radius: 20px; padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Lessons</h3>
            <button class="btn btn-primary" onclick="showAddLessonModal(${courseId})" style="display: ${currentUser && currentUser.role === 'admin' ? 'inline-flex' : 'none'};">+ Add Lesson</button>
          </div>
          ${lessons.length > 0 ? lessons.map((l, i) => `
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: var(--accent-orange); font-weight: bold;">Lesson ${i + 1}</span>
                <h4 style="margin-top: 5px;">${l.title}</h4>
              </div>
              ${currentUser && currentUser.role === 'admin' ? `<button class="btn btn-secondary" onclick="deleteLesson(${l.id})" style="padding: 5px 10px; color: red;">Delete</button>` : ''}
            </div>
          `).join('') : '<p style="color: #999;">No lessons yet.</p>'}
        </div>
      </div>

      <div id="course-resources-${courseId}" class="course-tab-content" style="display: none;">
        <div style="background: white; border-radius: 20px; padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Resources</h3>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" onclick="showCreateFolderModal(${courseId})" style="display: ${currentUser && currentUser.role === 'admin' ? 'inline-flex' : 'none'};">+ Folder</button>
              <button class="btn btn-primary" onclick="showUploadResourceModal(${courseId})" style="display: ${currentUser && currentUser.role === 'admin' ? 'inline-flex' : 'none'};">+ Upload</button>
            </div>
          </div>
          
          ${folders.length > 0 ? folders.map(f => {
            const folderResources = resources.filter(r => r.folder_id === f.id);
            return `
              <div style="border: 2px solid var(--accent-orange); border-radius: 15px; margin-bottom: 15px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, var(--accent-orange), var(--accent-orange-light)); padding: 15px; display: flex; justify-content: space-between; align-items: center; color: white;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">📁</span>
                    <span style="font-weight: bold;">${f.name}</span>
                    <span style="background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 10px; font-size: 0.85rem;">${folderResources.length}</span>
                  </div>
                  ${currentUser && currentUser.role === 'admin' ? `<button onclick="deleteFolder(${f.id})" style="background: none; border: none; color: white; cursor: pointer;">🗑️</button>` : ''}
                </div>
                <div style="padding: 15px;">
                  ${folderResources.length > 0 ? folderResources.map(r => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${getResourceIcon(r.file_type)}</span>
                        <span>${r.title}</span>
                      </div>
                      <div style="display: flex; gap: 10px;">
                        ${r.resource_type === 'link' ? `<a href="${r.file_path}" target="_blank" class="btn btn-secondary" style="padding: 5px 10px;">Open</a>` : `<a href="${r.file_path}" download class="btn btn-secondary" style="padding: 5px 10px;">Download</a>`}
                        ${currentUser && currentUser.role === 'admin' ? `<button onclick="deleteResource(${r.id})" style="background: none; border: none; color: red; cursor: pointer;">🗑️</button>` : ''}
                      </div>
                    </div>
                  `).join('') : '<p style="color: #999; text-align: center;">No resources in this folder.</p>'}
                </div>
              </div>
            `;
          }).join('') : ''}
          
          ${resources.filter(r => !r.folder_id).length > 0 ? `
            <div style="margin-top: 20px;">
              <h4 style="margin-bottom: 10px;">Root Resources (No Folder)</h4>
              ${resources.filter(r => !r.folder_id).map(r => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span>${getResourceIcon(r.file_type)}</span>
                    <span>${r.title}</span>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    ${r.resource_type === 'link' ? `<a href="${r.file_path}" target="_blank" class="btn btn-secondary" style="padding: 5px 10px;">Open</a>` : `<a href="${r.file_path}" download class="btn btn-secondary" style="padding: 5px 10px;">Download</a>`}
                    ${currentUser && currentUser.role === 'admin' ? `<button onclick="deleteResource(${r.id})" style="background: none; border: none; color: red; cursor: pointer;">🗑️</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${folders.length === 0 && resources.filter(r => !r.folder_id).length === 0 ? '<p style="color: #999; text-align: center;">No resources uploaded yet.</p>' : ''}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load course detail error:', error);
    content.innerHTML = '<p style="color: red;">Failed to load course details.</p>';
  }
}

function getResourceIcon(fileType) {
  if (!fileType) return '🔗';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('doc') || fileType.includes('word')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📁';
}

function switchDetailTab(tab, event, courseId) {
  document.querySelectorAll('.course-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll(`#course-detail .tab`).forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`course-${tab}-${courseId}`).style.display = 'block';
}

function switchCourseTab(tab, event) {
  document.querySelectorAll('#courses .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tab === 'all') {
    document.getElementById('all-courses-list').style.display = 'block';
    document.getElementById('detailed-courses-list').style.display = 'none';
  } else {
    document.getElementById('all-courses-list').style.display = 'none';
    document.getElementById('detailed-courses-list').style.display = 'block';
    loadDetailedCourses();
  }
}

function showCreateCourseModal() {
  document.getElementById('createCourseModal').classList.add('active');
  loadSubjectsForNewCourse();
}

function closeCreateCourseModal() {
  document.getElementById('createCourseModal').classList.remove('active');
}

async function loadSubjectsForNewCourse() {
  const select = document.getElementById('newCourseSubject');
  if (!select || select.options.length > 1) return;
  
  const subjects = await loadSubjects();
  subjects.forEach(s => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = `${s.icon} ${s.name}`;
    select.appendChild(option);
  });
}

async function createNewCourse(e) {
  e.preventDefault();
  
  const title = document.getElementById('newCourseTitle')?.value;
  const description = document.getElementById('newCourseDescription')?.value;
  const subject = document.getElementById('newCourseSubject')?.value;

  if (!title) {
    showToast('Please enter a course title', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/course-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, description, subject })
    });

    if (response.ok) {
      showToast('Course created successfully!', 'success');
      closeCreateCourseModal();
      loadDetailedCourses();
    } else {
      showToast('Failed to create course', 'error');
    }
  } catch (error) {
    console.error('Create course error:', error);
    showToast('Failed to create course', 'error');
  }
}

function showCreateFolderModal(courseId = null) {
  document.getElementById('createFolderModal').classList.add('active');
  loadCoursesForFolder(courseId);
}

function closeCreateFolderModal() {
  document.getElementById('createFolderModal').classList.remove('active');
}

async function loadCoursesForFolder(preselectedId = null) {
  const select = document.getElementById('folderCourseId');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Course</option>';
  
  try {
    const response = await fetch(`${API_URL}/course-details`);
    const courses = await response.json();
    
    courses.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.title;
      if (preselectedId && c.id === preselectedId) option.selected = true;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Load courses for folder error:', error);
  }
}

async function createNewFolder(e) {
  e.preventDefault();
  
  const courseId = document.getElementById('folderCourseId')?.value;
  const name = document.getElementById('folderName')?.value;

  if (!courseId || !name) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/course-details/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, courseId })
    });

    if (response.ok) {
      showToast('Folder created successfully!', 'success');
      closeCreateFolderModal();
      showCourseDetail(parseInt(courseId));
    } else {
      showToast('Failed to create folder', 'error');
    }
  } catch (error) {
    console.error('Create folder error:', error);
    showToast('Failed to create folder', 'error');
  }
}

function showUploadResourceModal(courseId = null) {
  document.getElementById('uploadResourceModal').classList.add('active');
  loadCoursesForResource(courseId);
  
  document.getElementById('resourceTypeSelect').onchange = function() {
    const fileSection = document.getElementById('file-upload-section');
    const linkSection = document.getElementById('link-upload-section');
    if (this.value === 'link') {
      fileSection.style.display = 'none';
      linkSection.style.display = 'block';
    } else {
      fileSection.style.display = 'block';
      linkSection.style.display = 'none';
    }
  };
}

function closeUploadResourceModal() {
  document.getElementById('uploadResourceModal').classList.remove('active');
}

async function loadCoursesForResource(preselectedId = null) {
  const select = document.getElementById('resourceCourseId');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Course</option>';
  
  try {
    const response = await fetch(`${API_URL}/course-details`);
    const courses = await response.json();
    
    courses.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.title;
      if (preselectedId && c.id === preselectedId) option.selected = true;
      select.appendChild(option);
    });
    
    if (preselectedId) {
      loadFoldersForResource();
    }
  } catch (error) {
    console.error('Load courses for resource error:', error);
  }
}

async function loadFoldersForResource() {
  const courseId = document.getElementById('resourceCourseId')?.value;
  const select = document.getElementById('resourceFolderId');
  if (!select || !courseId) return;
  
  select.innerHTML = '<option value="">No Folder (Root)</option>';
  
  try {
    const response = await fetch(`${API_URL}/course-details/folders/list?courseId=${courseId}`);
    const folders = await response.json();
    
    folders.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = `📁 ${f.name}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Load folders error:', error);
  }
}

async function uploadResourceFile(e) {
  e.preventDefault();
  
  const courseId = document.getElementById('resourceCourseId')?.value;
  const folderId = document.getElementById('resourceFolderId')?.value || null;
  const title = document.getElementById('resourceTitle')?.value;
  const resourceType = document.getElementById('resourceTypeSelect')?.value;

  if (!courseId || !title) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    let response;
    
    if (resourceType === 'link') {
      const linkUrl = document.getElementById('resourceLinkUrl')?.value;
      response = await fetch(`${API_URL}/course-details/resources/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, linkUrl, courseId, folderId })
      });
    } else {
      const fileInput = document.getElementById('resourceFile');
      const file = fileInput?.files[0];
      
      if (!file) {
        showToast('Please select a file', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('courseId', courseId);
      formData.append('folderId', folderId || '');
      formData.append('resourceType', 'file');
      formData.append('file', file);
      
      response = await fetch(`${API_URL}/course-details/resources/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
    }

    if (response.ok) {
      showToast('Resource uploaded successfully!', 'success');
      closeUploadResourceModal();
      showCourseDetail(parseInt(courseId));
    } else {
      showToast('Failed to upload resource', 'error');
    }
  } catch (error) {
    console.error('Upload resource error:', error);
    showToast('Failed to upload resource', 'error');
  }
}

async function deleteResource(resourceId) {
  if (!confirm('Delete this resource?')) return;
  
  try {
    const response = await fetch(`${API_URL}/course-details/resources/${resourceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      showToast('Resource deleted', 'success');
      location.reload();
    }
  } catch (error) {
    console.error('Delete resource error:', error);
  }
}

async function deleteFolder(folderId) {
  if (!confirm('Delete this folder and all its contents?')) return;
  
  try {
    const response = await fetch(`${API_URL}/course-details/folders/${folderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      showToast('Folder deleted', 'success');
      location.reload();
    }
  } catch (error) {
    console.error('Delete folder error:', error);
  }
}

async function deleteCourse(courseId) {
  if (!confirm('Delete this course and all its contents?')) return;
  
  try {
    const response = await fetch(`${API_URL}/course-details/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      showToast('Course deleted', 'success');
      loadDetailedCourses();
    }
  } catch (error) {
    console.error('Delete course error:', error);
  }
}

async function deleteLesson(lessonId) {
  if (!confirm('Delete this lesson?')) return;
  
  try {
    const response = await fetch(`${API_URL}/course-details/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      showToast('Lesson deleted', 'success');
      location.reload();
    }
  } catch (error) {
    console.error('Delete lesson error:', error);
  }
}

function downloadResource(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
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
window.handleAISearch = handleAISearch;
window.loadQuestionHistory = loadQuestionHistory;
window.sendChatMessage = sendChatMessage;
window.assignTeacher = assignTeacher;
window.loadTeachers = loadTeachers;
window.loadSubjects = loadSubjects;
window.uploadCourse = uploadCourse;
window.toggleDropdown = toggleDropdown;
window.showToast = showToast;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.connectGoogle = connectGoogle;
window.loadClasses = loadClasses;
window.loadClassHistory = loadClassHistory;
window.createNewClass = createNewClass;
window.joinClass = joinClass;
window.openCreateClassModal = openCreateClassModal;
window.closeCreateClassModal = closeCreateClassModal;
window.formatClassDate = formatClassDate;
window.openClassModal = openClassModal;
window.closeClassModal = closeClassModal;
window.loadDetailedCourses = loadDetailedCourses;
window.showCourseDetail = showCourseDetail;
window.switchCourseTab = switchCourseTab;
window.showCreateCourseModal = showCreateCourseModal;
window.closeCreateCourseModal = closeCreateCourseModal;
window.createNewCourse = createNewCourse;
window.loadFoldersForCourse = loadFoldersForCourse;
window.showCreateFolderModal = showCreateFolderModal;
window.closeCreateFolderModal = closeCreateFolderModal;
window.createNewFolder = createNewFolder;
window.showUploadResourceModal = showUploadResourceModal;
window.closeUploadResourceModal = closeUploadResourceModal;
window.uploadResourceFile = uploadResourceFile;
window.loadFoldersForResource = loadFoldersForResource;
window.createNewLesson = createNewLesson;
window.downloadResource = downloadResource;
window.deleteResource = deleteResource;
window.deleteFolder = deleteFolder;
window.deleteCourse = deleteCourse;
window.deleteLesson = deleteLesson;
