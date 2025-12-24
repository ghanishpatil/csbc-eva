# Mission Exploit 2.0 - Dynamic CTF Evaluation Platform

![Mission Exploit 2.0](https://img.shields.io/badge/Mission-Exploit%202.0-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.7-orange)

A fully dynamic, real-time, Jeopardy-style CTF (Capture The Flag) evaluation system built for CSBC Cybersecurity Club events. Features automated scoring, real-time leaderboards, hint systems, and comprehensive admin controls.

## 🌟 Features

### Core Functionality
- **Dynamic Team & Group Management** - Auto-generate teams and groups with configurable distribution
- **Real-Time Leaderboard** - Live updates using Firebase Firestore listeners
- **Customizable Levels** - Create levels with difficulty settings, points, and hint configurations
- **Dual Hint System** - Points-based or time-based hint penalties
- **Automated Scoring** - Cloud Functions handle all score calculations
- **Role-Based Access** - Admin, Captain, and Player roles with appropriate permissions
- **Beautiful UI** - Modern, responsive design with TailwindCSS

### Admin Features
- Create and manage teams in bulk
- Configure levels with custom points and penalties
- Monitor all submissions in real-time
- View comprehensive statistics
- Reset competition data
- Assign team captains

### Captain Features
- View and complete levels
- Request hints (with penalties)
- Submit level completion with time tracking
- View team statistics and progress
- Real-time score updates

### Player Features
- View leaderboard rankings
- Track team progress
- Monitor competition status

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Firebase SDK** - Authentication, Firestore, Functions
- **Lucide React** - Beautiful icon set
- **React Hot Toast** - Elegant notifications

### Backend
- **Firebase Cloud Functions** - Serverless backend logic
- **Firestore** - NoSQL real-time database
- **Firebase Auth** - User authentication
- **Express.js** (Optional) - REST API for admin operations

## 📁 Project Structure

```
mission-exploit-ctf/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── TeamManager.tsx
│   │   │   └── LevelManager.tsx
│   │   ├── captain/            # Captain-specific components
│   │   │   └── LevelCard.tsx
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   ├── Leaderboard.tsx     # Leaderboard component
│   │   └── ProtectedRoute.tsx  # Auth guard
│   ├── pages/                  # Page components
│   │   ├── admin/
│   │   │   └── Dashboard.tsx
│   │   ├── captain/
│   │   │   └── Levels.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   └── LeaderboardPage.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useFirestoreListener.ts
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   ├── utils/                  # Utility functions
│   │   ├── firestore.ts        # Firestore API
│   │   ├── scoring.ts          # Scoring logic
│   │   └── helpers.ts          # Helper functions
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   ├── config/                 # Configuration
│   │   └── firebase.ts
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── functions/                   # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts            # Functions implementation
│   ├── package.json
│   └── tsconfig.json
├── server/                      # Optional Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.ts
│   │   │   ├── teams.ts
│   │   │   └── levels.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json               # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── package.json               # Frontend dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mission-exploit-ctf
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Enable Cloud Functions

#### Get Firebase Configuration
1. Go to Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy the configuration object

#### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Firebase config
nano .env
```

Add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies

#### Frontend
```bash
npm install
```

#### Firebase Functions
```bash
cd functions
npm install
cd ..
```

#### Optional Express Server
```bash
cd server
npm install
cd ..
```

### 4. Deploy Firestore Rules and Indexes
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select existing project)
firebase init

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 6. Run Development Server
```bash
# Frontend
npm run dev

# Optional Express server (in separate terminal)
cd server
npm run dev
```

Visit `http://localhost:3000` to access the platform.

## 🔐 Firestore Collections Schema

### `users`
```typescript
{
  id: string;                    // User ID
  email: string;                 // User email
  displayName: string;           // Display name
  role: 'admin' | 'captain' | 'player';
  teamId?: string;              // Team ID (if assigned)
  groupId?: string;             // Group ID (if assigned)
  createdAt: number;            // Timestamp
}
```

### `teams`
```typescript
{
  id: string;                   // Team ID
  name: string;                 // Team name
  groupId: string;              // Group ID
  captainId: string;            // Captain user ID
  members: string[];            // Member user IDs
  score: number;                // Current score
  levelsCompleted: number;      // Levels completed count
  timePenalty: number;          // Total time penalty
  createdAt: number;
  updatedAt: number;
}
```

### `levels`
```typescript
{
  id: string;
  number: number;               // Level number
  title: string;
  description: string;
  basePoints: number;           // Base points for completion
  difficulty: 'easy' | 'medium' | 'hard';
  hintType: 'points' | 'time';  // Hint penalty type
  hintsAvailable: number;       // Number of hints
  pointDeduction?: number;      // Points deducted per hint
  timePenalty?: number;         // Time added per hint (minutes)
  flagFormat?: string;          // Expected flag format (regex)
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### `submissions`
```typescript
{
  id: string;
  teamId: string;
  levelId: string;
  flag?: string;
  timeTaken: number;            // Time in minutes
  hintsUsed: number;
  baseScore: number;
  pointDeduction: number;
  timePenalty: number;
  finalScore: number;
  submittedAt: number;
  submittedBy: string;          // Captain ID
}
```

### `leaderboard`
```typescript
{
  id: string;                   // Same as team ID
  teamName: string;
  groupId: string;
  score: number;
  levelsCompleted: number;
  totalTimeTaken: number;
  totalTimePenalty: number;
  lastSubmissionAt: number;
  rank?: number;                // Calculated
}
```

## 🎮 Usage Guide

### Admin Workflow

1. **Sign up** with admin role
2. **Generate Teams & Groups**
   - Go to Admin Dashboard
   - Enter number of teams and groups
   - Click "Generate"
3. **Create Levels**
   - Click "Add Level"
   - Configure points, difficulty, hints
   - Save level
4. **Assign Captains** (optional - via Express API)
5. **Monitor Competition**
   - View real-time submissions
   - Check statistics
   - Monitor leaderboard

### Captain Workflow

1. **Sign up** as captain
2. **Get assigned to a team** by admin
3. **View Available Levels**
   - Navigate to Captain Panel
4. **Complete Levels**
   - Request hints if needed
   - Enter time taken
   - Submit completion
5. **Track Progress**
   - View team score
   - Monitor leaderboard position

### Scoring Logic

#### Points-Based Hints
```
finalScore = basePoints - (hintsUsed × pointDeduction)
```

#### Time-Based Hints
```
finalTime = actualTime + (hintsUsed × timePenalty)
score = basePoints (time not deducted from points)
```

## 🔥 Firebase Cloud Functions

### `calculateScore`
- **Trigger:** On submission creation
- **Purpose:** Calculate and update team score
- **Updates:** Team score, levels completed, leaderboard

### `processHintUsage`
- **Trigger:** On hint usage
- **Purpose:** Apply hint penalties
- **Updates:** Team time penalty (for time-based hints)

### `initializeEvent`
- **Type:** Callable
- **Purpose:** Initialize event configuration
- **Auth:** Admin only

### `resetCompetition`
- **Type:** Callable
- **Purpose:** Reset all competition data
- **Auth:** Admin only

### `getTeamStatistics`
- **Type:** Callable
- **Purpose:** Get detailed team stats
- **Auth:** Authenticated users

## 🌐 Optional Express API Endpoints

### Admin Routes (`/api/admin/*`)
- `GET /stats` - Platform statistics
- `POST /bulk-create-teams` - Bulk team creation
- `POST /assign-captain` - Assign captain to team
- `DELETE /reset-competition` - Reset competition
- `GET /submissions` - Get all submissions

### Team Routes (`/api/teams/*`)
- `GET /` - Get all teams
- `GET /:teamId` - Get team details
- `GET /:teamId/leaderboard-position` - Get team rank

### Level Routes (`/api/levels/*`)
- `GET /` - Get all levels
- `GET /:levelId/submissions` - Get level submissions
- `GET /:levelId/stats` - Get level statistics

## 🔒 Security

### Firestore Rules
- **Read:** Authenticated users can read most collections
- **Write:** Role-based write permissions
- **Admin:** Full access to all operations
- **Captain:** Can submit for their team only
- **Players:** Read-only access

### API Security
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet.js security headers
- Admin-only endpoints protected

## 🚢 Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions
```bash
firebase deploy --only functions
```

### Express Server (Optional)
Deploy to your preferred platform:
- Heroku
- DigitalOcean
- AWS EC2
- Google Cloud Run

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Credits

**CSBC Cybersecurity Club**  
Mission Exploit 2.0 - Dynamic CTF Platform

---

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify `.env` configuration
- Check Firebase project settings
- Ensure Firestore is enabled

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Cloud Functions Not Triggering
- Check Firebase Functions logs: `firebase functions:log`
- Verify Firestore rules
- Ensure indexes are deployed

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Contact CSBC Cybersecurity Club

---

**Built with ❤️ by CSBC Cybersecurity Club**

