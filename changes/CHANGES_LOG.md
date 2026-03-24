# Changes Log - Kolachi Tutors LMS

## Recent Fixes Applied

### 1. API URL Fix (FIXED)
**Date:** 2026-03-19
**File:** `public/js/app.js`
**Issue:** API was hardcoded to localhost
**Fix:** Changed `const API_URL = 'http://localhost:3000/api'` to `const API_URL = window.location.origin + '/api'`
**Status:** ✅ Fixed

---

### 2. Login Page - Remove Pre-filled Credentials (FIXED)
**Date:** 2026-03-19
**File:** `public/html/index.html`
**Issue:** Email and password were pre-filled in login form
**Fix:** Removed `value="admin@kolachi.edu.pk"` and `value="admin123"` from input fields
**Status:** ✅ Fixed

---

### 3. Course Upload Fix (FIXED)
**Date:** 2026-03-19
**File:** `src/server.ts`
**Issue:** Upload directory didn't exist
**Fix:** Added code to create `public/uploads/` directory on startup:
```typescript
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}
```
**Status:** ✅ Fixed

---

### 4. Course Display Fix (FIXED)
**Date:** 2026-03-19
**File:** `public/js/app.js`
**Issue:** Courses not showing on Courses page
**Fix:** Added `loadAllCoursesOnLoad()` function that runs on page load
**Status:** ✅ Fixed

---

### 5. Database Connection Fix (FIXED)
**Date:** 2026-03-19
**File:** `src/config/database.ts`
**Issue:** ECONNREFUSED - Database URL not being used
**Fix:** Updated pool config to use `DATABASE_URL` from environment:
```typescript
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // ...
  };
}
```
**Status:** ✅ Fixed

---

### 6. Course Download Fix (FIXED)
**Date:** 2026-03-19
**File:** `src/server.ts` and `src/controllers/courseController.ts`
**Issue:** Download not working
**Fix:** Added static middleware for uploads folder and fixed file path
**Status:** ✅ Fixed

---

### 7. Admin Delete Option (FIXED)
**Date:** 2026-03-19
**File:** `public/js/app.js`
**Issue:** Admin needed delete button for courses
**Fix:** Added `deleteCourse()` function and delete button for admin role
**Status:** ✅ Fixed

---

## Changes NOT to Repeat

1. ❌ DO NOT add `value="admin@kolachi.edu.pk"` to login email field
2. ❌ DO NOT add `value="admin123"` to login password field
3. ❌ DO NOT hardcode localhost in API_URL
4. ❌ DO NOT delete the uploads directory creation code

## Before Pushing Changes

1. Run `npm run build` to compile TypeScript
2. Test changes locally if possible
3. Add and commit with descriptive message
4. Push to GitHub
5. Trigger manual deploy on Render

## Render Deployment Steps

1. Go to https://dashboard.render.com
2. Select `kolachi-tutor-lms` service
3. Click "Deployments" tab
4. Click "Manual Deploy" → "Deploy latest commit"
5. Wait for deployment to complete
