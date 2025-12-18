# 📁 Mission Exploit 2.0 - Project Structure

Complete file structure and organization of the CTF platform.

---

## 🌳 Root Directory Structure

```
mission-exploit-ctf/
│
├── 📄 Configuration Files
│   ├── .env                          # Frontend environment variables (local)
│   ├── .env.production              # Frontend production environment
│   ├── .env.example                 # Frontend environment template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Frontend dependencies & scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.node.json           # Node TypeScript config
│   ├── vite.config.ts               # Vite build configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── index.html                   # HTML entry point
│   ├── firebase.json                # Firebase configuration
│   ├── firestore.rules              # Firestore security rules
│   ├── firestore.indexes.json       # Firestore database indexes
│   ├── docker-compose.yml           # Docker Compose configuration
│   ├── Dockerfile.frontend          # Frontend Docker image
│   └── nginx.conf                   # Nginx configuration
│
├── 📂 src/                          # Frontend source code
│
├── 📂 backend/                      # Backend API server
│
├── 📂 functions/                    # Firebase Cloud Functions
│
├── 📂 scripts/                      # Deployment & utility scripts
│
└── 📚 Documentation Files
    ├── README.md
    ├── DEPLOYMENT_GUIDE.md
    ├── PRODUCTION_READINESS_REPORT.md
    └── ... (other .md files)
```

---

## 📂 Frontend Source (`src/`)

```
src/
│
├── 📄 Entry Points
│   ├── main.tsx                     # React application entry
│   ├── App.tsx                      # Main app component & routing
│   ├── index.css                    # Global styles
│   └── vite-env.d.ts               # Vite type definitions
│
├── 📂 api/                          # API client modules
│   ├── adminApi.ts                  # Admin API client
│   └── participantApi.ts            # Participant API client
│
├── 📂 config/                       # Configuration modules
│   ├── api.ts                       # API base URL configuration
│   └── firebase.ts                  # Firebase initialization
│
├── 📂 components/                   # Reusable React components
│   │
│   ├── 📂 admin/                    # Admin-specific components
│   │   ├── AdminLayout.tsx          # Admin portal layout wrapper
│   │   ├── AdminNav.tsx             # Admin navigation sidebar
│   │   ├── LevelManager.tsx         # Level management component
│   │   ├── LiveMonitor.tsx          # Real-time monitoring
│   │   ├── SystemControls.tsx       # System control panel
│   │   ├── TeamManager.tsx          # Team management component
│   │   └── UserManager.tsx          # User management component
│   │
│   ├── 📂 captain/                  # Captain-specific components
│   │   └── LevelCard.tsx            # Level card display
│   │
│   ├── 📂 ui/                       # Shared UI components
│   │   ├── CyberCard.tsx            # Cyber-themed card component
│   │   ├── NeonButton.tsx           # Neon-styled button
│   │   ├── PageHeader.tsx           # Page header component
│   │   ├── SectionTitle.tsx         # Section title component
│   │   ├── StatCard.tsx             # Statistics card component
│   │   └── index.ts                 # UI components export
│   │
│   ├── ErrorBoundary.tsx            # Error boundary wrapper
│   ├── Layout.tsx                   # Main app layout (authenticated)
│   ├── Leaderboard.tsx              # Leaderboard component
│   ├── ProtectedRoute.tsx           # Route protection wrapper
│   ├── PublicLayout.tsx             # Public pages layout
│   └── PublicNavbar.tsx             # Public navigation bar
│
├── 📂 pages/                        # Page components (routes)
│   │
│   ├── 📂 admin/                    # Admin portal pages
│   │   ├── AdminAnalytics.tsx       # Analytics dashboard
│   │   ├── AdminAnnouncements.tsx   # Announcements management
│   │   ├── AdminDashboard.tsx       # Admin main dashboard
│   │   ├── AdminEventControl.tsx    # Event control (start/stop/pause)
│   │   ├── AdminGroups.tsx          # Groups management
│   │   ├── AdminLevels.tsx          # Levels/missions management
│   │   ├── AdminSettings.tsx        # System settings
│   │   ├── AdminSubmissions.tsx     # Flag submissions log
│   │   ├── AdminTeams.tsx           # Teams management
│   │   └── AdminUsers.tsx           # Users management
│   │
│   ├── 📂 captain/                  # Captain portal pages
│   │   └── Levels.tsx                # Levels view (legacy)
│   │
│   ├── 📂 participant/              # Participant portal pages
│   │   └── pages/
│   │       ├── ActiveMission.tsx    # Active mission view
│   │       ├── CheckIn.tsx          # QR code check-in
│   │       ├── Dashboard.tsx        # Participant dashboard
│   │       ├── Movement.tsx         # Movement tracking
│   │       └── TeamManagement.tsx   # Team join/create
│   │
│   ├── Home.tsx                     # Home page (authenticated)
│   ├── ImpersonatePage.tsx          # Admin impersonation page
│   ├── LandingPage.tsx              # Public landing page
│   ├── LeaderboardPage.tsx          # Public leaderboard page
│   └── Login.tsx                    # Authentication page
│
├── 📂 captain/                      # Captain portal modules
│   │
│   ├── 📂 api/                      # Captain API client
│   │   └── captainApi.ts            # Captain API methods
│   │
│   ├── 📂 components/               # Captain-specific components
│   │   ├── ActivityLogList.tsx      # Activity log display
│   │   ├── CaptainNavbar.tsx        # Captain navigation
│   │   ├── FlagSubmitBox.tsx        # Flag submission form
│   │   ├── Heatmap.tsx              # Activity heatmap
│   │   ├── HintPanel.tsx            # Hint request panel
│   │   ├── LeaderboardTable.tsx     # Leaderboard table
│   │   ├── MissionCard.tsx          # Mission card component
│   │   ├── MissionHeader.tsx        # Mission header
│   │   ├── MissionStatCard.tsx      # Mission statistics
│   │   ├── ScoreBreakdown.tsx       # Score breakdown view
│   │   ├── SuspiciousActivityDetector.tsx  # Anomaly detection
│   │   ├── TeamPerformanceCard.tsx  # Team performance card
│   │   └── TeamProgressGraph.tsx    # Progress visualization
│   │
│   ├── 📂 pages/                    # Captain portal pages
│   │   ├── ActivityLog.tsx          # Activity log page
│   │   ├── Announcements.tsx        # Announcements page
│   │   ├── Dashboard.tsx            # Captain dashboard
│   │   ├── GroupLeaderboard.tsx     # Group leaderboard
│   │   ├── Leaderboard.tsx          # Leaderboard page
│   │   ├── LevelDetail.tsx          # Level details page
│   │   ├── Levels.tsx               # Levels list page
│   │   ├── SubmissionLogs.tsx       # Submission logs
│   │   ├── TeamDetail.tsx           # Team detail page
│   │   ├── TeamProgress.tsx          # Team progress tracking
│   │   └── TeamsPerformance.tsx     # Teams performance overview
│   │
│   └── 📂 state/                    # Captain state management
│       └── captainStore.ts          # Zustand store for captain
│
├── 📂 hooks/                        # Custom React hooks
│   ├── useAuth.ts                   # Authentication hook
│   └── useFirestoreListener.ts      # Firestore real-time listeners
│
├── 📂 store/                        # State management (Zustand)
│   ├── adminStore.ts                # Admin state store
│   ├── appStore.ts                  # Global app state
│   └── authStore.ts                 # Authentication state
│
├── 📂 types/                        # TypeScript type definitions
│   └── index.ts                     # All type definitions
│
└── 📂 utils/                        # Utility functions
    ├── firestore.ts                 # Firestore helper functions
    ├── helpers.ts                   # General helper functions
    └── scoring.ts                   # Scoring calculation utilities
```

---

## 📂 Backend (`backend/`)

```
backend/
│
├── 📄 Configuration Files
│   ├── .env                         # Backend environment variables
│   ├── .env.example                 # Environment template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies
│   ├── nodemon.json                 # Nodemon configuration
│   ├── Dockerfile                   # Backend Docker image
│   └── LICENSE                      # License file
│
├── 📂 src/                          # Backend source code
│   │
│   ├── server.js                    # Express server entry point
│   │
│   ├── 📂 controllers/              # Request handlers
│   │   ├── adminController.js        # Admin operations
│   │   ├── captainController.js     # Captain operations
│   │   ├── flagController.js        # Flag submission handling
│   │   ├── participantController.js  # Participant operations
│   │   └── teamController.js        # Team management
│   │
│   ├── 📂 middleware/               # Express middleware
│   │   ├── rateLimiter.js           # Rate limiting middleware
│   │   └── validateRequest.js       # Request validation (Zod)
│   │
│   ├── 📂 routes/                   # API route definitions
│   │   ├── admin.js                 # Admin API routes
│   │   ├── captain.js               # Captain API routes
│   │   ├── participant.js           # Participant API routes
│   │   └── submitFlag.js            # Flag submission route
│   │
│   ├── 📂 services/                 # Business logic services
│   │   ├── eventService.js          # Event control logic
│   │   ├── firestoreService.js      # Firestore operations
│   │   ├── flagService.js           # Flag validation logic
│   │   ├── hintService.js           # Hint management
│   │   └── scoringService.js       # Score calculation
│   │
│   └── 📂 utils/                    # Utility functions
│       ├── cryptoUtils.js           # Cryptographic utilities
│       └── firebase.js              # Firebase Admin SDK setup
│
├── 📂 scripts/                      # Utility scripts
│   ├── generate-flag-hashes.js      # Generate flag hashes
│   └── test-backend.js              # Backend testing script
│
└── 📚 Documentation
    ├── README.md
    ├── API_DOCUMENTATION.md
    ├── SECURITY.md
    └── ... (other .md files)
```

---

## 📂 Firebase Cloud Functions (`functions/`)

```
functions/
│
├── package.json                     # Functions dependencies
├── tsconfig.json                    # TypeScript configuration
│
└── 📂 src/
    └── index.ts                     # Cloud Functions entry point
```

---

## 📂 Scripts (`scripts/`)

```
scripts/
├── deploy.sh                        # Bash deployment script
├── deploy.ps1                       # PowerShell deployment script
└── health-check.sh                  # Health check script
```

---

## 📂 Key Files & Their Purposes

### Frontend Entry Points
- **`src/main.tsx`** - React application entry point
- **`src/App.tsx`** - Main app component with routing
- **`index.html`** - HTML template

### Configuration
- **`vite.config.ts`** - Vite build tool configuration
- **`tsconfig.json`** - TypeScript compiler options
- **`tailwind.config.js`** - TailwindCSS styling configuration
- **`.env`** - Local development environment variables
- **`.env.production`** - Production environment variables

### Firebase
- **`firebase.json`** - Firebase project configuration
- **`firestore.rules`** - Database security rules
- **`firestore.indexes.json`** - Database query indexes

### Docker
- **`docker-compose.yml`** - Multi-container orchestration
- **`Dockerfile.frontend`** - Frontend container image
- **`backend/Dockerfile`** - Backend container image
- **`nginx.conf`** - Web server configuration

### State Management
- **`src/store/appStore.ts`** - Global application state
- **`src/store/authStore.ts`** - Authentication state
- **`src/store/adminStore.ts`** - Admin-specific state
- **`src/captain/state/captainStore.ts`** - Captain state

### API Clients
- **`src/api/adminApi.ts`** - Admin API client
- **`src/api/participantApi.ts`** - Participant API client
- **`src/captain/api/captainApi.ts`** - Captain API client

### Type Definitions
- **`src/types/index.ts`** - All TypeScript interfaces and types

---

## 🎯 Portal Structure

### Admin Portal
- **Layout:** `src/components/admin/AdminLayout.tsx`
- **Navigation:** `src/components/admin/AdminNav.tsx`
- **Pages:** `src/pages/admin/*.tsx`
- **State:** `src/store/adminStore.ts`

### Captain Portal
- **Layout:** Uses `src/components/Layout.tsx`
- **Navigation:** `src/captain/components/CaptainNavbar.tsx`
- **Pages:** `src/captain/pages/*.tsx`
- **State:** `src/captain/state/captainStore.ts`
- **API:** `src/captain/api/captainApi.ts`

### Participant Portal
- **Layout:** Uses `src/components/Layout.tsx`
- **Pages:** `src/participant/pages/*.tsx`
- **API:** `src/api/participantApi.ts`

### Public Pages
- **Layout:** `src/components/PublicLayout.tsx`
- **Navigation:** `src/components/PublicNavbar.tsx`
- **Pages:** `src/pages/LandingPage.tsx`, `src/pages/LeaderboardPage.tsx`

---

## 📊 Data Flow

```
Frontend (React)
    ↓
API Clients (src/api/*.ts)
    ↓
Backend API (backend/src/routes/*.js)
    ↓
Controllers (backend/src/controllers/*.js)
    ↓
Services (backend/src/services/*.js)
    ↓
Firebase Admin SDK
    ↓
Firestore Database
```

---

## 🔐 Security Files

- **`firestore.rules`** - Database security rules (read-only for clients)
- **`backend/src/middleware/validateRequest.js`** - Request validation
- **`backend/src/middleware/rateLimiter.js`** - Rate limiting
- **`src/components/ProtectedRoute.tsx`** - Route protection

---

## 📝 Notes

- **Environment Variables:** Never commit `.env` files (in `.gitignore`)
- **TypeScript:** All frontend code is TypeScript (`.tsx`, `.ts`)
- **JavaScript:** Backend uses JavaScript (`.js`)
- **State Management:** Zustand for frontend state
- **Styling:** TailwindCSS with custom cyber theme
- **Build Tool:** Vite for frontend
- **Runtime:** Node.js 18+ for backend

---

**Last Updated:** $(date)

