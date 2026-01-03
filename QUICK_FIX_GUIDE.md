# ⚡ Quick Fix Guide - Mission Exploit 2.0

**Time to Fix:** ~15 minutes  
**Priority:** CRITICAL issues only

---

## 🚨 CRITICAL FIX #1: Backend CORS Configuration

### Problem
Backend can't communicate with frontend because CORS is misconfigured.

### Fix Steps

1. **Go to Render Dashboard** → Your Backend Service → Environment

2. **Update `FRONTEND_URL`:**
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
   (Replace with your actual Vercel URL)

3. **Redeploy backend** (Render will auto-redeploy on env change)

---

## 🚨 CRITICAL FIX #2: Frontend Backend URL

### Problem
Frontend doesn't know where the backend is.

### Fix Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables:**
   ```
   VITE_BACKEND_URL=https://csbc-eva-backend.onrender.com
   VITE_ADMIN_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
   ```

3. **Redeploy frontend:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## 🚨 CRITICAL FIX #3: Secure CORS (Backend)

### Problem
Backend allows requests from ANY origin (security risk).

### Fix

Update `backend/src/server.js` line 42:

**Before:**
```javascript
app.use(cors({
  origin: true,  // ❌ INSECURE
  credentials: true,
}));
```

**After:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

**Deploy:**
```bash
cd backend
git add src/server.js
git commit -m "fix: secure CORS configuration"
git push
```

---

## 🔧 HIGH PRIORITY FIX: Change Router

### Problem
URLs have ugly `#` prefix: `https://app.com/#/admin`

### Fix

Update `src/App.tsx` line 11:

**Before:**
```typescript
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
```

**After:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
```

**Deploy:**
```bash
git add src/App.tsx
git commit -m "fix: change HashRouter to BrowserRouter"
git push
```

Vercel will auto-deploy.

---

## 🔧 MEDIUM PRIORITY: Add Backend URL Validation

### Problem
No error message when backend URL is missing.

### Fix

Update `src/config/api.ts`:

**Before:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const API_BASE_URL = BACKEND_URL;
```

**After:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.error('❌ CRITICAL: VITE_BACKEND_URL is not configured!');
  console.error('Please set VITE_BACKEND_URL in Vercel environment variables.');
}

export const API_BASE_URL = BACKEND_URL || '';
```

---

## 🔧 MEDIUM PRIORITY: Add Startup Validation (Backend)

### Problem
Backend starts even with missing env vars.

### Fix

Add to `backend/src/server.js` after line 18 (after dotenv.config()):

```javascript
// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[Server] FATAL: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  throw new Error('Missing required environment variables');
}
```

---

## ✅ VERIFICATION STEPS

### 1. Test Backend Health
```bash
curl https://csbc-eva-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "OK",
  "service": "Mission Exploit 2.0 Backend",
  "version": "2.0.0"
}
```

### 2. Test Frontend-Backend Connection

1. Open your Vercel app: `https://your-app.vercel.app`
2. Open browser console (F12)
3. Try to login
4. Check console for errors

**Good Signs:**
- No CORS errors
- API calls show correct backend URL
- Login works

**Bad Signs:**
- `CORS policy` errors → Fix CORS
- `Network Error` → Check backend URL
- `404 Not Found` → Backend might be down

### 3. Test Admin Login

1. Go to `/login`
2. Login with admin account
3. Navigate to `/admin/dashboard`
4. Check if data loads

---

## 🐛 DEBUGGING TIPS

### If CORS errors persist:

1. **Check Render logs:**
   - Render Dashboard → Your Service → Logs
   - Look for CORS-related messages

2. **Verify FRONTEND_URL:**
   ```bash
   # In Render logs, you should see:
   🔒 CORS enabled for: https://your-vercel-app.vercel.app
   ```

3. **Test CORS manually:**
   ```bash
   curl -H "Origin: https://your-vercel-app.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://csbc-eva-backend.onrender.com/api/admin/stats
   ```

### If backend URL is wrong:

1. **Check Vercel env vars:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `VITE_BACKEND_URL` is set

2. **Check browser console:**
   ```javascript
   // In browser console:
   console.log(import.meta.env.VITE_BACKEND_URL)
   ```

3. **Force redeploy:**
   - Vercel → Deployments → Redeploy

### If Firebase errors:

1. **Check Firebase Console:**
   - Firebase Console → Firestore → Data
   - Verify collections exist

2. **Check Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Check browser console for auth errors**

---

## 📊 MONITORING SETUP

### Add Uptime Monitoring (Free)

1. **Sign up for UptimeRobot:** https://uptimerobot.com

2. **Add monitors:**
   - Backend: `https://csbc-eva-backend.onrender.com/health`
   - Frontend: `https://your-app.vercel.app`

3. **Set alert email**

### Check Render Metrics

1. Render Dashboard → Your Service → Metrics
2. Monitor:
   - Response time
   - Error rate
   - Memory usage

### Check Vercel Analytics

1. Vercel Dashboard → Your Project → Analytics
2. Monitor:
   - Page views
   - Error rate
   - Performance

---

## 🆘 EMERGENCY ROLLBACK

### If something breaks:

**Vercel (Frontend):**
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Render (Backend):**
1. Go to your service
2. Click "Manual Deploy"
3. Select previous commit
4. Deploy

**Firebase:**
```bash
# Rollback Firestore rules
firebase deploy --only firestore:rules
```

---

## 📞 SUPPORT

### Render Issues
- Check: https://status.render.com
- Logs: Render Dashboard → Logs

### Vercel Issues
- Check: https://www.vercel-status.com
- Logs: Vercel Dashboard → Deployments → View Function Logs

### Firebase Issues
- Check: https://status.firebase.google.com
- Console: https://console.firebase.google.com

---

## ✅ POST-FIX CHECKLIST

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Login works for all roles
- [ ] Admin dashboard loads
- [ ] Captain portal loads
- [ ] Participant portal loads
- [ ] Leaderboard updates in real-time
- [ ] No CORS errors in console
- [ ] No 404 errors in console
- [ ] URLs don't have `#` prefix (if you fixed router)

---

**Last Updated:** January 2, 2026  
**Estimated Fix Time:** 15-30 minutes
