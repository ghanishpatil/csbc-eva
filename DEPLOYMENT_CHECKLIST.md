# 🚀 Quick Deployment Checklist

Use this checklist during deployment to ensure nothing is missed.

## Pre-Deployment

- [ ] **Firebase Setup**
  - [ ] Firebase project created
  - [ ] Authentication enabled (Email/Password)
  - [ ] Firestore database created
  - [ ] Service account JSON downloaded
  - [ ] Firebase config values copied

- [ ] **Environment Variables**
  - [ ] Frontend `.env.production` prepared
  - [ ] Backend `.env` prepared
  - [ ] All Firebase config values added
  - [ ] Backend URL configured
  - [ ] Strong admin secret generated

- [ ] **Security**
  - [ ] Flag hashes generated
  - [ ] Admin secret key generated (32+ chars)
  - [ ] Service account JSON secured
  - [ ] `.env` files added to `.gitignore`

## Backend Deployment

- [ ] **Server Setup**
  - [ ] Server/VPS provisioned
  - [ ] Node.js 18+ installed
  - [ ] Git repository cloned
  - [ ] Dependencies installed (`npm install --production`)

- [ ] **Configuration**
  - [ ] `.env` file created with all variables
  - [ ] Firebase service account configured
  - [ ] Port configured (default: 5002)
  - [ ] CORS configured (frontend URL)

- [ ] **Deployment**
  - [ ] Backend started (PM2/Docker/Platform)
  - [ ] Health check passes (`/health` endpoint)
  - [ ] Nginx reverse proxy configured (if applicable)
  - [ ] SSL certificate installed
  - [ ] Backend accessible via HTTPS

## Frontend Deployment

- [ ] **Build**
  - [ ] Dependencies installed (`npm install`)
  - [ ] Build successful (`npm run build`)
  - [ ] No build errors or warnings

- [ ] **Configuration**
  - [ ] Environment variables set in hosting platform
  - [ ] Firebase config values added
  - [ ] Backend URL configured (`VITE_BACKEND_URL`)

- [ ] **Deployment**
  - [ ] Deployed to hosting platform (Vercel/Netlify/etc.)
  - [ ] Custom domain configured (if applicable)
  - [ ] SSL certificate active
  - [ ] Frontend accessible via HTTPS

## Firebase Configuration

- [ ] **Firestore**
  - [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
  - [ ] Indexes deployed (`firebase deploy --only firestore:indexes`)
  - [ ] All indexes enabled (check Firebase Console)

- [ ] **Authentication**
  - [ ] Email/Password provider enabled
  - [ ] Test user can sign up/login

## Testing

- [ ] **Backend**
  - [ ] Health endpoint responds: `GET /health`
  - [ ] API endpoints accessible
  - [ ] CORS configured correctly
  - [ ] Rate limiting works

- [ ] **Frontend**
  - [ ] Landing page loads
  - [ ] Login page accessible
  - [ ] No console errors
  - [ ] API calls succeed (check Network tab)

- [ ] **Authentication**
  - [ ] User can sign up
  - [ ] User can login
  - [ ] Role-based redirect works
  - [ ] Protected routes work

- [ ] **Admin Portal**
  - [ ] Admin can login
  - [ ] Can create teams
  - [ ] Can create levels
  - [ ] Can manage groups
  - [ ] Event control works

- [ ] **Participant Flow**
  - [ ] Participant can sign up/login
  - [ ] Can join/create team
  - [ ] Can check in with QR code
  - [ ] Can view active mission
  - [ ] Can submit flags
  - [ ] Leaderboard updates in real-time

## Post-Deployment

- [ ] **Monitoring**
  - [ ] Backend logs accessible
  - [ ] Uptime monitoring configured
  - [ ] Error tracking setup (optional)

- [ ] **Backup**
  - [ ] Firestore backup strategy configured
  - [ ] Environment variables backed up
  - [ ] Service account JSON backed up securely

- [ ] **Documentation**
  - [ ] Deployment URLs documented
  - [ ] Admin credentials secured
  - [ ] Team notified of deployment

## Quick Commands Reference

```bash
# Backend Health Check
curl https://api.your-domain.com/health

# PM2 Commands
pm2 start src/server.js --name mission-exploit-backend
pm2 logs mission-exploit-backend
pm2 restart mission-exploit-backend
pm2 monit

# Firebase Deployment
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Frontend Build
npm run build
npm run preview  # Test build locally
```

## Critical URLs

- **Frontend:** `https://your-domain.com`
- **Backend API:** `https://api.your-domain.com`
- **Firebase Console:** `https://console.firebase.google.com/project/your-project`
- **Health Check:** `https://api.your-domain.com/health`

## Emergency Contacts

- **Backend Issues:** Check PM2 logs
- **Frontend Issues:** Check hosting platform logs
- **Firebase Issues:** Check Firebase Console → Logs

---

**✅ All checked? Your platform is ready for production!**

