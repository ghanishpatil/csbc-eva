# 🚀 Quick Start - Mission Exploit 2.0 Backend

Get your secure backend running in **5 minutes**!

## ⚡ Express Setup (Copy & Paste)

### Step 1: Install Dependencies (30 seconds)

```bash
cd backend
npm install
```

### Step 2: Configure Environment (2 minutes)

```bash
cp .env.example .env
```

**Edit `.env`** with your Firebase credentials:

```env
PORT=5000
NODE_ENV=development

# Get these from Firebase Console
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@csbc-eva.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"

FRONTEND_URL=http://localhost:3000

# Generate random key (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Step 3: Generate Flag Hashes (1 minute)

```bash
node scripts/generate-flag-hashes.js
```

**Copy the output** and paste into your `.env` file:

```env
LEVEL_1_FLAG_HASH=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
LEVEL_2_FLAG_HASH=ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb
# ... more levels
```

### Step 4: Start Server (10 seconds)

```bash
npm run dev
```

You should see:

```
🚀 MISSION EXPLOIT 2.0 - SECURE BACKEND
📡 Server running on port 5000
✅ Server is ready to accept requests
```

### Step 5: Test It! (30 seconds)

**Test health endpoint:**
```bash
curl http://localhost:5000/health
```

**Test flag submission:**
```bash
curl -X POST http://localhost:5000/api/submit-flag \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "test_team",
    "levelId": "level_1",
    "flag": "ME2{welcome_to_mission_exploit}",
    "timeTaken": 30,
    "captainId": "test_captain"
  }'
```

---

## 🎯 That's it! Your backend is ready!

### What's Next?

1. **Update frontend** to use backend API
2. **Create actual flags** for your challenges
3. **Deploy to production** when ready

---

## 🔧 Common Commands

```bash
# Development (auto-reload)
npm run dev

# Production
npm start

# Generate flag hashes
node scripts/generate-flag-hashes.js

# Generate admin key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐛 Quick Troubleshooting

**Problem:** Firebase connection error
```
Solution: Check FIREBASE_PRIVATE_KEY has \n for newlines
```

**Problem:** CORS error
```
Solution: Set FRONTEND_URL=http://localhost:3000 in .env
```

**Problem:** Rate limit blocking you
```
Solution: Wait 1 minute or increase RATE_LIMIT_MAX_REQUESTS
```

---

## 📚 Full Documentation

- **Complete Setup:** See `SETUP.md`
- **API Reference:** See `API_DOCUMENTATION.md`
- **Security Guide:** See `SECURITY.md`
- **Main README:** See `README.md`

---

**Happy hacking! 🛡️**

