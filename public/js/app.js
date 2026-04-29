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
        <div class="resources-toolbar" style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="showCreateFolderModal(${courseId})" style="display: ${currentUser && currentUser.role === 'admin' ? 'inline-flex' : 'none'};">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-2v2h2v2h-2v2h-2v-2h2v-2h-2v-2h2v-2h-2V8h2v2h2v2z"/></svg>
              New Folder
            </button>
            <button class="btn btn-primary" onclick="showUploadResourceModal(${courseId})" style="display: ${currentUser && currentUser.role === 'admin' ? 'inline-flex' : 'none'};">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              Upload
            </button>
          </div>
        </div>
        <div id="resources-drive-${courseId}">
          <div style="background: white; border-radius: 20px; padding: 30px; text-align: center;">
            <div class="loader" style="margin: 0 auto;"></div>
          </div>
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
  const tabContent = document.getElementById(`course-${tab}-${courseId}`);
  tabContent.style.display = 'block';
  
  if (tab === 'resources') {
    const driveContainer = document.getElementById(`resources-drive-${courseId}`);
    if (driveContainer && driveContainer.querySelector('.drive-container') === null) {
      loadResourcesTab(courseId);
    }
  }
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
  
  const currentFolder = currentFolderStack[courseId];
  const parentIdInput = document.getElementById('folderParentId');
  if (parentIdInput) {
    parentIdInput.value = currentFolder && currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : '';
  }
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
  
  const courseId = parseInt(document.getElementById('folderCourseId')?.value);
  const name = document.getElementById('folderName')?.value;
  const parentId = document.getElementById('folderParentId')?.value || null;

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
      body: JSON.stringify({ name, courseId, parentId })
    });

    if (response.ok) {
      showToast('Folder created successfully!', 'success');
      closeCreateFolderModal();
      
      const folderId = parentId ? parseInt(parentId) : null;
      loadFolderContents(courseId, folderId);
      loadFolderTree(courseId);
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
      
      const cid = parseInt(courseId);
      const folderId = currentFolderStack[cid]?.length > 0 
        ? currentFolderStack[cid][currentFolderStack[cid].length - 1].id 
        : null;
      loadFolderContents(cid, folderId);
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

let resourcesViewMode = 'grid';
let currentFolderStack = [];
let resourcesCourseId = null;

async function loadResourcesTab(courseId, folderId = null) {
  resourcesCourseId = courseId;
  const container = document.getElementById(`course-resources-${courseId}`);
  if (!container) return;

  container.innerHTML = `
    <div class="drive-container" id="drive-container-${courseId}">
      <div class="drive-sidebar" id="drive-sidebar-${courseId}">
        <div class="sidebar-header">
          <h4>My Drive</h4>
        </div>
        <div class="folder-tree" id="folder-tree-${courseId}">
          <div class="folder-loading">Loading folders...</div>
        </div>
      </div>
      <div class="drive-main" id="drive-main-${courseId}">
        <div class="drive-toolbar">
          <div class="breadcrumb" id="breadcrumb-${courseId}">
            <span class="breadcrumb-item" onclick="navigateToFolder('${courseId}', null)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              Resources
            </span>
          </div>
          <div class="toolbar-actions">
            <div class="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input type="text" placeholder="Search in folder..." onkeyup="searchResources(${courseId})" id="resource-search-${courseId}">
            </div>
            <div class="view-toggle">
              <button class="view-btn ${resourcesViewMode === 'grid' ? 'active' : ''}" onclick="setResourcesView('grid', ${courseId})" title="Grid view">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
              </button>
              <button class="view-btn ${resourcesViewMode === 'list' ? 'active' : ''}" onclick="setResourcesView('list', ${courseId})" title="List view">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="drive-content" id="drive-content-${courseId}" 
             ondragover="handleDragOver(event, ${courseId})" 
             ondragleave="handleDragLeave(event)" 
             ondrop="handleDrop(event, ${courseId})">
          <div class="drive-loading">Loading...</div>
          <div class="drop-overlay" id="drop-overlay-${courseId}" style="display: none;">
            <div class="drop-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#1a73e8"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              <p>Drop files to upload</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadFolderTree(courseId);
  await loadFolderContents(courseId, folderId);
}

function handleDragOver(event, courseId) {
  event.preventDefault();
  event.stopPropagation();
  const overlay = document.getElementById(`drop-overlay-${courseId}`);
  if (overlay) overlay.style.display = 'flex';
}

function handleDragLeave(event, courseId) {
  event.preventDefault();
  event.stopPropagation();
  if (!event.relatedTarget || !event.target.closest('.drive-content')) {
    const overlay = document.getElementById(`drop-overlay-${courseId}`);
    if (overlay) overlay.style.display = 'none';
  }
}

async function handleDrop(event, courseId) {
  event.preventDefault();
  event.stopPropagation();
  const overlay = document.getElementById(`drop-overlay-${courseId}`);
  if (overlay) overlay.style.display = 'none';

  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  const folderId = currentFolderStack[courseId]?.length > 0 
    ? currentFolderStack[courseId][currentFolderStack[courseId].length - 1].id 
    : null;

  showToast(`Uploading ${files.length} file(s)...`, 'info');

  for (const file of files) {
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('courseId', courseId);
    formData.append('folderId', folderId || '');
    formData.append('resourceType', 'file');
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/course-details/resources/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Drag & drop upload error:', error);
      showToast(`Failed to upload ${file.name}`, 'error');
    }
  }

  showToast('Files uploaded successfully!', 'success');
  loadFolderContents(courseId, folderId);
}

window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;

async function loadFolderTree(courseId) {
  try {
    const response = await fetch(`${API_URL}/course-details/folders/tree?courseId=${courseId}`);
    const folders = await response.json();
    const container = document.getElementById(`folder-tree-${courseId}`);
    if (!container) return;

    container.innerHTML = `
      <div class="folder-item ${!currentFolderStack[courseId] ? 'active' : ''}" onclick="navigateToFolder('${courseId}', null)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
        <span>All Files</span>
      </div>
      ${renderFolderTree(folders, courseId, null)}
    `;
  } catch (error) {
    console.error('Load folder tree error:', error);
  }
}

function renderFolderTree(folders, courseId, parentId) {
  const children = folders.filter(f => f.parent_id === parentId);
  if (children.length === 0) return '';

  return children.map(f => {
    const currentPath = currentFolderStack[courseId];
    const isActive = currentPath && currentPath.length > 0 && currentPath[currentPath.length - 1].id === f.id;
    return `
      <div class="folder-item ${isActive ? 'active' : ''}" onclick="navigateToFolder('${courseId}', ${f.id})">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
        <span>${f.name}</span>
      </div>
      ${f.children && f.children.length > 0 ? `<div class="folder-children">${renderFolderTree(folders, courseId, f.id)}</div>` : ''}
    `;
  }).join('');
}

async function loadFolderContents(courseId, folderId = null) {
  const container = document.getElementById(`drive-content-${courseId}`);
  if (!container) return;

  container.innerHTML = '<div class="drive-loading">Loading...</div>';

  try {
    const params = new URLSearchParams({ courseId });
    if (folderId) params.append('folderId', folderId);
    
    const response = await fetch(`${API_URL}/course-details/folders/contents?${params}`);
    const data = await response.json();
    
    const { folders, resources } = data;
    
    if (folders.length === 0 && resources.length === 0) {
      container.innerHTML = `
        <div class="drive-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#dadce0"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6V10h12v2z"/></svg>
          <p>This folder is empty</p>
          <p class="drive-empty-hint">Upload files or create folders to get started</p>
        </div>
      `;
      return;
    }

    if (resourcesViewMode === 'grid') {
      container.innerHTML = `
        <div class="drive-grid">
          ${folders.map(f => renderFolderCard(f, 'folder', courseId)).join('')}
          ${resources.map(r => renderFileCard(r, 'file', courseId)).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="drive-list">
          <div class="list-header">
            <span class="list-name-header">Name</span>
            <span class="list-size-header">Size</span>
            <span class="list-date-header">Modified</span>
          </div>
          ${folders.map(f => renderListItem(f, 'folder', courseId)).join('')}
          ${resources.map(r => renderListItem(r, 'file', courseId)).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Load folder contents error:', error);
    container.innerHTML = '<div class="drive-error">Failed to load contents</div>';
  }
}

function renderFolderCard(folder, type, courseId) {
  return `
    <div class="drive-item" data-type="${type}" data-id="${folder.id}" ondblclick="openFolder(${courseId}, ${folder.id})" oncontextmenu="showContextMenu(event, '${type}', ${folder.id}, ${courseId})">
      <div class="item-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="#5f6368"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
      </div>
      <div class="item-name">${folder.name}</div>
    </div>
  `;
}

function renderFileCard(resource, type, courseId) {
  const icon = getDriveFileIcon(resource.file_type || resource.resource_type);
  return `
    <div class="drive-item" data-type="${type}" data-id="${resource.id}" oncontextmenu="showContextMenu(event, '${type}', ${resource.id}, ${courseId})">
      <div class="item-icon">${icon}</div>
      <div class="item-name" title="${resource.title}">${resource.title}</div>
      <div class="item-actions">
        ${resource.resource_type === 'link' 
          ? `<a href="${resource.file_path}" target="_blank" class="action-btn" title="Open link">🔗</a>`
          : `<a href="${resource.file_path}" download class="action-btn" title="Download">⬇️</a>`
        }
      </div>
    </div>
  `;
}

function renderListItem(item, type, courseId) {
  if (type === 'folder') {
    return `
      <div class="list-row" data-type="${type}" data-id="${item.id}" ondblclick="openFolder(${courseId}, ${item.id})" oncontextmenu="showContextMenu(event, '${type}', ${item.id}, ${courseId})">
        <div class="list-name">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
          <span>${item.name}</span>
        </div>
        <div class="list-size">-</div>
        <div class="list-date">${formatDate(item.created_at)}</div>
      </div>
    `;
  }
  
  const icon = getDriveFileIcon(item.file_type || item.resource_type);
  const size = item.file_size ? formatFileSize(item.file_size) : '-';
  return `
    <div class="list-row" data-type="${type}" data-id="${item.id}" oncontextmenu="showContextMenu(event, '${type}', ${item.id}, ${courseId})">
      <div class="list-name">
        ${icon}
        <span>${item.title}</span>
      </div>
      <div class="list-size">${size}</div>
      <div class="list-date">${formatDate(item.created_at)}</div>
    </div>
  `;
}

function getDriveFileIcon(fileType) {
  if (!fileType) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#5f6368"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>';
  if (fileType.includes('pdf')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#ea4335"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>';
  if (fileType.includes('image')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#34a853"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
  if (fileType.includes('video')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#fbbc04"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>';
  if (fileType.includes('doc') || fileType.includes('word')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#4285f4"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>';
  if (fileType.includes('sheet') || fileType.includes('excel')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#0f9d58"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 14H9c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H9c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H9c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1z"/></svg>';
  return '<svg width="40" height="40" viewBox="0 0 24 24" fill="#5f6368"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>';
}

function formatFileSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function setResourcesView(mode, courseId) {
  resourcesViewMode = mode;
  const folderId = currentFolderStack[courseId]?.length > 0 
    ? currentFolderStack[courseId][currentFolderStack[courseId].length - 1].id 
    : null;
  loadFolderContents(courseId, folderId);
}

async function openFolder(courseId, folderId) {
  currentFolderStack[courseId] = currentFolderStack[courseId] || [];
  
  try {
    const pathResponse = await fetch(`${API_URL}/course-details/folders/path?folderId=${folderId}`);
    const path = await pathResponse.json();
    currentFolderStack[courseId] = path;
  } catch (e) {
    currentFolderStack[courseId].push({ id: folderId });
  }
  
  updateBreadcrumb(courseId);
  await loadFolderTree(courseId);
  await loadFolderContents(courseId, folderId);
}

async function navigateToFolder(courseId, folderId) {
  if (folderId === null) {
    currentFolderStack[courseId] = [];
  } else {
    await openFolder(courseId, folderId);
    return;
  }
  updateBreadcrumb(courseId);
  await loadFolderTree(courseId);
  await loadFolderContents(courseId, null);
}

function updateBreadcrumb(courseId) {
  const breadcrumb = document.getElementById(`breadcrumb-${courseId}`);
  if (!breadcrumb) return;

  const stack = currentFolderStack[courseId] || [];
  let html = `<span class="breadcrumb-item" onclick="navigateToFolder('${courseId}', null)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
    Resources
  </span>`;

  stack.forEach((item, index) => {
    if (item.isCourse) return;
    html += `<span class="breadcrumb-arrow">›</span>`;
    html += `<span class="breadcrumb-item ${index === stack.length - 1 ? 'active' : ''}" 
      onclick="navigateToIndex('${courseId}', ${index})">${item.name}</span>`;
  });

  breadcrumb.innerHTML = html;
}

window.navigateToIndex = function(courseId, index) {
  const stack = currentFolderStack[courseId];
  if (index < 0) {
    currentFolderStack[courseId] = [];
    loadFolderContents(courseId, null);
  } else {
    currentFolderStack[courseId] = stack.slice(0, index + 1);
    const folderId = stack[index].id;
    loadFolderContents(courseId, folderId);
  }
  updateBreadcrumb(courseId);
  loadFolderTree(courseId);
};

function showContextMenu(event, type, id, courseId) {
  event.preventDefault();
  event.stopPropagation();
  
  document.querySelectorAll('.context-menu').forEach(m => m.remove());
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  let items = [];
  if (type === 'folder') {
    items = [
      { label: 'Open', icon: '📂', action: `openFolder(${courseId}, ${id})` },
      ...(isAdmin ? [
        { label: 'Rename', icon: '✏️', action: `promptRename('folder', ${id}, ${courseId})` },
        { label: 'Move to...', icon: '📁', action: `showMoveModal('folder', ${id}, ${courseId})` },
        { divider: true },
        { label: 'Delete', icon: '🗑️', action: `confirmDelete('folder', ${id}, ${courseId})`, danger: true }
      ] : [])
    ];
  } else {
    const resource = { id, resource_type: document.querySelector(`[data-id="${id}"]`)?.dataset.type === 'file' ? 'file' : 'link' };
    items = [
      ...(isAdmin ? [
        { label: 'Rename', icon: '✏️', action: `promptRename('resource', ${id}, ${courseId})` },
        { label: 'Move to...', icon: '📁', action: `showMoveModal('resource', ${id}, ${courseId})` }
      ] : []),
      { divider: true },
      { label: resource.resource_type === 'link' ? 'Open Link' : 'Download', icon: resource.resource_type === 'link' ? '🔗' : '⬇️', action: `downloadResource(${id})` },
      ...(isAdmin ? [
        { divider: true },
        { label: 'Delete', icon: '🗑️', action: `confirmDelete('resource', ${id}, ${courseId})`, danger: true }
      ] : [])
    ];
  }
  
  menu.innerHTML = items.map(item => {
    if (item.divider) return '<div class="context-divider"></div>';
    return `<div class="context-item ${item.danger ? 'danger' : ''}" onclick="${item.action}; this.closest('.context-menu').remove()">
      <span>${item.icon}</span> ${item.label}
    </div>`;
  }).join('');
  
  document.body.appendChild(menu);
  
  document.addEventListener('click', () => menu.remove(), { once: true });
}

async function promptRename(type, id, courseId) {
  const currentName = type === 'folder' 
    ? (await fetch(`${API_URL}/course-details/folders/list?courseId=${courseId}`).then(r => r.json())).find(f => f.id === id)?.name
    : document.querySelector(`[data-id="${id}"] .item-name`)?.textContent;
  
  const newName = prompt('Enter new name:', currentName);
  if (!newName || newName === currentName) return;
  
  const endpoint = type === 'folder' ? `${API_URL}/course-details/folders/${id}` : `${API_URL}/course-details/resources/${id}`;
  const field = type === 'folder' ? 'name' : 'title';
  
  try {
    await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ [field]: newName })
    });
    
    const folderId = currentFolderStack[courseId]?.length > 0 
      ? currentFolderStack[courseId][currentFolderStack[courseId].length - 1].id 
      : null;
    loadFolderContents(courseId, folderId);
    loadFolderTree(courseId);
    showToast(`${type === 'folder' ? 'Folder' : 'File'} renamed successfully`, 'success');
  } catch (error) {
    showToast('Failed to rename', 'error');
  }
}

async function showMoveModal(type, id, courseId) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px; color: black;">
      <h3>Move ${type === 'folder' ? 'Folder' : 'File'}</h3>
      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px;">Select destination folder:</label>
        <select id="move-destination" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <option value="">Root (No Folder)</option>
        </select>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="executeMove('${type}', ${id}, ${courseId})">Move</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  try {
    const response = await fetch(`${API_URL}/course-details/folders/tree?courseId=${courseId}`);
    const folders = await response.json();
    const select = document.getElementById('move-destination');
    
    const addFolders = (items, prefix = '') => {
      items.forEach(f => {
        if (f.id != id) {
          const option = document.createElement('option');
          option.value = f.id;
          option.textContent = prefix + f.name;
          select.appendChild(option);
        }
        if (f.children) addFolders(f.children, prefix + '— ');
      });
    };
    addFolders(folders);
  } catch (error) {
    console.error('Load folders for move error:', error);
  }
}

async function executeMove(type, id, courseId) {
  const select = document.getElementById('move-destination');
  const newParentId = select.value || null;
  
  const endpoint = type === 'folder' 
    ? `${API_URL}/course-details/folders/${id}/move` 
    : `${API_URL}/course-details/resources/${id}/move`;
  
  try {
    await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ parentId: newParentId, folderId: newParentId })
    });
    
    document.querySelector('.modal.active')?.remove();
    
    const folderId = currentFolderStack[courseId]?.length > 0 
      ? currentFolderStack[courseId][currentFolderStack[courseId].length - 1].id 
      : null;
    loadFolderContents(courseId, folderId);
    loadFolderTree(courseId);
    showToast(`${type === 'folder' ? 'Folder' : 'File'} moved successfully`, 'success');
  } catch (error) {
    showToast('Failed to move', 'error');
  }
}

async function confirmDelete(type, id, courseId) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
  
  const endpoint = type === 'folder' 
    ? `${API_URL}/course-details/folders/${id}` 
    : `${API_URL}/course-details/resources/${id}`;
  
  try {
    await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    const folderId = currentFolderStack[courseId]?.length > 0 
      ? currentFolderStack[courseId][currentFolderStack[courseId].length - 1].id 
      : null;
    loadFolderContents(courseId, folderId);
    loadFolderTree(courseId);
    showToast(`${type === 'folder' ? 'Folder' : 'File'} deleted successfully`, 'success');
  } catch (error) {
    showToast('Failed to delete', 'error');
  }
}

function searchResources(courseId) {
  const query = document.getElementById(`resource-search-${courseId}`)?.value.toLowerCase() || '';
  const items = document.querySelectorAll(`#drive-content-${courseId} .drive-item`);
  
  items.forEach(item => {
    const name = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
    item.style.display = name.includes(query) ? '' : 'none';
  });
}

window.loadResourcesTab = loadResourcesTab;
window.openFolder = openFolder;
window.navigateToFolder = navigateToFolder;
window.navigateToIndex = navigateToIndex;
window.setResourcesView = setResourcesView;
window.showContextMenu = showContextMenu;
window.promptRename = promptRename;
window.showMoveModal = showMoveModal;
window.executeMove = executeMove;
window.confirmDelete = confirmDelete;
window.searchResources = searchResources;
