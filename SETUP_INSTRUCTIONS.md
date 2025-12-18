# 🚀 Your Mission Exploit 2.0 Setup Instructions

Your Firebase project **csbc-eva** is now configured! Follow these steps to get started.

## ✅ What's Already Done

- ✅ Firebase configuration added to `.env`
- ✅ Project ID set to `csbc-eva`
- ✅ All code and components generated
- ✅ Documentation ready

## 📋 Next Steps (5 minutes)

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### Step 2: Firebase CLI Setup

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# The project is already configured to use csbc-eva
```

### Step 3: Enable Firebase Services

Go to [Firebase Console](https://console.firebase.google.com/project/csbc-eva) and enable:

1. **Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click Save

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your region
   - Click "Enable"

3. **Cloud Functions** (Requires Blaze Plan)
   - Go to Functions
   - Upgrade to Blaze plan (pay-as-you-go)
   - Free tier: 2M invocations/month (more than enough)

### Step 4: Deploy Firestore Rules & Indexes

```bash
# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 5: Deploy Cloud Functions

```bash
# Build and deploy functions
firebase deploy --only functions
```

This will deploy 4 functions:
- `calculateScore` - Auto-calculate scores on submission
- `processHintUsage` - Handle hint penalties  
- `initializeEvent` - Initialize event configuration
- `resetCompetition` - Reset competition data

### Step 6: Start Development Server

```bash
# Start the frontend
npm run dev
```

Your app will be available at: **http://localhost:3000**

## 🎯 First Time Setup

### 1. Create Admin Account

1. Open http://localhost:3000/login
2. Click "Sign Up"
3. Fill in:
   - **Display Name**: Your Name
   - **Email**: admin@csbc.com (or your email)
   - **Password**: (create a strong password)
   - **Role**: **Administrator**
4. Click "Sign Up"

### 2. Generate Teams & Groups

1. Go to **Admin Dashboard**
2. In "Team Management":
   - Enter **Number of Teams**: 10
   - Enter **Number of Groups**: 2
   - Click **Generate**

You'll get:
- 10 teams (Team 1 through Team 10)
- 2 groups (Group A and Group B)
- Teams automatically distributed

### 3. Create Levels

1. Scroll to "Level Management"
2. Click **Add Level**
3. Create your first level:
   - **Title**: "Web Security Challenge"
   - **Description**: "Find the vulnerability in the web application"
   - **Base Points**: 500
   - **Difficulty**: Medium
   - **Hint Type**: Points-Based
   - **Hints Available**: 3
   - **Point Deduction per Hint**: 50
4. Click **Create**

### 4. Create Captain Accounts

Ask team captains to:
1. Go to http://localhost:3000/login
2. Sign up with role: **Team Captain**
3. You'll assign them to teams

### 5. Assign Captains to Teams

**Method 1: Via Firestore Console**
1. Go to [Firestore Console](https://console.firebase.google.com/project/csbc-eva/firestore)
2. Open `teams` collection
3. Click on a team document
4. Edit field `captainId` → Add the captain's user ID
5. Go to `users` collection
6. Find the captain's user document
7. Add field `teamId` → Add the team ID
8. Save

**Method 2: Via Express API** (if using optional server)
```bash
cd server
npm install
npm run dev

# Then use the API endpoint
POST /api/admin/assign-captain
{
  "teamId": "team_id_here",
  "userId": "captain_user_id_here"
}
```

## 🎮 You're Ready!

Captains can now:
- ✅ View levels
- ✅ Request hints
- ✅ Submit completions
- ✅ Track team progress

Everyone can:
- ✅ View live leaderboard
- ✅ Monitor competition

## 🔥 Quick Commands Reference

```bash
# Development
npm run dev                          # Start frontend
npm run build                        # Build for production

# Firebase
firebase deploy --only hosting       # Deploy frontend
firebase deploy --only functions     # Deploy functions
firebase functions:log               # View function logs

# Server (Optional)
cd server && npm run dev            # Start Express server
```

## 📱 Access URLs

- **Local Development**: http://localhost:3000
- **Firebase Hosting**: https://csbc-eva.web.app (after deploying)
- **Firebase Console**: https://console.firebase.google.com/project/csbc-eva

## 🔒 Important Security Notes

1. **Never commit `.env` to Git** (already in .gitignore)
2. **Use strong passwords** for admin accounts
3. **Firestore rules are deployed** - only authorized users can write
4. **API keys in .env are safe** - they're meant for frontend use
5. **Admin functions require authentication**

## 🐛 Troubleshooting

### Issue: "Permission denied" error
**Solution**: Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### Issue: Functions not deploying
**Solution**: 
1. Check that you're on Blaze plan
2. Verify Node.js version 18+
```bash
node --version  # Should be 18+
```

### Issue: App not connecting to Firebase
**Solution**: 
1. Check `.env` file exists in root
2. Restart dev server
```bash
npm run dev
```

### Issue: "Cannot find module" errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 Project Structure

```
F:\csbceva\
├── src/                    # Frontend React app
├── functions/              # Firebase Cloud Functions
├── server/                 # Optional Express backend
├── .env                    # Firebase config (configured!)
├── .firebaserc             # Firebase project (csbc-eva)
├── firebase.json           # Firebase configuration
└── Documentation files     # README, SETUP, etc.
```

## 🎯 Sample Competition Flow

1. **Admin**: Generate 10 teams, 2 groups
2. **Admin**: Create 5 levels (easy to hard)
3. **Captains**: Sign up and get assigned to teams
4. **Competition Starts**: Captains complete levels
5. **Real-time**: Leaderboard updates automatically
6. **End**: Admin can view all statistics

## 💡 Tips

- Test with 2-3 teams first before full competition
- Create levels with increasing difficulty
- Use points-based hints for scoring competitions
- Use time-based hints for speed challenges
- Monitor Firebase Console for errors
- Check function logs if scoring seems wrong

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. See `QUICKSTART.md` for quick reference
3. Review `ARCHITECTURE.md` for system design
4. Check Firebase Console logs
5. Open an issue on GitHub

---

## ✨ You're All Set!

Your Mission Exploit 2.0 platform is configured and ready to deploy!

**Project**: csbc-eva  
**Status**: ✅ Configured  
**Next Step**: Run `npm install` and start developing!

Good luck with your CTF competition! 🏆

