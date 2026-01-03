# 🐛 Mission Exploit 2.0 - Bug Report & Issues

**Platform:** Deployed on Vercel (Frontend) + Render (Backend)  
**Date:** January 2, 2026  
**Status:** Production Deployment

---

## 🔴 CRITICAL ISSUES

### 1. **Backend CORS Configuration - Production URL Mismatch**
**Severity:** CRITICAL  
**Location:** `backend/.env`, `backend/src/server.js`  
**Impact:** Frontend cannot communicate with backend

**Problem:**
```env
# backend/.env
FRONTEND_URL=http://localhost:3000  # ❌ WRONG - Points to localhost
```

The backend is configured to allow CORS only from `localhost:3000`, but the frontend is deployed on Vercel (likely `https://your-app.vercel.app`).

**Fix Required:**
```env
# backend/.env (on Render)
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

**Additional Issue:** The CORS config in `server.js` uses `origin: true` which allows ALL origins - this is insecure for production:
```javascript
// backend/src/server.js line 42
app.use(cors({
  origin: true,  // ❌ INSECURE - Allows any origin
  credentials: true,
}));
```

**Recommended Fix:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

---

### 2. **Missing Backend URL Validation in Frontend**
**Severity:** HIGH  
**Location:** `src/config/api.ts`, `src/api/*.ts`  
**Impact:** Silent failures, no error messages when backend is unreachable

**Problem:**
```typescript
// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
// No validation - could be undefined
```

If `VITE_BACKEND_URL` is not set in Vercel environment variables, all API calls will fail silently.

**Fix Required:**
Add validation and user-friendly error:
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.error('❌ VITE_BACKEND_URL is not configured!');
  throw new Error(
    'Backend URL is not configured. Please set VITE_BACKEND_URL environment variable.'
  );
}

export const API_BASE_URL = BACKEND_URL;
```

---

### 3. **HashRouter vs BrowserRouter - SEO & URL Issues**
**Severity:** MEDIUM  
**Location:** `src/App.tsx` line 11  
**Impact:** URLs have `#` prefix, poor SEO, breaks direct links

**Problem:**
```typescript
// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
// Using HashRouter causes URLs like: https://app.com/#/admin/dashboard
```

**Why This Matters:**
- URLs look unprofessional: `/#/admin` instead of `/admin`
- Cannot share direct links properly
- Poor SEO (search engines ignore hash fragments)
- Breaks browser history in some cases

**Fix Required:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* ... */}
    </BrowserRouter>
  );
}
```

**Also update `vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
(Already correct in your config ✓)

---

### 4. **Firebase Configuration Exposed in Production**
**Severity:** MEDIUM (Security Concern)  
**Location:** `.env.production`  
**Impact:** Firebase API keys visible in repository

**Problem:**
```env
# .env.production - COMMITTED TO REPO
VITE_FIREBASE_API_KEY=AIzaSyDm7vULkM6EYsIG89EsKHVEoyXHUp_B-YU
VITE_FIREBASE_PROJECT_ID=csbc-eva
# ... other sensitive config
```

**Note:** While Firebase API keys are meant to be public (they're in client-side code), having them in a committed `.env.production` file is bad practice.

**Recommended Fix:**
1. Move all production env vars to Vercel Environment Variables
2. Add `.env.production` to `.gitignore`
3. Use Vercel's environment variable system

---

## ⚠️ HIGH PRIORITY ISSUES

### 5. **Missing Error Boundary for API Failures**
**Severity:** HIGH  
**Location:** Multiple API client files  
**Impact:** App crashes on network errors

**Problem:**
API clients don't handle network failures gracefully:
```typescript
// src/api/adminApi.ts
const adminApi = axios.create({
  baseURL: API_BASE_URL || undefined, // Could be undefined
  timeout: 30000,
});
```

If `API_BASE_URL` is undefined, axios will make requests to the current domain, causing 404 errors.

**Fix Required:**
Add validation in axios interceptor:
```typescript
adminApi.interceptors.request.use(
  async (config) => {
    if (!config.baseURL) {
      throw new Error('Backend URL is not configured');
    }
    // ... rest of interceptor
  }
);
```

---

### 6. **Firestore Rules Block All Client Writes**
**Severity:** HIGH  
**Location:** `firestore.rules`  
**Impact:** Frontend cannot write to Firestore (by design, but may cause confusion)

**Current State:**
```
// firestore.rules
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if false;  // ❌ All writes blocked
}
```

**Analysis:**
This is intentional (all writes go through backend API), but:
1. No documentation explaining this architecture
2. Developers might try to write directly from frontend and get confused
3. Real-time listeners work, but updates don't

**Recommendation:**
Add comments in code and documentation explaining the write-through-backend architecture.

---

### 7. **Missing Environment Variable Checks on Startup**
**Severity:** MEDIUM  
**Location:** `backend/src/server.js`, `src/config/firebase.ts`  
**Impact:** Server starts but fails silently

**Problem:**
Backend doesn't validate required environment variables on startup:
```javascript
// backend/src/server.js
const PORT = Number(process.env.PORT);
if (!PORT || isNaN(PORT)) {
  throw new Error('PORT environment variable must be set');
}
// ✓ Good for PORT, but missing for other vars
```

**Missing Validations:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FRONTEND_URL`

**Fix Required:**
Add startup validation:
```javascript
const requiredEnvVars = [
  'PORT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FRONTEND_URL'
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. **Inconsistent Error Handling in Controllers**
**Severity:** MEDIUM  
**Location:** `backend/src/controllers/*.js`  
**Impact:** Inconsistent error messages, hard to debug

**Problem:**
Some controllers return detailed errors, others return generic messages:
```javascript
// flagController.js - Good
return res.status(403).json({
  success: false,
  error: 'You must check in at the location first before submitting flags',
});

// Other places - Generic
return res.status(500).json({
  success: false,
  error: 'Submission processing failed',  // ❌ Not helpful
});
```

**Fix Required:**
Standardize error responses with error codes:
```javascript
return res.status(500).json({
  success: false,
  error: 'Submission processing failed',
  errorCode: 'SUBMISSION_ERROR',
  details: process.env.NODE_ENV === 'development' ? error.message : undefined
});
```

---

### 9. **No Health Check Monitoring**
**Severity:** MEDIUM  
**Location:** Backend deployment  
**Impact:** No way to know if backend is down

**Problem:**
While there's a `/health` endpoint, there's no monitoring or alerting configured.

**Recommendation:**
1. Set up Render health checks (already has `/` endpoint ✓)
2. Add uptime monitoring (UptimeRobot, Pingdom, etc.)
3. Add logging service (Sentry, LogRocket)

---

### 10. **Missing Rate Limiting on Frontend**
**Severity:** MEDIUM  
**Location:** Frontend API clients  
**Impact:** Users can spam requests, hit rate limits

**Problem:**
Backend has rate limiting (5 req/min), but frontend doesn't handle 429 responses gracefully.

**Fix Required:**
Add retry logic with exponential backoff:
```typescript
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return adminApi.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### 11. **Participant Portal - Missing Team Assignment Check**
**Severity:** MEDIUM  
**Location:** `src/participant/pages/*.tsx`  
**Impact:** Players without teams see errors

**Problem:**
Participant pages assume user has a team:
```typescript
// src/participant/pages/Dashboard.tsx
const teamId = user?.teamId;  // Could be undefined
// No check before making API calls
```

**Fix Required:**
Add team assignment check:
```typescript
if (!user?.teamId) {
  return (
    <div>
      <h2>No Team Assigned</h2>
      <p>Please join or create a team first.</p>
      <Link to="/participant/team">Manage Team</Link>
    </div>
  );
}
```

---

## 🟢 LOW PRIORITY ISSUES

### 12. **Console Logs in Production**
**Severity:** LOW  
**Location:** Multiple files  
**Impact:** Performance, security (exposes internal logic)

**Problem:**
Many `console.log` statements in production code:
```typescript
console.log('User data loaded:', userData);
console.log('[Admin API] ${config.method?.toUpperCase()} ${config.url}');
```

**Fix Required:**
Use environment-aware logging:
```typescript
const isDev = import.meta.env.DEV;
if (isDev) console.log('User data loaded:', userData);
```

---

### 13. **Unused Imports and Dead Code**
**Severity:** LOW  
**Location:** Various files  
**Impact:** Larger bundle size

**Examples:**
- Unused Firebase Functions import in some files
- Commented-out code in `AdminUsers.tsx` (lines 67-71)

**Fix Required:**
Run ESLint and remove unused code:
```bash
npm run lint
```

---

### 14. **Missing Loading States**
**Severity:** LOW  
**Location:** Multiple pages  
**Impact:** Poor UX during API calls

**Problem:**
Some pages don't show loading indicators during API calls.

**Fix Required:**
Add loading states consistently:
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.call();
  } finally {
    setLoading(false);
  }
};
```

---

### 15. **No Offline Support**
**Severity:** LOW  
**Location:** Frontend  
**Impact:** App breaks completely when offline

**Recommendation:**
Add service worker for offline support:
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // ... config
    })
  ]
});
```

---

## 📋 DEPLOYMENT CHECKLIST

### Vercel (Frontend)
- [ ] Set `VITE_BACKEND_URL` to Render backend URL
- [ ] Set all `VITE_FIREBASE_*` variables
- [ ] Set `VITE_ADMIN_TOKEN` (match backend)
- [ ] Remove `.env.production` from repo
- [ ] Change `HashRouter` to `BrowserRouter`

### Render (Backend)
- [ ] Set `FRONTEND_URL` to Vercel URL
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT` (Render provides this automatically)
- [ ] Verify Firebase credentials are set
- [ ] Update CORS to use `FRONTEND_URL` instead of `origin: true`
- [ ] Add health check monitoring

### Firebase
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Verify security rules are active
- [ ] Check Firebase quota limits

---

## 🔧 QUICK FIXES (Priority Order)

1. **Fix CORS** - Update `backend/.env` FRONTEND_URL to Vercel URL
2. **Fix Backend URL** - Set `VITE_BACKEND_URL` in Vercel env vars
3. **Change Router** - Switch from HashRouter to BrowserRouter
4. **Add Validation** - Add startup env var validation in backend
5. **Remove Logs** - Clean up console.logs in production
6. **Add Monitoring** - Set up health check monitoring

---

## 📊 TESTING RECOMMENDATIONS

### Manual Testing
1. Test login flow (admin, captain, player)
2. Test team creation and joining
3. Test QR code scanning
4. Test flag submission
5. Test leaderboard updates
6. Test admin operations

### Automated Testing
```bash
# Backend health check
curl https://your-backend.onrender.com/health

# Frontend build test
npm run build

# Check for errors
npm run lint
```

---

## 📞 SUPPORT CONTACTS

- **Frontend Issues:** Check Vercel deployment logs
- **Backend Issues:** Check Render logs
- **Firebase Issues:** Check Firebase Console > Firestore > Usage

---

**Report Generated:** January 2, 2026  
**Next Review:** After fixes are applied
