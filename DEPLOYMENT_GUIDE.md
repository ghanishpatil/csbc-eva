# 🚀 Mission Exploit 2.0 - Complete Deployment Guide

This guide provides step-by-step instructions to deploy the Mission Exploit CTF platform to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Security Setup](#security-setup)
7. [Firestore Rules & Indexes](#firestore-rules--indexes)
8. [Testing & Verification](#testing--verification)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Accounts & Tools

- ✅ **Firebase Account** - [firebase.google.com](https://firebase.google.com)
- ✅ **Node.js 18+** - [nodejs.org](https://nodejs.org)
- ✅ **npm or yarn** - Package manager
- ✅ **Git** - Version control
- ✅ **Firebase CLI** - `npm install -g firebase-tools`
- ✅ **Backend Hosting** (Choose one):
  - **VPS/Server** (DigitalOcean, AWS EC2, Linode, etc.)
  - **Cloud Platform** (Railway, Render, Heroku, etc.)
  - **Docker** (Docker Hub, AWS ECS, etc.)
- ✅ **Frontend Hosting** (Choose one):
  - **Vercel** (Recommended - Free tier available)
  - **Netlify** (Free tier available)
  - **Firebase Hosting** (Free tier available)
  - **Cloudflare Pages** (Free tier available)

### System Requirements

**Backend Server:**
- CPU: 1+ cores
- RAM: 512MB+ (1GB recommended)
- Storage: 1GB+
- OS: Linux (Ubuntu 20.04+ recommended) or Windows Server

**Frontend:**
- Static hosting (any modern hosting platform)

---

## 2. Firebase Setup

### Step 2.1: Create/Select Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or select existing project
3. Enter project name: `mission-exploit` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Click **"Create project"**

### Step 2.2: Enable Firebase Services

#### Enable Authentication
1. Go to **Authentication** → **Get Started**
2. Enable **Email/Password** provider
3. Click **Save**

#### Enable Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Select **Production mode**
3. Choose a location (closest to your users)
4. Click **Enable**

#### Enable Firebase Hosting (Optional - for frontend)
1. Go to **Hosting** → **Get Started**
2. Follow the setup wizard

### Step 2.3: Create Service Account

1. Go to **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (keep it secure!)
4. Save the file as `backend/firebase-service-account.json`

**⚠️ IMPORTANT:** Never commit this file to Git!

### Step 2.4: Get Firebase Web Config

1. Go to **Project Settings** → **General**
2. Scroll to **"Your apps"** section
3. Click **Web icon** (`</>`) to add a web app
4. Register app name: `Mission Exploit Frontend`
5. Copy the Firebase configuration object

You'll need these values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId` (if enabled)

---

## 3. Backend Deployment

### Option A: Deploy to VPS/Server (Recommended for Production)

#### Step 3.1: Prepare Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version
```

#### Step 3.2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/mission-exploit-ctf.git
cd mission-exploit-ctf/backend

# Install dependencies
npm install --production
```

#### Step 3.3: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following (replace with your actual values):

```env
# Server Configuration
PORT=5002
NODE_ENV=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# CORS Configuration (Your frontend URL)
FRONTEND_URL=https://your-frontend-domain.com

# Security Settings
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_SECRET_KEY=generate_strong_random_string_here_min_32_chars

# Scoring Configuration
DEFAULT_BASE_SCORE=500
DEFAULT_HINT_DEDUCTION=50
DEFAULT_TIME_MULTIPLIER=1
```

**Generate Strong ADMIN_SECRET_KEY:**
```bash
# Generate a secure random string
openssl rand -hex 32
```

#### Step 3.4: Setup Firebase Service Account

```bash
# Copy service account JSON to backend directory
scp firebase-service-account.json user@your-server:/path/to/backend/

# Or create from environment variables (recommended)
# The backend will use FIREBASE_PRIVATE_KEY from .env
```

#### Step 3.5: Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
cd backend
pm2 start src/server.js --name mission-exploit-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

#### Step 3.6: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/mission-exploit-backend
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable configuration:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mission-exploit-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 3.7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal is set up automatically
```

### Option B: Deploy to Railway/Render/Heroku

#### Railway Deployment

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Add environment variables (see Step 3.3)
5. Railway will auto-deploy

#### Render Deployment

1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
5. Add environment variables
6. Click **"Create Web Service"**

#### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mission-exploit-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=your-project-id
# ... (add all other env vars)

# Deploy
git push heroku main
```

### Option C: Docker Deployment

```bash
# Build Docker image
cd backend
docker build -t mission-exploit-backend .

# Run container
docker run -d \
  --name mission-exploit-backend \
  -p 5002:5002 \
  --env-file .env \
  mission-exploit-backend

# Or use docker-compose
docker-compose up -d
```

---

## 4. Frontend Deployment

### Option A: Deploy to Vercel (Recommended)

#### Step 4.1: Prepare Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

#### Step 4.2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variables:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   VITE_BACKEND_URL=https://api.your-domain.com
   VITE_ADMIN_TOKEN=your-admin-token
   ```
7. Click **"Deploy"**

#### Step 4.3: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your domain: `your-domain.com`
3. Follow DNS configuration instructions
4. Vercel will auto-configure SSL

### Option B: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub repository
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variables (same as Vercel)
6. Click **"Deploy site"**

### Option C: Deploy to Firebase Hosting

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Select your Firebase project
# Public directory: dist
# Single-page app: Yes
# Overwrite index.html: No

# Build frontend
npm run build

# Deploy
firebase deploy --only hosting
```

### Option D: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages** → **Create a project**
3. Connect GitHub repository
4. Configure:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Add environment variables
6. Click **"Save and Deploy"**

---

## 5. Environment Configuration

### Frontend Environment Variables

Create `.env.production` file in root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDm7vULkM6EYsIG89EsKHVEoyXHUp_B-YU
VITE_FIREBASE_AUTH_DOMAIN=csbc-eva.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=csbc-eva
VITE_FIREBASE_STORAGE_BUCKET=csbc-eva.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1069699084490
VITE_FIREBASE_APP_ID=1:1069699084490:web:efb662bedd55081b79c433
VITE_FIREBASE_MEASUREMENT_ID=G-FPJVH0LT44

# Backend API URL (Production)
VITE_BACKEND_URL=https://api.your-domain.com

# Admin Token (Optional - for admin features)
VITE_ADMIN_TOKEN=your-secure-admin-token
```

**⚠️ IMPORTANT:**
- Replace all placeholder values with your actual Firebase config
- Update `VITE_BACKEND_URL` to your production backend URL
- Never commit `.env.production` to Git (add to `.gitignore`)

### Backend Environment Variables

See Step 3.3 for backend `.env` configuration.

---

## 6. Security Setup

### Step 6.1: Generate Flag Hashes

```bash
# Navigate to backend
cd backend

# Generate flag hashes for all levels
node scripts/generate-flag-hashes.js

# Or manually generate:
echo -n "CSBC{your_flag_here}" | sha256sum
```

### Step 6.2: Update Backend Security

1. **Generate Strong Admin Secret:**
   ```bash
   openssl rand -hex 32
   ```
   Add to `backend/.env` as `ADMIN_SECRET_KEY`

2. **Set Strong Rate Limits:**
   ```env
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Enable HTTPS Only:**
   - Ensure all URLs use `https://`
   - Configure CORS to only allow your frontend domain

### Step 6.3: Firebase Security Rules

The security rules are already configured in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

---

## 7. Firestore Rules & Indexes

### Step 7.1: Deploy Firestore Rules

```bash
# Login to Firebase
firebase login

# Select project
firebase use your-project-id

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 7.2: Deploy Firestore Indexes

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**Note:** Indexes may take a few minutes to build. Check Firebase Console → Firestore → Indexes for status.

### Step 7.3: Verify Indexes

1. Go to Firebase Console → Firestore → Indexes
2. Wait for all indexes to show "Enabled" status
3. If any queries fail, check the error message for missing indexes

---

## 8. Testing & Verification

### Step 8.1: Backend Health Check

```bash
# Test backend endpoint
curl https://api.your-domain.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Step 8.2: Frontend Verification

1. Visit your frontend URL: `https://your-domain.com`
2. Verify:
   - ✅ Landing page loads
   - ✅ Login page accessible
   - ✅ No console errors
   - ✅ API calls work (check Network tab)

### Step 8.3: Authentication Test

1. Create a test user account
2. Login and verify:
   - ✅ User can authenticate
   - ✅ Role-based redirect works
   - ✅ Protected routes are accessible

### Step 8.4: Admin Portal Test

1. Create an admin user (manually in Firestore or via script)
2. Login as admin
3. Verify:
   - ✅ Can create teams
   - ✅ Can create levels
   - ✅ Can manage groups
   - ✅ Event control works

### Step 8.5: Participant Flow Test

1. Create a participant account
2. Join/create a team
3. Verify:
   - ✅ Can check in with QR code
   - ✅ Can view active mission
   - ✅ Can submit flags
   - ✅ Leaderboard updates

---

## 9. Monitoring & Maintenance

### Step 9.1: Setup Logging

**Backend Logging:**
- PM2 logs: `pm2 logs mission-exploit-backend`
- Save logs: `pm2 install pm2-logrotate`

**Frontend Error Tracking:**
- Consider integrating Sentry or LogRocket
- Monitor browser console errors

### Step 9.2: Setup Monitoring

**Backend Monitoring:**
- Use PM2 monitoring: `pm2 monit`
- Setup uptime monitoring (UptimeRobot, Pingdom)
- Monitor API response times

**Firebase Monitoring:**
- Firebase Console → Performance Monitoring
- Firebase Console → Crashlytics (if enabled)

### Step 9.3: Backup Strategy

**Firestore Backup:**
```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)

# Schedule regular backups (cron job)
0 2 * * * gcloud firestore export gs://your-bucket/backup-$(date +\%Y\%m\%d)
```

**Backend Backup:**
- Backup `.env` file securely
- Backup service account JSON
- Document all configuration

### Step 9.4: Update Process

**Backend Updates:**
```bash
# SSH into server
ssh user@your-server

# Navigate to project
cd mission-exploit-ctf/backend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Restart with PM2
pm2 restart mission-exploit-backend
```

**Frontend Updates:**
- Push to GitHub
- Vercel/Netlify will auto-deploy
- Or manually trigger deployment

---

## 10. Troubleshooting

### Common Issues

#### Backend Not Starting

**Problem:** Backend crashes on startup

**Solutions:**
1. Check environment variables: `cat backend/.env`
2. Check logs: `pm2 logs mission-exploit-backend`
3. Verify Firebase credentials
4. Check port availability: `netstat -tulpn | grep 5002`

#### Frontend Can't Connect to Backend

**Problem:** CORS errors or connection refused

**Solutions:**
1. Verify `VITE_BACKEND_URL` in frontend `.env`
2. Check backend `FRONTEND_URL` matches frontend domain
3. Verify backend is running: `curl https://api.your-domain.com/health`
4. Check CORS configuration in backend

#### Firebase Authentication Fails

**Problem:** Users can't login

**Solutions:**
1. Verify Firebase config in frontend `.env`
2. Check Firebase Console → Authentication → Sign-in methods
3. Verify Email/Password provider is enabled
4. Check browser console for errors

#### Firestore Permission Denied

**Problem:** "Missing or insufficient permissions"

**Solutions:**
1. Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Check user authentication status
3. Verify user role in Firestore `users` collection
4. Check security rules syntax

#### Missing Indexes Error

**Problem:** "The query requires an index"

**Solutions:**
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Click the link in error message to create index
3. Wait for index to build (check Firebase Console)

### Getting Help

1. Check logs:
   - Backend: `pm2 logs`
   - Frontend: Browser console
   - Firebase: Firebase Console → Logs

2. Verify configuration:
   - Environment variables
   - Firebase config
   - Network connectivity

3. Check documentation:
   - `README.md`
   - `PRODUCTION_READINESS_REPORT.md`
   - Firebase documentation

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Firebase project created
- [ ] Firebase services enabled (Auth, Firestore)
- [ ] Service account JSON downloaded
- [ ] Environment variables prepared
- [ ] Flag hashes generated
- [ ] Strong admin secret generated

### Backend Deployment
- [ ] Server/VPS provisioned
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] `.env` file configured
- [ ] Backend started (PM2/Docker)
- [ ] Nginx configured (if applicable)
- [ ] SSL certificate installed
- [ ] Health check endpoint working

### Frontend Deployment
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Deployed to hosting platform
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Firebase Configuration
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] All indexes enabled

### Testing
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Admin portal accessible
- [ ] Participant flow works
- [ ] Leaderboard updates
- [ ] Real-time features work

### Post-Deployment
- [ ] Monitoring setup
- [ ] Backup strategy configured
- [ ] Documentation updated
- [ ] Team notified

---

## 🎉 Success!

Your Mission Exploit platform should now be live and ready for your CTF event!

**Important URLs:**
- Frontend: `https://your-domain.com`
- Backend API: `https://api.your-domain.com`
- Firebase Console: `https://console.firebase.google.com/project/your-project`

**Next Steps:**
1. Create admin user account
2. Configure event settings
3. Create teams and groups
4. Add levels and flags
5. Test complete flow
6. Launch event!

---

## 📞 Support

If you encounter issues during deployment:
1. Check the troubleshooting section
2. Review logs (backend and browser console)
3. Verify all environment variables
4. Check Firebase Console for errors
5. Review this guide step-by-step

**Good luck with your CTF event! 🚀**

