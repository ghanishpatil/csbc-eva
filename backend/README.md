# Mission Exploit 2.0 - Secure Backend

**Production-ready secure backend for CTF flag validation and scoring.**

## 🔐 Security Features

- ✅ **Flag validation ONLY on backend** - Flags never exposed to frontend
- ✅ **SHA-256 hashing** - Flags stored as cryptographic hashes
- ✅ **Constant-time comparison** - Prevents timing attacks
- ✅ **Rate limiting** - 5 submissions per minute per team
- ✅ **Input validation** - Zod schema validation on all endpoints
- ✅ **Request sanitization** - Prevents injection attacks
- ✅ **Admin authentication** - Protected endpoints with secret key
- ✅ **CORS protection** - Configured for frontend origin only

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── submitFlag.js       # Flag submission routes
│   │   └── admin.js            # Admin-only routes
│   ├── controllers/
│   │   ├── flagController.js   # Flag validation logic
│   │   └── adminController.js  # Admin operations
│   ├── services/
│   │   ├── flagService.js      # Flag hashing & validation
│   │   ├── scoringService.js   # Score calculation
│   │   ├── hintService.js      # Hint management
│   │   └── firestoreService.js # Database operations
│   ├── middleware/
│   │   ├── rateLimiter.js      # Rate limiting configs
│   │   └── validateRequest.js  # Request validation
│   ├── utils/
│   │   ├── cryptoUtils.js      # Hashing utilities
│   │   └── firebase.js         # Firebase Admin setup
│   └── server.js               # Main server file
├── .env.example                # Environment template
└── package.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=5000
FIREBASE_PROJECT_ID=csbc-eva
FIREBASE_CLIENT_EMAIL=your-service-account@csbc-eva.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Generate flag hashes using the script
LEVEL_1_FLAG_HASH=your_hash_here
LEVEL_2_FLAG_HASH=your_hash_here
```

### 3. Generate Flag Hashes

Use Node.js to generate hashes:

```javascript
import crypto from 'crypto';

const generateHash = (flag) => {
  return crypto.createHash('sha256').update(flag).digest('hex');
};

console.log('Level 1:', generateHash('ME2{welcome_to_ctf}'));
console.log('Level 2:', generateHash('ME2{sql_injection_master}'));
```

Or use the command line:

```bash
echo -n "ME2{your_flag}" | shasum -a 256
```

### 4. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/project/csbc-eva/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values for `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 5. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Public Endpoints

#### Submit Flag
```http
POST /api/submit-flag
Content-Type: application/json

{
  "teamId": "team_123",
  "levelId": "level_1",
  "flag": "ME2{example_flag}",
  "timeTaken": 45.5,
  "captainId": "captain_456"
}
```

**Response (Correct):**
```json
{
  "success": true,
  "status": "correct",
  "scoreAwarded": 450,
  "breakdown": {
    "baseScore": 500,
    "hintsUsed": 1,
    "pointDeduction": 50,
    "timePenalty": 0,
    "finalScore": 450
  },
  "submissionId": "sub_789"
}
```

**Response (Incorrect):**
```json
{
  "success": false,
  "status": "incorrect",
  "message": "Incorrect flag"
}
```

#### Get Team Stats
```http
GET /api/team/:teamId/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "teamName": "Team Alpha",
    "score": 1250,
    "levelsCompleted": 3,
    "timePenalty": 15,
    "totalSubmissions": 3
  }
}
```

### Admin Endpoints

**Authentication:** Include `X-Admin-Key` header with admin secret

#### Update Level
```http
POST /api/admin/update-level
X-Admin-Key: your_admin_secret_key
Content-Type: application/json

{
  "levelId": "level_1",
  "updates": {
    "isActive": false,
    "basePoints": 600
  }
}
```

#### Update Score (Manual Override)
```http
POST /api/admin/update-score
X-Admin-Key: your_admin_secret_key
Content-Type: application/json

{
  "teamId": "team_123",
  "scoreChange": 100,
  "reason": "Bonus points for creativity"
}
```

#### Get Platform Stats
```http
GET /api/admin/stats
X-Admin-Key: your_admin_secret_key
```

#### Get Recent Activity
```http
GET /api/admin/recent-activity?limit=20
X-Admin-Key: your_admin_secret_key
```

#### Reset Competition
```http
POST /api/admin/reset-competition
X-Admin-Key: your_admin_secret_key
Content-Type: application/json

{
  "confirmationCode": "RESET_COMPETITION_NOW"
}
```

## 🔒 Security Best Practices

### Flag Security
1. **Never** store plaintext flags in code or database
2. **Always** use SHA-256 hashes in environment variables
3. **Never** return flag hints in error messages
4. Use constant-time comparison to prevent timing attacks

### Rate Limiting
- Flag submissions: **5 per minute** per team
- Admin endpoints: **50 per minute**
- General API: **100 per minute**

### Input Validation
All requests are validated using Zod schemas:
- Type checking
- Length limits
- Format validation
- Sanitization

### Admin Protection
- Admin endpoints require `X-Admin-Key` header
- Secret key stored in environment variables
- Never expose in frontend code

## 🧪 Testing

### Test Flag Submission

```bash
curl -X POST http://localhost:5000/api/submit-flag \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "test_team",
    "levelId": "level_1",
    "flag": "ME2{test_flag}",
    "timeTaken": 30,
    "captainId": "test_captain"
  }'
```

### Test Admin Endpoint

```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: your_secret_key"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No (default: development) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Yes |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: localhost:3000) |
| `LEVEL_X_FLAG_HASH` | SHA-256 hash for level X | Yes (for each level) |
| `ADMIN_SECRET_KEY` | Admin authentication key | Yes |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No (default: 5) |

### Generating Flag Hashes

```javascript
// generate-hashes.js
import crypto from 'crypto';

const flags = [
  'ME2{welcome_to_mission_exploit}',
  'ME2{sql_injection_detected}',
  'ME2{xss_vulnerability_found}',
  'ME2{buffer_overflow_success}',
  'ME2{privilege_escalation}',
];

flags.forEach((flag, index) => {
  const hash = crypto.createHash('sha256').update(flag).digest('hex');
  console.log(`LEVEL_${index + 1}_FLAG_HASH=${hash}`);
});
```

Run: `node generate-hashes.js`

## 📊 Scoring Logic

### Points-Based Hints
```
finalScore = baseScore - (hintsUsed × pointDeduction)
```

Example:
- Base: 500 points
- Hints used: 2
- Deduction: 50 points/hint
- **Final: 400 points**

### Time-Based Hints
```
finalScore = baseScore (unchanged)
totalTime = actualTime + (hintsUsed × timePenalty)
```

Example:
- Base: 800 points
- Time: 45 minutes
- Hints: 1
- Penalty: 10 minutes/hint
- **Final: 800 points, 55 minutes total**

## 🚨 Error Handling

### All responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## 📝 Logs

All operations are logged with timestamps:

```
[2024-12-11T10:30:45.123Z] POST /api/submit-flag - 200 (234ms)
[FlagController] Submission attempt - Team: team_1, Level: level_2
[FlagController] Correct flag - Team: team_1, Level: level_2
[FlagController] Score updated - Team: team_1, +450 points
```

## 🔄 Integration with Frontend

Update frontend to use backend for flag validation:

```typescript
// Example: Submit flag from frontend
const submitFlag = async (teamId, levelId, flag, timeTaken, captainId) => {
  const response = await fetch('http://localhost:5000/api/submit-flag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId,
      levelId,
      flag,
      timeTaken,
      captainId,
    }),
  });
  
  const data = await response.json();
  return data;
};
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `ADMIN_SECRET_KEY`
- [ ] Configure proper `FRONTEND_URL`
- [ ] Set up Firebase service account
- [ ] Generate all flag hashes
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backup strategy

### Deployment Platforms

- **Heroku:** Use Procfile
- **DigitalOcean:** Use App Platform
- **AWS:** Use Elastic Beanstalk or EC2
- **Google Cloud:** Use Cloud Run or App Engine

## 📞 Support

For issues:
- Check logs in terminal
- Verify environment variables
- Test endpoints with curl/Postman
- Check Firebase Console for errors

---

**Built with security in mind for CSBC Cybersecurity Club** 🛡️


