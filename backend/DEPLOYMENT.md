# Deployment Guide - Mission Exploit 2.0 Backend

Complete guide for deploying the secure backend to production.

## 🚀 Deployment Options

### Option 1: Heroku (Recommended for Quick Start)

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Steps

```bash
# 1. Login to Heroku
heroku login

# 2. Create new app
heroku create mission-exploit-backend

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set FIREBASE_PROJECT_ID=csbc-eva
heroku config:set FIREBASE_CLIENT_EMAIL="your-service-account@csbc-eva.iam.gserviceaccount.com"
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
heroku config:set ADMIN_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set all flag hashes
heroku config:set LEVEL_1_FLAG_HASH=your_hash_here
heroku config:set LEVEL_2_FLAG_HASH=your_hash_here
# ... repeat for all levels

# 4. Create Procfile
echo "web: node src/server.js" > Procfile

# 5. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 6. Open app
heroku open
```

**Your API will be available at:** `https://mission-exploit-backend.herokuapp.com`

---

### Option 2: DigitalOcean App Platform

#### Prerequisites
- DigitalOcean account
- GitHub repository

#### Steps

1. **Connect Repository**
   - Go to DigitalOcean Dashboard
   - Apps → Create App
   - Connect your GitHub repo

2. **Configure Build**
   ```yaml
   # app.yaml
   name: mission-exploit-backend
   services:
     - name: api
       github:
         repo: your-username/mission-exploit-backend
         branch: main
       build_command: npm install
       run_command: npm start
       environment_slug: node-js
       instance_size_slug: basic-xxs
       instance_count: 1
       envs:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: "8080"
         - key: FIREBASE_PROJECT_ID
           value: csbc-eva
           type: SECRET
         - key: ADMIN_SECRET_KEY
           type: SECRET
   ```

3. **Set Environment Variables** in App Platform settings

4. **Deploy** - App Platform auto-deploys on push

---

### Option 3: Docker + Any Platform

#### Dockerfile (already created)

```bash
# Build image
docker build -t mission-exploit-backend .

# Run locally
docker run -p 5000:5000 --env-file .env mission-exploit-backend

# Test
curl http://localhost:5000/health
```

#### Deploy to Docker Hub

```bash
# Tag image
docker tag mission-exploit-backend your-username/mission-exploit-backend:latest

# Push to Docker Hub
docker push your-username/mission-exploit-backend:latest
```

#### Deploy to DigitalOcean Droplet

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Pull and run
docker pull your-username/mission-exploit-backend:latest
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e FIREBASE_PROJECT_ID=csbc-eva \
  -e FIREBASE_CLIENT_EMAIL="..." \
  -e FIREBASE_PRIVATE_KEY="..." \
  -e FRONTEND_URL="https://your-domain.com" \
  -e ADMIN_SECRET_KEY="..." \
  --name ctf-backend \
  --restart unless-stopped \
  your-username/mission-exploit-backend:latest
```

---

### Option 4: AWS Elastic Beanstalk

#### Prerequisites
- AWS account
- EB CLI installed

#### Steps

```bash
# 1. Initialize EB
eb init -p node.js mission-exploit-backend

# 2. Create environment
eb create production

# 3. Set environment variables
eb setenv NODE_ENV=production \
  FIREBASE_PROJECT_ID=csbc-eva \
  FIREBASE_CLIENT_EMAIL="..." \
  FRONTEND_URL="https://your-domain.com" \
  ADMIN_SECRET_KEY="..."

# 4. Deploy
eb deploy

# 5. Open
eb open
```

---

### Option 5: Google Cloud Run

#### Prerequisites
- Google Cloud account
- gcloud CLI installed

#### Steps

```bash
# 1. Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/csbc-eva/mission-exploit-backend

# 2. Deploy to Cloud Run
gcloud run deploy mission-exploit-backend \
  --image gcr.io/csbc-eva/mission-exploit-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=csbc-eva \
  --set-secrets FIREBASE_PRIVATE_KEY=firebase-key:latest,ADMIN_SECRET_KEY=admin-key:latest

# 3. Get URL
gcloud run services describe mission-exploit-backend --region us-central1
```

---

## 🔐 Production Security Checklist

### Before Deployment

- [ ] Change all default flags
- [ ] Generate new strong admin key (64+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Verify all flag hashes are set
- [ ] Review Firebase security rules
- [ ] Test locally with production config
- [ ] Remove any debug/console logs (optional)

### After Deployment

- [ ] Test health endpoint
- [ ] Test flag submission
- [ ] Test admin endpoints
- [ ] Verify CORS works with frontend
- [ ] Check logs for errors
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy
- [ ] Document API endpoint URL

---

## 🌐 Domain & SSL Configuration

### Add Custom Domain (Heroku)

```bash
heroku domains:add api.yourdomain.com
```

Then add DNS record:
```
CNAME api.yourdomain.com → your-app.herokuapp.com
```

### SSL/HTTPS

Most platforms provide automatic SSL:
- **Heroku:** Automatic SSL for all apps
- **DigitalOcean:** Free SSL with Let's Encrypt
- **AWS EB:** Use ACM (AWS Certificate Manager)
- **Google Cloud Run:** Automatic HTTPS

---

## 📊 Monitoring & Logging

### Heroku Logging

```bash
# View logs
heroku logs --tail

# Search logs
heroku logs --tail | grep "FlagController"
```

### Set Up Alerts

```bash
# Heroku
heroku plugins:install heroku-papertrail
heroku addons:create papertrail

# DigitalOcean
# Use built-in monitoring dashboard

# AWS
# Use CloudWatch
```

### Key Metrics to Monitor

- Request rate
- Error rate
- Response time
- Memory usage
- CPU usage
- Failed authentication attempts

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "mission-exploit-backend"
          heroku_email: "your-email@example.com"
```

---

## 🐛 Troubleshooting Production Issues

### Server won't start

```bash
# Check logs
heroku logs --tail

# Common issues:
# - Missing environment variables
# - Firebase credentials incorrect
# - Port binding (use process.env.PORT)
```

### CORS errors in production

```env
# Ensure FRONTEND_URL matches exactly (no trailing slash)
FRONTEND_URL=https://yourdomain.com
```

### Firebase connection fails

```bash
# Verify credentials
heroku config:get FIREBASE_PROJECT_ID
heroku config:get FIREBASE_CLIENT_EMAIL

# Check private key has proper newlines
# Should have \n characters, not actual newlines
```

### Rate limiting too strict

```env
# Increase temporarily (not recommended long-term)
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

---

## 📈 Scaling

### Horizontal Scaling (Heroku)

```bash
# Scale to 2 dynos
heroku ps:scale web=2

# Auto-scaling
heroku autoscale:enable web --min 1 --max 5
```

### Vertical Scaling

```bash
# Upgrade dyno type
heroku ps:type performance-m
```

### Load Balancing

- Heroku: Automatic
- DigitalOcean: Use Load Balancer product
- AWS: Use Application Load Balancer
- Google Cloud: Built into Cloud Run

---

## 💾 Backup Strategy

### Firebase Backup

```bash
# Export Firestore data
gcloud firestore export gs://csbc-eva-backups/$(date +%Y%m%d)

# Schedule automatic backups
# Use Cloud Scheduler + Cloud Functions
```

### Environment Variables Backup

```bash
# Export all config
heroku config --json > config-backup.json

# Store securely (NOT in Git!)
```

---

## 🚦 Health Checks

### Configure Health Endpoints

Most platforms need a health check:

```
Endpoint: /health
Expected: 200 status code
Interval: 30 seconds
Timeout: 5 seconds
```

### Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake
- New Relic

---

## ✅ Post-Deployment Verification

```bash
# Replace with your deployed URL
export API_URL=https://your-api-domain.com

# Test health
curl $API_URL/health

# Test flag submission (should work)
curl -X POST $API_URL/api/submit-flag \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "test",
    "levelId": "level_1",
    "flag": "ME2{test}",
    "timeTaken": 30,
    "captainId": "test"
  }'

# Test admin (with your key)
curl $API_URL/api/admin/stats \
  -H "X-Admin-Key: your_production_key"
```

---

**Your backend is now live and secure!** 🎉🛡️

