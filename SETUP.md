# Mission Exploit 2.0 - Setup Guide

Complete step-by-step setup guide for Mission Exploit 2.0 CTF Platform.

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Firebase account created
- [ ] Code editor (VS Code recommended)

## 🔥 Firebase Setup (Detailed)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `mission-exploit-ctf`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable **Email/Password**
5. Click "Save"

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode**
4. Choose location (closest to your users)
5. Click "Enable"

### Step 4: Enable Cloud Functions

1. Upgrade to **Blaze Plan** (pay-as-you-go)
   - Free tier: 2M invocations/month
   - No charge for typical CTF usage
2. Go to **Functions** section
3. Click "Get started"

### Step 5: Get Configuration

1. Click ⚙️ (Settings) → Project Settings
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Register app name: `mission-exploit-web`
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mission-exploit-ctf.firebaseapp.com",
  projectId: "mission-exploit-ctf",
  storageBucket: "mission-exploit-ctf.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 💻 Local Development Setup

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd mission-exploit-ctf

# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..

# Optional: Install Express server dependencies
cd server
npm install
cd ..
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 3: Firebase CLI Setup

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting

# Choose "Use an existing project"
# Select your project

# Firestore rules: firestore.rules
# Firestore indexes: firestore.indexes.json
# Functions language: TypeScript
# Functions directory: functions
# Install dependencies: Yes
# Hosting directory: dist
```

### Step 4: Deploy Firestore Configuration

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 5: Deploy Cloud Functions

```bash
# Build and deploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Step 6: Run Development Server

```bash
# Start frontend development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 👤 Create First Admin User

### Method 1: Through UI

1. Open `http://localhost:3000/login`
2. Click "Sign Up"
3. Fill in details:
   - Display Name: `Admin`
   - Email: `admin@example.com`
   - Password: `your-password`
   - Role: **Administrator**
4. Click "Sign Up"

### Method 2: Through Firebase Console

1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password
4. Go to Firestore Database
5. Find the `users` collection
6. Find the user document (by email)
7. Edit the document
8. Set `role` field to `"admin"`
9. Save

## 🎯 Initial Configuration

### 1. Create Teams and Groups

As admin:
1. Log in to the platform
2. Go to **Admin Dashboard**
3. In "Team Management":
   - Enter **Number of Teams**: 10
   - Enter **Number of Groups**: 2
   - Click **Generate**

This will create:
- 10 teams (Team 1, Team 2, ...)
- 2 groups (Group A, Group B)
- Teams distributed evenly

### 2. Create Levels

1. Go to **Admin Dashboard**
2. Scroll to "Level Management"
3. Click **Add Level**
4. Fill in level details:
   - **Title**: "SQL Injection Basics"
   - **Description**: "Find the vulnerability in the login form"
   - **Base Points**: 500
   - **Difficulty**: Medium
   - **Hint Type**: Points-Based
   - **Hints Available**: 3
   - **Point Deduction per Hint**: 50
5. Click **Create**

Repeat for multiple levels with increasing difficulty.

### 3. Assign Team Captains

Create captain accounts:
1. Ask users to sign up with role: **Team Captain**
2. As admin, note their user IDs from Firestore
3. Use the Express API or update Firestore directly:

**Using Firestore Console:**
1. Go to `teams` collection
2. Select a team
3. Edit `captainId` field
4. Paste the user ID
5. Go to `users` collection
6. Edit the user document
7. Add `teamId` field with team ID
8. Save

## 🧪 Testing the Platform

### Test Flow

1. **Admin Actions**
   - Create 3 teams
   - Create 3 levels
   - Monitor dashboard

2. **Captain Actions**
   - Sign up as captain
   - Get assigned to a team (by admin)
   - View levels
   - Request a hint
   - Submit level completion

3. **Leaderboard**
   - View real-time updates
   - Check rankings
   - Verify scores

### Sample Test Data

```javascript
// Level 1: Easy
{
  title: "Hash Cracker",
  basePoints: 300,
  difficulty: "easy",
  hintType: "points",
  pointDeduction: 30
}

// Level 2: Medium
{
  title: "SQL Injection",
  basePoints: 500,
  difficulty: "medium",
  hintType: "points",
  pointDeduction: 50
}

// Level 3: Hard
{
  title: "Binary Exploitation",
  basePoints: 800,
  difficulty: "hard",
  hintType: "time",
  timePenalty: 10
}
```

## 🚀 Production Deployment

### Build Frontend

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Deploy Functions

```bash
firebase deploy --only functions
```

### Configure Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Add domain records to your DNS provider
5. Wait for SSL certificate provisioning

## 🔐 Security Checklist

- [ ] Firestore rules deployed
- [ ] Strong admin password set
- [ ] Environment variables configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Firebase Auth enabled
- [ ] HTTPS enforced (production)

## 📊 Monitoring

### Firebase Console

- **Authentication**: Monitor user signups
- **Firestore**: Check database usage
- **Functions**: View function logs and metrics
- **Hosting**: Check deployment status

### Function Logs

```bash
# View real-time logs
firebase functions:log

# Filter by function
firebase functions:log --only calculateScore
```

## 🆘 Common Issues

### Issue: "Permission denied" on Firestore

**Solution:**
```bash
firebase deploy --only firestore:rules
```

### Issue: Cloud Functions not deploying

**Solution:**
1. Check Node.js version (must be 18+)
2. Verify Blaze plan is active
3. Check functions/package.json configuration

### Issue: Environment variables not working

**Solution:**
1. Ensure `.env` file is in root directory
2. Restart dev server after changes
3. Check file is named exactly `.env`

### Issue: "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For additional help:
- Check GitHub Issues
- Review Firebase documentation
- Contact CSBC team

---

**Setup complete! 🎉 You're ready to run Mission Exploit 2.0**

