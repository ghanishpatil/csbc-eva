# Backend Setup Guide - Mission Exploit 2.0

Complete setup instructions for the secure backend.

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase project created (csbc-eva)
- Access to Firebase Console

## 🔧 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/csbc-eva/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Click **"Generate key"** - a JSON file will download
4. Save it securely (DON'T commit to Git!)

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=development

# Firebase (from the downloaded JSON)
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@csbc-eva.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Frontend
FRONTEND_URL=http://localhost:3000

# Admin Security
ADMIN_SECRET_KEY=change_this_to_a_secure_random_string_min_32_chars
```

**How to extract from service account JSON:**
```json
{
  "project_id": "csbc-eva",           // → FIREBASE_PROJECT_ID
  "client_email": "...",               // → FIREBASE_CLIENT_EMAIL
  "private_key": "-----BEGIN..."       // → FIREBASE_PRIVATE_KEY
}
```

### Step 4: Generate Flag Hashes

```bash
node scripts/generate-flag-hashes.js
```

This will output hashes like:
```env
LEVEL_1_FLAG_HASH=a1b2c3d4...
LEVEL_2_FLAG_HASH=e5f6g7h8...
```

**Copy these to your `.env` file!**

### Step 5: Generate Strong Admin Key

```bash
# Generate a random 32-character key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to `.env` as `ADMIN_SECRET_KEY`

### Step 6: Start the Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
🚀 MISSION EXPLOIT 2.0 - SECURE BACKEND
📡 Server running on port 5000
✅ Server is ready to accept requests
```

### Step 7: Test the Backend

#### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "status": "OK",
  "service": "Mission Exploit 2.0 Backend"
}
```

#### Test Flag Submission (with wrong flag)
```bash
curl -X POST http://localhost:5000/api/submit-flag \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "test",
    "levelId": "level_1",
    "flag": "ME2{wrong_flag}",
    "timeTaken": 30,
    "captainId": "test"
  }'
```

Expected: `"status": "incorrect"`

## 🔐 Security Checklist

- [ ] Firebase service account configured
- [ ] All flag hashes generated and added to .env
- [ ] Strong admin secret key set
- [ ] .env file NOT committed to Git (.gitignore configured)
- [ ] CORS configured for your frontend URL
- [ ] Rate limiting enabled
- [ ] Input validation working

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
```

### Security Hardening
1. Use HTTPS only
2. Set secure admin key (64+ chars)
3. Configure firewall rules
4. Enable logging/monitoring
5. Set up backup strategy

### Deployment Commands

**Heroku:**
```bash
heroku create mission-exploit-backend
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=csbc-eva
# ... set all env vars
git push heroku main
```

**DigitalOcean:**
```bash
doctl apps create --spec app.yaml
```

**Docker:**
```bash
docker build -t mission-exploit-backend .
docker run -p 5000:5000 --env-file .env mission-exploit-backend
```

## 🐛 Troubleshooting

### Firebase Connection Error
```
Error: Failed to initialize Firebase Admin SDK
```

**Solution:**
- Check FIREBASE_PRIVATE_KEY has proper newlines (`\n`)
- Verify project ID is correct
- Ensure service account has permissions

### Rate Limit Issues
```
Too many flag submission attempts
```

**Solution:**
- This is normal security behavior
- Wait 1 minute and try again
- Adjust `RATE_LIMIT_MAX_REQUESTS` in .env (for testing only)

### CORS Error
```
Access-Control-Allow-Origin error
```

**Solution:**
- Set `FRONTEND_URL` in .env to match your frontend URL exactly
- Restart the server after changing .env

## 📝 Creating Your Own Flags

### Flag Format
```
ME2{your_flag_content_here}
```

### Good Flag Examples
- `ME2{sql_1nj3ct10n_m4st3r}`
- `ME2{xss_<script>alert(1)</script>}`
- `ME2{b0f_expl01t_succ3ss}`
- `ME2{r3v3rs3_3ng1n33r1ng_pr0}`

### Bad Flag Examples
- `flag123` (no format)
- `ME2{}` (empty)
- `password` (not a flag)

### After Creating Flags
1. Generate hashes using `scripts/generate-flag-hashes.js`
2. Add to `.env`
3. Restart server
4. Test with correct and incorrect flags

## ✅ Verification Steps

1. **Server starts without errors**
2. **Health endpoint responds**
3. **Flag submission works (returns correct/incorrect)**
4. **Admin endpoints require authentication**
5. **Rate limiting blocks excessive requests**
6. **Scores update in Firestore after correct flag**

---

**Your secure backend is now ready!** 🎉

