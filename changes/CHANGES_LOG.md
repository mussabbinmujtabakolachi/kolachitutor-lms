# Changes Log - Kolachi Tutors LMS

## All Fixes Applied (Keep Safe)

### 1. API URL Fix ✅
**File:** `public/js/app.js`
**Change:** `const API_URL = window.location.origin + '/api'`
**DO NOT CHANGE:** This must use dynamic origin

### 2. Login Credentials Removed ✅
**File:** `public/html/index.html`
**Change:** No `value=""` in email/password inputs
**DO NOT ADD:** Any pre-filled credentials

### 3. Uploads Directory Creation ✅
**File:** `src/server.ts`
**Code:**
```typescript
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}
```
**DO NOT DELETE:** This is required for file uploads

### 4. Courses Display on Load ✅
**File:** `public/js/app.js`
**Function:** `loadAllCoursesOnLoad()` runs on page load
**DO NOT REMOVE:** This shows courses without login

### 5. Database Connection ✅
**File:** `src/config/database.ts`
**Feature:** Uses `DATABASE_URL` from environment with SSL
**DO NOT CHANGE:** Connection string setup

### 6. Course Download ✅
**Files:** `src/server.ts`, `src/controllers/courseController.ts`
**Feature:** Static serving of uploads folder
**DO NOT DELETE:** `app.use('/uploads', ...)`

### 7. Admin Delete Button ✅
**File:** `public/js/app.js`
**Function:** `deleteCourse()` and button for admin
**ALSO:** `window.deleteCourse = deleteCourse;` exported

### 8. Dashboard Navigation Cards ✅
**Files:** `public/html/index.html`, `public/css/style.css`, `public/js/app.js`
**Feature:** Big clickable cards for Courses, Questions, Admin
**DO NOT REMOVE:** Cards from dashboard page

### 9. Stats Loading for All Users ✅
**File:** `public/js/app.js`
**Function:** `loadStats()` with token optional
**IMPORTANT:** Stats API needs Authorization header

---

## Files Modified (Main Reference)

| File | Purpose |
|------|---------|
| `src/server.ts` | Express server, uploads dir, static files |
| `src/config/database.ts` | PostgreSQL connection |
| `src/routes/*.ts` | API endpoints |
| `src/controllers/*.ts` | Business logic |
| `public/js/app.js` | Frontend JavaScript |
| `public/html/index.html` | HTML structure |
| `public/css/style.css` | Styles and animations |

---

## Common Mistakes to Avoid

1. ❌ DO NOT add pre-filled values to login form
2. ❌ DO NOT hardcode localhost in API_URL
3. ❌ DO NOT remove uploads directory creation
4. ❌ DO NOT remove static middleware for /uploads
5. ❌ DO NOT make stats API require auth (breaks dashboard for non-admins)

---

## Before Any Change

1. Check this log first
2. Verify the fix doesn't break previous changes
3. Update this log with new changes
4. Run `npm run build` before push
5. Push and deploy

---

## Deployment Checklist

- [x] API URL uses dynamic origin
- [x] Login form empty
- [x] Courses display on page load
- [x] Stats show for all users
- [x] Upload works
- [x] Download works
- [x] Delete works for admin
- [x] Dashboard has navigation cards

---

## Google Drive-Style Resources Feature (v2)

### Backend APIs Added

**File:** `src/controllers/courseDetailController.ts`
- `getFolderContents` - Get folders & files in a specific folder
- `renameFolder` - Rename a folder
- `moveFolder` - Move folder to different parent (with cycle detection)
- `getFolderPath` - Get breadcrumb path for navigation
- `getAllFoldersTree` - Get full folder tree for sidebar
- `moveResource` - Move resource to different folder
- `renameResource` - Rename a resource

**File:** `src/routes/courseDetails.ts`
- `GET /folders/contents` - Get folder contents
- `GET /folders/tree` - Get folder tree for sidebar
- `GET /folders/path` - Get breadcrumb path
- `PUT /folders/:id` - Rename folder
- `PUT /folders/:id/move` - Move folder
- `PUT /resources/:id` - Rename resource
- `PUT /resources/:id/move` - Move resource

### Frontend Features

**File:** `public/js/app.js`
- `loadResourcesTab()` - Main Google Drive UI component
- `loadFolderTree()` - Sidebar folder navigation
- `loadFolderContents()` - Grid/List view rendering
- `openFolder()` / `navigateToFolder()` - Folder navigation
- `updateBreadcrumb()` - Breadcrumb navigation
- `setResourcesView()` - Grid/List toggle
- `showContextMenu()` - Right-click context menu
- `promptRename()` - Rename dialog
- `showMoveModal()` - Move dialog
- `executeMove()` - Execute move operation
- `confirmDelete()` - Delete confirmation
- `searchResources()` - Search within folder
- Drag & drop upload handlers

**File:** `public/css/style.css`
- Google Drive-style layout (sidebar + main area)
- Grid and list view styles
- Context menu styles
- Drag & drop overlay styles

### Features Implemented
- [x] Nested folder support (parent_folder_id)
- [x] Sidebar folder tree navigation
- [x] Grid/List view toggle
- [x] Breadcrumb navigation
- [x] Right-click context menu (Rename, Move, Delete)
- [x] Drag & drop file upload
- [x] Search within folder
- [x] File type icons
- [x] File size formatting
- [x] Responsive design
