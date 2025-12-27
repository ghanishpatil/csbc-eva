# ✅ Render Deployment Quick Checklist

## Before You Start
- [ ] Code is pushed to GitHub
- [ ] You have a Render account (sign up at render.com)
- [ ] You have all environment variables ready

## Step-by-Step Checklist

### 1. Create Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your repository

### 2. Configure Service
- [ ] **Name:** `mission-exploit-backend`
- [ ] **Root Directory:** `backend` ⚠️ CRITICAL
- [ ] **Runtime:** Node 20
- [ ] **Build Command:** (leave empty)
- [ ] **Start Command:** `npm start`
- [ ] **Health Check Path:** `/`

### 3. Environment Variables (Add One by One)
- [ ] `NODE_ENV` = `production`
- [ ] `FIREBASE_PROJECT_ID` = `csbc-eva` (your actual project ID)
- [ ] `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com`
- [ ] `FIREBASE_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` (ONE LINE, keep \n as literal)
- [ ] `ADMIN_SECRET_KEY` = (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `FRONTEND_URL` = `https://your-frontend-domain.com` (optional)
- [ ] `RATE_LIMIT_MAX_REQUESTS` = `5` (optional)
- [ ] `RATE_LIMIT_WINDOW_MS` = `60000` (optional)

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check logs for "Server is ready to accept requests"

### 5. Verify
- [ ] Test: `https://your-service.onrender.com/` → Should return `{"success": true, "status": "OK"}`
- [ ] Test: `https://your-service.onrender.com/health` → Should return detailed status
- [ ] Check logs for errors

### 6. Update Frontend
- [ ] Copy backend URL from Render
- [ ] Update `.env.production`: `VITE_BACKEND_URL=https://your-service.onrender.com`
- [ ] Rebuild frontend: `npm run build:prod`

## Common Issues

### ❌ Build Fails
- Check "Root Directory" is set to `backend`
- Check all dependencies are in `backend/package.json`

### ❌ Firebase Error
- Check `FIREBASE_PRIVATE_KEY` is ONE line with `\n` as literal characters
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_CLIENT_EMAIL` are correct

### ❌ Service Stops
- Check health check path is `/`
- Check logs for errors
- Verify `PORT` is not hardcoded (Render provides it automatically)

### ❌ CORS Errors
- Backend already allows all origins (`origin: true`)
- If still issues, add `FRONTEND_URL` environment variable

## Your Backend URL
After deployment, your backend will be at:
```
https://mission-exploit-backend.onrender.com
```
(Replace `mission-exploit-backend` with your service name)

---

**Full detailed guide:** See `RENDER_DEPLOYMENT_GUIDE.md`

