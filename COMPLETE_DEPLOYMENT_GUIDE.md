# 🚀 Complete Deployment Guide - Mission Exploit 2.0

## Most Efficient Deployment Method

**Recommended: Docker Compose (One Command)**

```bash
npm run deploy
```

This single command deploys everything automatically.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Files Setup

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit backend/.env with your production values
```

**Frontend:**
```bash
cp .env.example .env.production
# Edit .env.production with your production values
```

### 2. Firebase Setup

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if needed)
firebase deploy --only firestore:indexes
```

### 3. Required Environment Variables

**`backend/.env`:**
```env
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=your-service-account@csbc-eva.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_SECRET_KEY=your-64-character-secret-key
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://192.168.1.5:3000
```

**`.env.production`:**
```env
VITE_FIREBASE_API_KEY=AIzaSyDm7vULkM6EYsIG89EsKHVEoyXHUp_B-YU
VITE_FIREBASE_AUTH_DOMAIN=csbc-eva.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=csbc-eva
VITE_FIREBASE_STORAGE_BUCKET=csbc-eva.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1069699084490
VITE_FIREBASE_APP_ID=1:1069699084490:web:efb662bedd55081b79c433
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🐳 Method 1: Docker Compose (Recommended - Most Efficient)

### Quick Deploy

```bash
# One command deployment
npm run deploy
```

### Manual Steps

```bash
# 1. Build Docker images
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### What Gets Deployed

- ✅ **Frontend** (Nginx) - Port 80
- ✅ **Backend** (Node.js) - Port 5000
- ✅ **Health Checks** - Automatic monitoring
- ✅ **Auto-restart** - Services restart on failure

---

## ☁️ Method 2: Cloud Platform Deployment

### Option A: Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Backend (Railway):**
1. Connect GitHub repo
2. Set environment variables
3. Auto-deploys on push

### Option B: DigitalOcean App Platform

1. Create App Platform app
2. Connect GitHub repo
3. Configure:
   - Frontend: Build command `npm run build`
   - Backend: Start command `npm start`
4. Set environment variables
5. Deploy

### Option C: AWS (EC2 + S3)

**Frontend (S3 + CloudFront):**
```bash
# Build
npm run build:prod

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Configure CloudFront for CDN
```

**Backend (EC2):**
```bash
# SSH into EC2
ssh -i key.pem ubuntu@your-ec2-ip

# Clone repo
git clone your-repo

# Install dependencies
cd backend && npm install

# Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name ctf-backend
pm2 save
pm2 startup
```

---

## 🔧 Method 3: Manual Deployment (Traditional)

### Frontend

```bash
# 1. Build production bundle
npm run build:prod

# 2. Serve with Nginx
# Copy dist/ to /var/www/html
sudo cp -r dist/* /var/www/html/

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/ctf-platform
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Backend

```bash
# 1. Install dependencies
cd backend
npm install --production

# 2. Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name ctf-backend
pm2 save
pm2 startup
```

---

## 📦 Deployment Steps Summary

### Step 1: Prepare Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with production values

# Frontend
cp .env.example .env.production
# Edit .env.production with production values
```

### Step 2: Deploy Firebase

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes (if needed)
firebase deploy --only firestore:indexes
```

### Step 3: Deploy Application

**Docker (Recommended):**
```bash
npm run deploy
```

**Or Manual:**
```bash
# Frontend
npm run build:prod
# Deploy dist/ to web server

# Backend
cd backend
npm install --production
pm2 start src/server.js
```

### Step 4: Verify

```bash
# Check frontend
curl http://localhost/health

# Check backend
curl http://localhost:5000/health

# Check services
docker-compose ps  # If using Docker
```

---

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl http://your-domain.com/health

# Backend
curl http://your-backend-url:5000/health
```

### 2. Test Features

- [ ] Login/Signup works
- [ ] Admin portal accessible
- [ ] Captain portal accessible
- [ ] Participant portal accessible
- [ ] Team creation works
- [ ] Flag submission works
- [ ] Leaderboard updates

### 3. Check Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs ctf-backend

# Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Linux/Mac

# Kill process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # Linux/Mac
```

### Docker Issues

```bash
# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Environment Variables Not Loading

```bash
# Check .env files exist
ls backend/.env
ls .env.production

# Verify values
cat backend/.env | grep FIREBASE_PROJECT_ID
```

### Firebase Connection Issues

```bash
# Verify Firebase credentials
cd backend
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID)"
```

---

## 📊 Production Optimizations

### Frontend

- ✅ Code splitting enabled
- ✅ Tree shaking enabled
- ✅ Minification enabled
- ✅ Gzip compression (Nginx)
- ✅ Browser caching configured

### Backend

- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Security headers (Helmet)
- ✅ Request logging (Morgan)
- ✅ Error handling

---

## 🔐 Security Checklist

- [ ] Environment variables set correctly
- [ ] Firebase security rules deployed
- [ ] HTTPS enabled (production)
- [ ] CORS origins configured
- [ ] Rate limiting active
- [ ] Admin secret key secure
- [ ] Firebase service account secure

---

## 📈 Monitoring

### Health Endpoints

- Frontend: `http://your-domain/health`
- Backend: `http://your-backend:5000/health`

### Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs

# Nginx
sudo tail -f /var/log/nginx/access.log
```

---

## 🚀 Quick Start Commands

```bash
# Full deployment (Docker)
npm run deploy

# Build only
npm run build:prod
cd backend && npm install --production

# Start services (Docker)
docker-compose up -d

# Stop services (Docker)
docker-compose down

# View logs
docker-compose logs -f

# Health check
npm run health-check
```

---

## 📝 Deployment Checklist

- [ ] Environment files configured
- [ ] Firebase rules deployed
- [ ] Firebase indexes deployed (if needed)
- [ ] Frontend built successfully
- [ ] Backend dependencies installed
- [ ] Services running
- [ ] Health checks passing
- [ ] Features tested
- [ ] Logs monitored

---

## 🎉 You're Ready!

Your platform is now deployed and ready for your CTF competition!

**Access Points:**
- Frontend: `http://your-domain.com`
- Backend API: `http://your-backend:5000`
- Admin Portal: `http://your-domain.com/admin/dashboard`

---

**Need Help?** Check:
- `DEPLOYMENT_GUIDE.md` - Detailed guide
- `PRODUCTION_READY.md` - Production checklist
- `backend/DEPLOYMENT.md` - Backend-specific guide

