# 🚀 Vercel Deployment Setup Guide

## Current Status

You're in the middle of Vercel setup. Here's what to answer for the remaining prompts:

---

## 📝 Vercel CLI Prompts - What to Answer

### ✅ Already Answered:
- **Set up and deploy?** → `yes` ✅
- **Which scope?** → `ghanish patil's projects` ✅
- **Link to existing project?** → `no` ✅
- **Project name?** → `csbc-eva` ✅
- **Code directory?** → `.` (current directory) ✅

### 🔄 Remaining Prompts (Expected):

#### 1. **Framework Preset**
```
? Want to override the settings? [y/N]
```
**Answer:** `N` (No - Vercel should auto-detect Vite)

OR if it asks:
```
? Which framework do you want to use?
```
**Answer:** `Vite` or select from list

---

#### 2. **Build Command**
```
? What's your Build Command?
```
**Answer:** `npm run build:prod`

OR if it auto-detects:
```
? Build Command: (npm run build)
```
**Answer:** Press Enter to accept, or type: `npm run build:prod`

---

#### 3. **Output Directory**
```
? What's your Output Directory?
```
**Answer:** `dist`

---

#### 4. **Install Command**
```
? Install Command: (npm install)
```
**Answer:** Press Enter to accept (default is correct)

---

#### 5. **Development Command** (if asked)
```
? Development Command: (npm run dev)
```
**Answer:** Press Enter to accept (default is correct)

---

## ⚙️ After Initial Setup

After Vercel finishes the initial deployment, you **MUST** add environment variables:

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Click on your project: **csbc-eva**

### Step 2: Add Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add these variables (one by one):

#### Required Variables:

**1. Backend URL:**
- **Key:** `VITE_BACKEND_URL`
- **Value:** `https://csbc-eva-backend.onrender.com`
- **Environment:** Production, Preview, Development (select all)

**2. Firebase API Key:**
- **Key:** `VITE_FIREBASE_API_KEY`
- **Value:** `AIzaSyDm7vULkM6EYsIG89EsKHVEoyXHUp_B-YU`
- **Environment:** Production, Preview, Development

**3. Firebase Auth Domain:**
- **Key:** `VITE_FIREBASE_AUTH_DOMAIN`
- **Value:** `csbc-eva.firebaseapp.com`
- **Environment:** Production, Preview, Development

**4. Firebase Project ID:**
- **Key:** `VITE_FIREBASE_PROJECT_ID`
- **Value:** `csbc-eva`
- **Environment:** Production, Preview, Development

**5. Firebase Storage Bucket:**
- **Key:** `VITE_FIREBASE_STORAGE_BUCKET`
- **Value:** `csbc-eva.firebasestorage.app`
- **Environment:** Production, Preview, Development

**6. Firebase Messaging Sender ID:**
- **Key:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value:** `1069699084490`
- **Environment:** Production, Preview, Development

**7. Firebase App ID:**
- **Key:** `VITE_FIREBASE_APP_ID`
- **Value:** `1:1069699084490:web:efb662bedd55081b79c433`
- **Environment:** Production, Preview, Development

**8. Firebase Measurement ID:**
- **Key:** `VITE_FIREBASE_MEASUREMENT_ID`
- **Value:** `G-FPJVH0LT44`
- **Environment:** Production, Preview, Development

**9. Admin Token:**
- **Key:** `VITE_ADMIN_TOKEN`
- **Value:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
- **Environment:** Production, Preview, Development
- **⚠️ IMPORTANT:** This must match your backend's `ADMIN_SECRET_KEY`!

### Step 3: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deployment

---

## ✅ Verification Checklist

After deployment:

- [ ] Deployment completed successfully
- [ ] All environment variables added
- [ ] Site is accessible at `https://csbc-eva.vercel.app` (or your custom domain)
- [ ] Open browser console (F12) and check for:
  - `🔧 API Configuration: Backend URL: https://csbc-eva-backend.onrender.com`
- [ ] Test login functionality
- [ ] Check Network tab for API calls to `csbc-eva-backend.onrender.com`
- [ ] Verify no CORS errors

---

## 🔧 Manual Configuration (If Needed)

If Vercel doesn't auto-detect correctly, you can manually configure:

### Option 1: Use vercel.json (Already Created)

I've created `vercel.json` in your project root. Vercel will use this automatically.

### Option 2: Configure in Vercel Dashboard

1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Update:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build:prod`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Development Command:** `npm run dev`

---

## 🐛 Troubleshooting

### Issue 1: Build Fails

**Check:**
- All environment variables are set
- Build command is correct: `npm run build:prod`
- Output directory is `dist`

**Solution:**
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct scripts

---

### Issue 2: 404 on Routes

**Problem:** React Router routes return 404

**Solution:**
- `vercel.json` already includes rewrite rules
- If still issues, check Vercel Settings → **Rewrites** section

---

### Issue 3: Environment Variables Not Working

**Problem:** Frontend can't access backend

**Solution:**
1. Verify all `VITE_*` variables are set
2. Redeploy after adding variables
3. Check browser console for errors
4. Verify `VITE_BACKEND_URL` is correct

---

### Issue 4: CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
- Backend already allows all origins
- Check backend is running: https://csbc-eva-backend.onrender.com/
- Verify `VITE_BACKEND_URL` is correct

---

## 📋 Quick Reference

### Vercel Configuration Summary

```json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Environment Variables Summary

All variables from `.env.production` must be added to Vercel:
- `VITE_BACKEND_URL=https://csbc-eva-backend.onrender.com`
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_PROJECT_ID=...`
- `VITE_FIREBASE_STORAGE_BUCKET=...`
- `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
- `VITE_FIREBASE_APP_ID=...`
- `VITE_FIREBASE_MEASUREMENT_ID=...`
- `VITE_ADMIN_TOKEN=...`

---

## 🎯 Next Steps

1. ✅ Complete Vercel CLI prompts (use answers above)
2. ✅ Wait for initial deployment
3. ✅ Add environment variables in Vercel dashboard
4. ✅ Redeploy
5. ✅ Test your live site!

---

**Continue with the Vercel prompts using the answers above! 🚀**

