# 🚀 Deployment Readiness Checklist

## ✅ Firebase Configuration

### Firestore Indexes
- ✅ **submissions**: `teamId + submittedAt (desc)` - Defined
- ✅ **hints**: `teamId + levelId + usedAt` - Defined
- ✅ **levels**: `groupId + number` - Defined (for group-scoped missions)
- ✅ **hint_usage**: `teamId + levelId` and `levelId + teamId + usedAt` - Defined
- ✅ **manual_submissions**: `teamId + submittedAt (desc)`, `status + submittedAt (desc)`, `teamId + levelId + status` - Defined

**Note**: Single-field queries (like `qrCodeId`, `isActive`, `groupId`) are automatically indexed by Firestore.

### Firestore Security Rules
- ✅ All collections configured with READ-ONLY for authenticated users
- ✅ All writes must go through backend API (Admin SDK bypasses rules)
- ✅ New collections added:
  - `manual_submissions` - READ ONLY
  - `check_ins` - READ ONLY
  - `hint_usage` - READ ONLY
  - `event_config` - READ ONLY
  - `level_index` - INTERNAL (backend only)
  - `qr_index` - INTERNAL (backend only)

### Firebase Functions
- ✅ **calculateScore**: NO-OP (scoring handled by backend)
- ✅ **processHintUsage**: NO-OP (hints handled by backend)
- ✅ TypeScript compilation configured
- ✅ Node 20 runtime specified

## ✅ Backend Configuration

### Critical Features
- ✅ **Atomic Level Creation**: Uses Firestore transactions with index collections to prevent race conditions
- ✅ **Duplicate Prevention**: 
  - Level number uniqueness per group (via `level_index`)
  - QR Code uniqueness (via `qr_index`)
- ✅ **Security**: 
  - Rate limiting enabled
  - CORS properly configured
  - Helmet security headers
  - All flag validation server-side
- ✅ **Manual Submissions**: Full workflow with captain approval
- ✅ **Real-time Updates**: Firestore listeners in frontend

### Environment Variables Required
```bash
# Server
PORT=8080
NODE_ENV=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://another-domain.com
```

## ✅ Frontend Configuration

### API Configuration
- ✅ Backend URL configured via environment variables
- ✅ Firebase client SDK initialized
- ✅ Real-time listeners for live updates

## ✅ Data Integrity

### Race Condition Protection
- ✅ **Level Creation**: Atomic transaction prevents duplicate levels
- ✅ **Flag Submission**: Atomic transaction prevents duplicate scoring
- ✅ **Manual Submission Approval**: Atomic transaction prevents double approval
- ✅ **Hint Usage**: Atomic transaction prevents double penalties

### Validation
- ✅ Group ID required for levels
- ✅ Level number must be unique per group
- ✅ QR Code ID must be unique globally
- ✅ Flag format validation (CSBC{...})
- ✅ Sequential level progression enforced

## 📋 Pre-Deployment Steps

### 1. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```
**Wait for all indexes to be built** (can take several minutes)

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Firebase Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 4. Backend Deployment
- Set all environment variables in your hosting platform (Railway, Heroku, etc.)
- Ensure `FIREBASE_PRIVATE_KEY` is properly escaped (newlines as `\n`)
- Set `NODE_ENV=production`
- Set `FRONTEND_URL` and `ALLOWED_ORIGINS` for CORS

### 5. Frontend Deployment
- Set `VITE_BACKEND_URL` environment variable
- Build: `npm run build`
- Deploy to Vercel/Netlify/etc.

## ⚠️ Important Notes

1. **Index Building**: Firestore indexes can take 5-15 minutes to build. Don't deploy backend until indexes are ready.

2. **Environment Variables**: 
   - Backend needs Firebase Admin SDK credentials
   - Frontend needs backend API URL
   - CORS must be configured correctly

3. **First-Time Setup**:
   - Create at least one group in Firestore
   - Create admin user with role='admin'
   - Create captain users with role='captain' and groupId assigned

4. **Testing After Deployment**:
   - Test level creation (should prevent duplicates)
   - Test flag submission (should prevent duplicate scoring)
   - Test manual submission workflow
   - Test real-time updates

## 🔒 Security Checklist

- ✅ All writes go through backend (Firestore rules enforce this)
- ✅ Flag hashing done server-side only
- ✅ Rate limiting enabled
- ✅ CORS restricted to known origins
- ✅ Authentication required for all operations
- ✅ Role-based access control (admin, captain, player)
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (using Firestore, not SQL)
- ✅ XSS prevention (helmet.js)

## ✅ Status: READY FOR DEPLOYMENT

All critical components are configured and tested. The system is production-ready with:
- Race condition protection
- Duplicate prevention
- Security hardening
- Real-time capabilities
- Manual submission workflow
- Comprehensive error handling
