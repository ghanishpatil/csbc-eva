# Mission Exploit 2.0 - Architecture Documentation

## 🏛️ System Architecture

### Overview
Mission Exploit 2.0 is a serverless, real-time CTF platform built on Firebase with a React frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │ Captain  │  │  Player  │  │Leaderboard│   │
│  │Dashboard │  │  Panel   │  │   View   │  │   View    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Firebase SDK
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │Firestore │  │Functions │  │ Hosting  │   │
│  │          │  │ (NoSQL)  │  │(Serverless)│ │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ (Optional)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional Express Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Admin   │  │  Teams   │  │  Levels  │                  │
│  │   API    │  │   API    │  │   API    │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── Router
│   ├── Login (Public)
│   ├── Home (Protected)
│   ├── LeaderboardPage (Protected)
│   ├── Admin (Protected - Admin Only)
│   │   └── Dashboard
│   │       ├── TeamManager
│   │       └── LevelManager
│   └── Captain (Protected - Captain Only)
│       └── Levels
│           └── LevelCard
└── Layout (Wrapper)
    ├── Navigation
    └── Content
```

### State Management (Zustand)

```javascript
// Auth Store
{
  user: User | null,
  loading: boolean,
  setUser: (user) => void,
  logout: () => void
}

// App Store
{
  teams: Team[],
  groups: Group[],
  levels: Level[],
  leaderboard: LeaderboardEntry[],
  eventConfig: EventConfig | null,
  // ... setters and updaters
}
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
Firestore API Call
    ↓
Firebase Cloud Function (Trigger)
    ↓
Database Update
    ↓
Real-time Listener (onSnapshot)
    ↓
Zustand Store Update
    ↓
Component Re-render
```

## 🔥 Firebase Architecture

### Firestore Database Structure

```
firestore/
├── users/
│   └── {userId}
│       ├── id: string
│       ├── email: string
│       ├── role: string
│       └── teamId?: string
│
├── teams/
│   └── {teamId}
│       ├── id: string
│       ├── name: string
│       ├── groupId: string
│       ├── score: number
│       └── levelsCompleted: number
│
├── groups/
│   └── {groupId}
│       ├── id: string
│       ├── name: string
│       └── teamIds: string[]
│
├── levels/
│   └── {levelId}
│       ├── id: string
│       ├── title: string
│       ├── basePoints: number
│       ├── hintType: string
│       └── isActive: boolean
│
├── submissions/
│   └── {submissionId}
│       ├── teamId: string
│       ├── levelId: string
│       ├── finalScore: number
│       └── submittedAt: timestamp
│
├── hints/
│   └── {hintId}
│       ├── teamId: string
│       ├── levelId: string
│       ├── penalty: number
│       └── usedAt: timestamp
│
├── leaderboard/
│   └── {teamId}
│       ├── teamName: string
│       ├── score: number
│       └── rank: number
│
└── config/
    └── event
        ├── eventName: string
        ├── totalTeams: number
        └── isActive: boolean
```

### Cloud Functions Flow

#### calculateScore Function
```
Trigger: submissions/{id} onCreate
    ↓
1. Get submission data
    ↓
2. Calculate final score
    ↓
3. Update team document
    ↓
4. Update leaderboard entry
    ↓
Done
```

#### processHintUsage Function
```
Trigger: hints/{id} onCreate
    ↓
1. Get hint data
    ↓
2. Get level data (hint type)
    ↓
3. If time-based:
    ├── Update team time penalty
    └── Update leaderboard
    ↓
Done
```

## 🔒 Security Architecture

### Authentication Flow

```
User Login
    ↓
Firebase Auth (Email/Password)
    ↓
ID Token Generated
    ↓
Token stored in Auth Context
    ↓
All requests include token
    ↓
Firestore Rules validate token + role
    ↓
Access granted/denied
```

### Firestore Security Rules

```
Rules Structure:
├── Helper Functions
│   ├── isAuthenticated()
│   ├── isAdmin()
│   ├── isCaptain()
│   └── isTeamCaptain(teamId)
│
└── Collection Rules
    ├── users (read: all, write: admin/self)
    ├── teams (read: all, write: admin)
    ├── levels (read: all, write: admin)
    ├── submissions (read: all, write: captain-own-team)
    └── leaderboard (read: all, write: admin)
```

### API Security (Express)

```
Request
    ↓
Rate Limiter (100 req/15min)
    ↓
CORS Validation
    ↓
Authentication Middleware
    ├── Extract Bearer Token
    ├── Verify with Firebase
    └── Attach user to request
    ↓
Role-based Authorization
    ├── Admin-only routes
    └── User routes
    ↓
Route Handler
    ↓
Response
```

## ⚡ Real-time Features

### Firestore Listeners

```javascript
// Leaderboard Listener
onSnapshot(leaderboard) → Update Store → Re-render Components

// Teams Listener
onSnapshot(teams) → Update Store → Update Team Stats

// Levels Listener
onSnapshot(levels) → Update Store → Show/Hide Levels

// Event Config Listener
onSnapshot(config) → Update Store → Control Competition State
```

### Update Propagation

```
Captain submits level
    ↓
Create submission document
    ↓
Cloud Function triggers
    ↓
Updates team & leaderboard
    ↓
Listeners fire on all clients
    ↓
All users see updated leaderboard
    (< 1 second latency)
```

## 📊 Scoring System Architecture

### Points-Based Scoring

```
Input:
├── basePoints: 500
├── hintsUsed: 2
└── pointDeduction: 50

Calculation:
finalScore = 500 - (2 × 50) = 400

Output:
└── finalScore: 400
```

### Time-Based Scoring

```
Input:
├── basePoints: 800
├── timeTaken: 45 min
├── hintsUsed: 1
└── timePenalty: 10 min

Calculation:
totalTime = 45 + (1 × 10) = 55 min
finalScore = 800 (no deduction)

Output:
├── finalScore: 800
└── timePenalty: 10
```

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────┐
│    Firebase Hosting (CDN)           │
│    ├── Static Assets                │
│    ├── React SPA                    │
│    └── HTTPS Enforced               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Firebase Cloud Functions         │
│    ├── calculateScore               │
│    ├── processHintUsage             │
│    ├── initializeEvent              │
│    └── getTeamStatistics            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Firestore Database               │
│    ├── Auto-scaling                 │
│    ├── Multi-region Replication     │
│    └── Real-time Sync               │
└─────────────────────────────────────┘
```

### Optional Express Backend

```
┌─────────────────────────────────────┐
│    Cloud Platform (Heroku/AWS)      │
│    ├── Express Server               │
│    ├── Admin APIs                   │
│    └── Firebase Admin SDK           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Firebase (Admin SDK)             │
│    ├── Full Database Access         │
│    ├── User Management              │
│    └── Cloud Functions Trigger      │
└─────────────────────────────────────┘
```

## 📈 Scalability

### Database Scaling

```
Firestore Auto-scaling:
├── 1M document reads/day: Free
├── 50K document writes/day: Free
├── Beyond: $0.06/100K reads
└── Automatic sharding

Expected Usage (100 teams):
├── Document reads: ~50K/day
├── Document writes: ~5K/day
└── Cost: Free tier sufficient
```

### Function Scaling

```
Cloud Functions:
├── Auto-scales based on load
├── 2M invocations/month: Free
├── Cold start: ~1-2 seconds
└── Warm instances: <100ms

Expected Load (100 teams):
├── Submissions: ~500/day
├── Hints: ~200/day
└── Total invocations: ~1000/day (well within free tier)
```

## 🔄 Data Consistency

### Transaction Flow

```
Submission Creation:
1. Client creates submission doc (atomic)
2. Cloud Function reads submission (snapshot)
3. Function updates team (transaction)
4. Function updates leaderboard (transaction)
5. Listeners propagate changes
```

### Conflict Resolution

```
Concurrent Updates:
├── Firestore uses optimistic locking
├── Transactions retry on conflict
├── Last write wins for non-transactional
└── Atomicity guaranteed within transaction
```

## 🎯 Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Memoized expensive calculations
- Debounced real-time updates
- Optimistic UI updates

### Backend
- Indexed Firestore queries
- Batched write operations
- Cached user roles
- Minimal function cold starts
- Efficient listener patterns

### Network
- Firebase CDN for hosting
- Compressed assets
- HTTP/2 support
- WebSocket for real-time
- Regional database placement

---

**Architecture Version:** 2.0  
**Last Updated:** December 2024  
**Tech Stack:** React 18, Firebase 10, TypeScript 5

