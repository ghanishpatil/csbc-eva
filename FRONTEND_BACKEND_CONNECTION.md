# 🔗 Frontend-Backend Connection Guide

## ✅ Backend Status

Your backend is **LIVE** and working! 🎉

**Backend URL:** https://csbc-eva-backend.onrender.com

**Verification:**
- ✅ Root endpoint: https://csbc-eva-backend.onrender.com/ → Returns `{"success":true,"status":"OK"}`
- ✅ Health endpoint: https://csbc-eva-backend.onrender.com/health → Returns detailed status

---

## 🔧 Step 1: Update Frontend Configuration

### ✅ Already Done!

I've updated `.env.production` with your Render backend URL:
```env
VITE_BACKEND_URL=https://csbc-eva-backend.onrender.com
```

---

## 🏗️ Step 2: Build Frontend for Production

### Option A: Build Locally (For Testing)

1. **Open terminal** in project root (`F:\csbceva`)

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Build for production:**
   ```bash
   npm run build:prod
   ```
   or
   ```bash
   npm run build
   ```

4. **Preview the build locally** (optional):
   ```bash
   npm run preview
   ```
   - Opens at `http://localhost:3000`
   - Test that frontend connects to backend

5. **Test the connection:**
   - Open browser console (F12)
   - Look for: `🔧 API Configuration: Backend URL: https://csbc-eva-backend.onrender.com`
   - Try logging in or accessing API endpoints
   - Check Network tab for API calls to `csbc-eva-backend.onrender.com`

---

## 🚀 Step 3: Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables in Vercel Dashboard:**
   - Go to your project on Vercel
   - Settings → Environment Variables
   - Add all variables from `.env.production`:
     - `VITE_BACKEND_URL=https://csbc-eva-backend.onrender.com`
     - `VITE_FIREBASE_API_KEY=...`
     - `VITE_FIREBASE_AUTH_DOMAIN=...`
     - `VITE_FIREBASE_PROJECT_ID=...`
     - `VITE_FIREBASE_STORAGE_BUCKET=...`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
     - `VITE_FIREBASE_APP_ID=...`
     - `VITE_FIREBASE_MEASUREMENT_ID=...`
     - `VITE_ADMIN_TOKEN=...` (must match backend `ADMIN_SECRET_KEY`)

5. **Redeploy** after adding environment variables

---

### Option B: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Build and deploy:**
   ```bash
   npm run build:prod
   netlify deploy --prod --dir=dist
   ```

4. **Add Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add all variables from `.env.production`

---

### Option C: Deploy to Render (Static Site)

1. **Create new Static Site** on Render
2. **Connect your GitHub repository**
3. **Build Settings:**
   - **Build Command:** `npm run build:prod`
   - **Publish Directory:** `dist`
4. **Add Environment Variables:**
   - Add all variables from `.env.production`

---

### Option D: Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize (if not done):**
   ```bash
   firebase init hosting
   ```

4. **Build and deploy:**
   ```bash
   npm run build:prod
   firebase deploy --only hosting
   ```

5. **Set Environment Variables:**
   - Firebase Hosting doesn't support runtime env vars
   - Use `.env.production` during build (already configured)
   - Or use Firebase Functions for dynamic config

---

## ✅ Step 4: Verify Connection

### Test Checklist

1. **Backend Health Check:**
   - ✅ https://csbc-eva-backend.onrender.com/ → `{"success":true,"status":"OK"}`
   - ✅ https://csbc-eva-backend.onrender.com/health → Full status

2. **Frontend Connection:**
   - Open browser console (F12)
   - Look for API configuration log
   - Check Network tab for requests to `csbc-eva-backend.onrender.com`

3. **Test API Endpoints:**
   - Try logging in
   - Check if API calls succeed
   - Verify no CORS errors

4. **Common Issues:**
   - ❌ **CORS Error:** Backend already allows all origins, should not occur
   - ❌ **404 on API calls:** Check `VITE_BACKEND_URL` is correct
   - ❌ **Connection refused:** Backend might be sleeping (free tier), wait 30 seconds

---

## 🔍 Troubleshooting

### Issue 1: Frontend Can't Connect to Backend

**Symptoms:**
- Network errors in console
- "Failed to fetch" errors
- CORS errors

**Solutions:**
1. **Verify backend URL:**
   - Check `.env.production` has correct URL
   - Rebuild frontend: `npm run build:prod`

2. **Check backend is running:**
   - Visit: https://csbc-eva-backend.onrender.com/
   - Should return `{"success":true,"status":"OK"}`

3. **Check CORS:**
   - Backend allows all origins (`origin: true`)
   - Should not be a CORS issue

4. **Check environment variables:**
   - Ensure `VITE_BACKEND_URL` is set in deployment platform
   - Rebuild/redeploy after adding env vars

---

### Issue 2: Backend Returns 404

**Symptoms:**
- API calls return 404
- "Endpoint not found" errors

**Solutions:**
1. **Check API endpoint paths:**
   - Backend expects: `/api/...`
   - Frontend should call: `https://csbc-eva-backend.onrender.com/api/...`

2. **Verify route exists:**
   - Check backend logs in Render dashboard
   - Test endpoint directly: `https://csbc-eva-backend.onrender.com/api`

---

### Issue 3: Free Tier Backend Sleeping

**Symptoms:**
- First request takes 30+ seconds
- Connection timeout

**Solutions:**
1. **Wait for wake-up:**
   - Free tier services sleep after 15 min inactivity
   - First request wakes them up (takes 30-60 seconds)

2. **Upgrade to Starter plan:**
   - $7/month for always-on service
   - No sleep delays

3. **Use keep-alive service:**
   - Services like UptimeRobot ping every 5 minutes
   - Keeps service awake

---

## 📝 Environment Variables Summary

### Frontend (`.env.production`)

```env
# Backend URL
VITE_BACKEND_URL=https://csbc-eva-backend.onrender.com

# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSyDm7vULkM6EYsIG89EsKHVEoyXHUp_B-YU
VITE_FIREBASE_AUTH_DOMAIN=csbc-eva.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=csbc-eva
VITE_FIREBASE_STORAGE_BUCKET=csbc-eva.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1069699084490
VITE_FIREBASE_APP_ID=1:1069699084490:web:efb662bedd55081b79c433
VITE_FIREBASE_MEASUREMENT_ID=G-FPJVH0LT44

# Admin Token (must match backend ADMIN_SECRET_KEY)
VITE_ADMIN_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Backend (Render Environment Variables)

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@csbc-eva.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_SECRET_KEY=your_secure_random_string
```

**⚠️ Important:** `VITE_ADMIN_TOKEN` must match `ADMIN_SECRET_KEY` in backend!

---

## 🎉 Success Checklist

- [x] Backend deployed and accessible
- [x] `.env.production` updated with backend URL
- [ ] Frontend built for production
- [ ] Frontend deployed to hosting platform
- [ ] Environment variables added to hosting platform
- [ ] Frontend connects to backend (tested)
- [ ] API calls working
- [ ] No CORS errors
- [ ] Authentication working

---

## 🚀 Quick Start Commands

```bash
# 1. Build frontend
npm run build:prod

# 2. Test locally
npm run preview

# 3. Deploy to Vercel
vercel --prod

# 4. Or deploy to Netlify
netlify deploy --prod --dir=dist
```

---

**Your backend is ready! Now deploy your frontend and connect them! 🎉**

