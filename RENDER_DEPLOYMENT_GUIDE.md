# 🚀 Complete Render Deployment Guide - Backend

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub account
- [ ] Render account (sign up at https://render.com)
- [ ] Your code pushed to GitHub
- [ ] All environment variables ready (Firebase credentials, etc.)

---

## 🎯 STEP 1: Prepare Your Repository

### 1.1 Push Code to GitHub

1. **Open your terminal** in the project root (`F:\csbceva`)

2. **Check if you have a Git repository:**
   ```bash
   git status
   ```

3. **If not initialized, initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for Render deployment"
   ```

4. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Repository name: `csbc-eva` (or your preferred name)
   - Set to **Public** or **Private** (your choice)
   - **DO NOT** initialize with README, .gitignore, or license
   - Click **Create repository**

5. **Connect and push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/csbc-eva.git
   git branch -M main
   git push -u origin main
   ```
   > Replace `YOUR_USERNAME` with your GitHub username

6. **Verify push:**
   - Go to your GitHub repository
   - Confirm all files are there, especially the `backend/` folder

---

## 🔐 STEP 2: Prepare Environment Variables

### 2.1 Collect All Required Variables

Open `backend/.env.example` or your `backend/.env` file and collect these values:

**Required Variables:**
1. `NODE_ENV=production`
2. `FIREBASE_PROJECT_ID=csbc-eva` (your Firebase project ID)
3. `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com`
4. `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
5. `ADMIN_SECRET_KEY=your_secure_random_string`
6. `FRONTEND_URL=https://your-frontend-domain.com` (optional, CORS allows all)
7. `RATE_LIMIT_MAX_REQUESTS=5` (optional, defaults to 5)
8. `RATE_LIMIT_WINDOW_MS=60000` (optional, defaults to 60000)
9. Flag hashes (if you have them):
   - `LEVEL_1_FLAG_HASH=...`
   - `LEVEL_2_FLAG_HASH=...`
   - etc.

### 2.2 Format Firebase Private Key for Render

**⚠️ CRITICAL:** Render requires the private key in a specific format:

1. **Copy your private key** from `backend/.env`
2. **Remove outer quotes** if present
3. **Keep `\n` as literal characters** (do NOT convert to actual newlines)
4. **The entire key should be on ONE line**

**Example format:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQChX8etpmGw9Wbi\ni5M3K5f6lXZzNFIH+VV6arhpR4+jv0uB8YazkbAcjEWYVAxWry4ertlpOYE1T/Hs\n...\n-----END PRIVATE KEY-----\n
```

**✅ Correct:** `\n` as literal characters  
**❌ Wrong:** Actual line breaks

---

## 🌐 STEP 3: Create Render Account & Service

### 3.1 Sign Up / Log In to Render

1. Go to **https://render.com**
2. Click **Get Started for Free** or **Log In**
3. Sign up with GitHub (recommended) or email

### 3.2 Create New Web Service

1. **Click "New +"** button (top right)
2. Select **"Web Service"**
3. You'll see: **"Connect a repository"**

---

## 🔗 STEP 4: Connect GitHub Repository

### 4.1 Authorize Render (First Time Only)

1. If prompted, click **"Connect GitHub"** or **"Configure account"**
2. Authorize Render to access your repositories
3. Select **"All repositories"** or **"Only select repositories"** (your choice)

### 4.2 Select Your Repository

1. **Search for your repository** (`csbc-eva` or your repo name)
2. Click on it to select
3. Click **"Connect"**

---

## ⚙️ STEP 5: Configure Service Settings

### 5.1 Basic Information

**Name:**
- Enter: `mission-exploit-backend` (or your preferred name)
- This will be part of your URL: `mission-exploit-backend.onrender.com`

**Region:**
- Select closest to your users (e.g., **Oregon (US West)** or **Frankfurt (EU)**)

**Branch:**
- Leave as `main` (or your default branch)

**Root Directory:**
- **⚠️ CRITICAL:** Enter `backend`
- This tells Render where your backend code is located

**Runtime:**
- Select **Node**
- Version: **20.x** (or latest available)

### 5.2 Build & Deploy Settings

**Build Command:**
- Leave **EMPTY** (Render will auto-detect `npm install`)

**Start Command:**
- Enter: `npm start`
- This runs `node src/server.js` as defined in `package.json`

### 5.3 Instance Type

**Free Tier:**
- Select **Free** (768 MB RAM, shared CPU)
- ⚠️ Free tier spins down after 15 minutes of inactivity

**Paid Tier (Recommended for Production):**
- Select **Starter** ($7/month) or higher
- Always-on, better performance

---

## 🔐 STEP 6: Add Environment Variables

### 6.1 Open Environment Variables Section

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each variable

### 6.2 Add Each Variable (One by One)

**Click "Add Environment Variable" and add these:**

#### Variable 1: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- Click **"Save"**

#### Variable 2: FIREBASE_PROJECT_ID
- **Key:** `FIREBASE_PROJECT_ID`
- **Value:** `csbc-eva` (your actual Firebase project ID)
- Click **"Save"**

#### Variable 3: FIREBASE_CLIENT_EMAIL
- **Key:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `firebase-adminsdk-xxxxx@csbc-eva.iam.gserviceaccount.com`
- (Your actual service account email)
- Click **"Save"**

#### Variable 4: FIREBASE_PRIVATE_KEY
- **Key:** `FIREBASE_PRIVATE_KEY`
- **Value:** 
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQChX8etpmGw9Wbi\ni5M3K5f6lXZzNFIH+VV6arhpR4+jv0uB8YazkbAcjEWYVAxWry4ertlpOYE1T/Hs\n8z+CkBQUXE48V8cB6Z+uFs3JfbBpZTCum0rZFYWkQSCAd9RgJskYwDbz+XXHAxqP\n7YgaL71sB3QXaoLMDf2S/55yBIzEv8Z62KtZIHhL5zgFA5LK9L0I6NDltxCuf/N4\nagdpPbbL0nkw04NWZ48aexJzEvWE+gvQsRZDqDY0CMdQaFgrEegMWzt5TTzS+WRy\nEFSsFw6v9UtRpG9H0FWkIMeRSoFMC0Xc7sUisDRmTueXcodPQOoPFhuQCpTdYsrC\n/0xk3N0rAgMBAAECggEAHwCGHXvF79etbN9wqFw1Jdx59Zb7HXIOtGZ1SDCJzWUO\nTggHH09hXJKsOiAHgM3F1/oyZW85PfM+YI24yU4BtYmoNBqO7nSiCzFxVoDRl+Xr\nTNgjsIHce1pRsqySvegloR4oUIW/1Txo6XayO4mpY+wopuj8+NPFP+zg1Tm/i3qY\nDdmXlTgVJ0SOKaJc13Nf3U1EiasD70M/alxiuG54TnUcKapXxoVA6yzHTi3FAAKI\njfQM7OdBf8nG5ITDH45bet+XOBF0wRYgp0DK8+kIvsaIh+T02k0BWJz9UOxJGbL8\n+hbBhsMymzWFnjFW92N4MLiktflqWjWqKfhGHza6kQKBgQDaJMHI8FOx6tHjOFQW\njbmpL2nPxgWLiKVoYCpc7iHogiwgOc0mqTS4Qsdh9YK3K91SPqgHGX53HcvUn79P\nuef1zMUpWNL9fN04hCswC/ZoTfsQB6KNZ/LrwV4yHuz7SERKLD/P7/XmWdTKwDum\nF8b2FEagCQjBSJOJWOKa8f91ewKBgQC9YPwbhJI1ewtHMWx9P9wGhy0WOwUGWNBp\n+wY7/G50KgDlrCOaDcn2xDqwey7YiT/ZNWMLYjy6pKyADDxsKGINy2xtaF7nRjEe\nolG3Sr2BC6DsewzgmTN/6fiuO/Pk6H/A+kiMoutmrHPqKCZgX5LuJoeEGGJPIYW2\n4mwm3u0wEQKBgCmIohTeHTFc4kV+7hO1PEpIKr9Slq+wfr3WwXocJPyd/ETOfI8F\n3HHQ1SGDmzXA9ky4fUmMwxVu6OY83DIT1WRpboimztVQttYR5B8rx+ioIEs3CO4f\ngpL8qDCmzrwxUD9HGYc/yvPm2qsX2sOO92TXC3NhBPe4F88oy0xxExCNAoGBALki\nStOL8nMd6pSamHiJKUuockc9Q1hFEtnIcPvLdx9QwLfGZLeBq2L1ynokslM1OZna\nOw0x6DR+L7SuQZNqlxDtQP5j/gMR94r/G+uXwVKaT6NfV+NpYZM248lRCslJETtS\ncgIqcv5YsKjEv1+Pj1AJkolsXQ8GsnVrPFdzr2RBAoGAWrE/N5WHZ8fLC0TfuHgK\n/XYrdtH+1jBFZLot+eXO6KyEn4WsQC+XD0hk+PKpJw1HWc9TOdtP4Rsyicy1UdbR\nqad0UWyJGPr6T4/H1Q36pvK0QezBI4TI9y1Le/+Zp4qWlqKDEBdCfyueEwZgYHLw\nlT6MKZyruCa8tvcCMrKwQDQ=\n-----END PRIVATE KEY-----\n
  ```
- **⚠️ IMPORTANT:** 
  - Paste the ENTIRE key as ONE line
  - Keep `\n` as literal characters (do NOT press Enter)
  - Include the quotes if your key has them, or remove them
- Click **"Save"**

#### Variable 5: ADMIN_SECRET_KEY
- **Key:** `ADMIN_SECRET_KEY`
- **Value:** Generate a strong random string:
  ```bash
  # In your terminal, run:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Copy the output and paste as the value
- Click **"Save"**

#### Variable 6: FRONTEND_URL (Optional)
- **Key:** `FRONTEND_URL`
- **Value:** `https://your-frontend-domain.com` (your frontend URL)
- Or leave empty (CORS allows all origins)
- Click **"Save"**

#### Variable 7: RATE_LIMIT_MAX_REQUESTS (Optional)
- **Key:** `RATE_LIMIT_MAX_REQUESTS`
- **Value:** `5` (or your preferred limit)
- Click **"Save"**

#### Variable 8: RATE_LIMIT_WINDOW_MS (Optional)
- **Key:** `RATE_LIMIT_WINDOW_MS`
- **Value:** `60000` (60 seconds in milliseconds)
- Click **"Save"**

#### Flag Hashes (If You Have Them)
- Add each level's flag hash:
  - `LEVEL_1_FLAG_HASH=your_hash_here`
  - `LEVEL_2_FLAG_HASH=your_hash_here`
  - etc.

### 6.3 Verify All Variables

Scroll through the environment variables list and confirm:
- ✅ All required variables are present
- ✅ No typos in variable names
- ✅ Values are correct

---

## 🏥 STEP 7: Configure Health Check

### 7.1 Health Check Settings

1. Scroll to **"Health Check Path"** section
2. Enter: `/`
3. This will ping `https://your-service.onrender.com/` to check if the server is alive

**Alternative:** You can also use `/health` for a more detailed health check

---

## 💾 STEP 8: Advanced Settings (Optional)

### 8.1 Auto-Deploy

- **Auto-Deploy:** Leave **ON** (deploys automatically on git push)
- Or set to **OFF** if you want manual deployments

### 8.2 Pull Request Previews

- Leave **OFF** (unless you want preview deployments for PRs)

---

## 🚀 STEP 9: Deploy

### 9.1 Create Service

1. Scroll to the bottom
2. Click **"Create Web Service"**
3. Render will start building and deploying

### 9.2 Monitor Build Logs

You'll see a build log showing:
1. **Cloning repository...**
2. **Installing dependencies...** (`npm install`)
3. **Building...** (if build command exists)
4. **Starting service...** (`npm start`)

**Watch for errors:**
- ❌ If you see Firebase initialization errors → Check `FIREBASE_PRIVATE_KEY` format
- ❌ If you see port errors → Check that `PORT` is not hardcoded (Render provides it)
- ❌ If you see module not found → Check `Root Directory` is set to `backend`

### 9.3 Wait for Deployment

- **First deployment:** Takes 3-5 minutes
- **Status:** Will show "Live" when ready
- **URL:** Will be displayed (e.g., `https://mission-exploit-backend.onrender.com`)

---

## ✅ STEP 10: Verify Deployment

### 10.1 Test Health Endpoint

1. **Copy your service URL** from Render dashboard
2. **Open in browser:** `https://your-service.onrender.com/`
3. **Expected response:**
   ```json
   {
     "success": true,
     "status": "OK"
   }
   ```

### 10.2 Test Health Endpoint (Detailed)

1. **Open:** `https://your-service.onrender.com/health`
2. **Expected response:**
   ```json
   {
     "success": true,
     "status": "OK",
     "service": "Mission Exploit 2.0 Backend",
     "version": "2.0.0",
     "environment": "production",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": 123.456
   }
   ```

### 10.3 Test API Info Endpoint

1. **Open:** `https://your-service.onrender.com/api`
2. **Expected:** JSON with API endpoints list

### 10.4 Check Logs

1. In Render dashboard, click **"Logs"** tab
2. **Look for:**
   ```
   🚀 MISSION EXPLOIT 2.0 - SECURE BACKEND
   ============================================================
   📡 Server running on port 10000
   🌍 Environment: production
   🔒 CORS enabled for: All origins
   ⚡ Firebase project: csbc-eva
   🛡️  Rate limiting: 5 requests/min
   ============================================================
   
   ✅ Server is ready to accept requests
   ```

---

## 🔧 STEP 11: Update Frontend Configuration

### 11.1 Get Your Backend URL

1. Copy your Render service URL: `https://mission-exploit-backend.onrender.com`
2. This is your production backend URL

### 11.2 Update Frontend Environment

1. **Open:** `.env.production` in your project root
2. **Update:**
   ```env
   VITE_BACKEND_URL=https://mission-exploit-backend.onrender.com
   ```
3. **Save the file**

### 11.3 Rebuild Frontend

```bash
npm run build:prod
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - "Cannot find module"

**Problem:** Root directory not set correctly

**Solution:**
1. Go to Render dashboard → Your service → Settings
2. Check **"Root Directory"** is set to `backend`
3. Save and redeploy

---

### Issue 2: Firebase Initialization Error

**Problem:** `FIREBASE_PRIVATE_KEY` format is wrong

**Solution:**
1. Go to Environment Variables
2. Edit `FIREBASE_PRIVATE_KEY`
3. Ensure:
   - Entire key is on ONE line
   - `\n` are literal characters (not actual newlines)
   - Includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
4. Save and redeploy

---

### Issue 3: Server Starts Then Stops

**Problem:** Health check failing or port binding issue

**Solution:**
1. Check logs for errors
2. Verify health check path is `/` or `/health`
3. Ensure server binds to `0.0.0.0` (already done in your code)
4. Check that `PORT` is not hardcoded (Render provides it)

---

### Issue 4: CORS Errors from Frontend

**Problem:** Frontend URL not in CORS whitelist

**Solution:**
- Your backend already allows all origins (`origin: true`)
- If still having issues, add `FRONTEND_URL` environment variable with your frontend domain

---

### Issue 5: Service Spins Down (Free Tier)

**Problem:** Free tier services sleep after 15 minutes of inactivity

**Solution:**
- Upgrade to **Starter** plan ($7/month) for always-on service
- Or use a service like UptimeRobot to ping your service every 5 minutes

---

## 📝 Quick Reference

### Render Service Settings Summary

```
Name: mission-exploit-backend
Region: Oregon (US West) [or closest to users]
Branch: main
Root Directory: backend
Runtime: Node 20
Build Command: (empty)
Start Command: npm start
Health Check Path: /
Instance Type: Free / Starter
```

### Required Environment Variables

```
NODE_ENV=production
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_SECRET_KEY=your_secure_random_string
```

### Optional Environment Variables

```
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000
LEVEL_1_FLAG_HASH=...
LEVEL_2_FLAG_HASH=...
```

---

## 🎉 Success Checklist

- [ ] Service is "Live" in Render dashboard
- [ ] Health check (`/`) returns `{"success": true, "status": "OK"}`
- [ ] Detailed health (`/health`) returns full status
- [ ] API info (`/api`) returns endpoints list
- [ ] Logs show "Server is ready to accept requests"
- [ ] No errors in logs
- [ ] Frontend updated with backend URL
- [ ] Frontend can connect to backend API

---

## 📞 Next Steps

1. **Test all API endpoints** from your frontend
2. **Monitor logs** for any errors
3. **Set up custom domain** (optional, in Render Settings → Custom Domains)
4. **Enable HTTPS** (automatic on Render)
5. **Set up monitoring** (optional, Render has built-in monitoring)

---

**Your backend is now live on Render! 🚀**

