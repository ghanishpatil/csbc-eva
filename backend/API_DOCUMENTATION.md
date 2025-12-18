# Mission Exploit 2.0 - API Documentation

Complete API reference for the secure backend.

## 🌐 Base URL

- **Development:** `http://localhost:5000`
- **Production:** `https://your-api-domain.com`

## 🔐 Authentication

### Admin Endpoints
Include this header:
```http
X-Admin-Key: your_admin_secret_key
```

## 📡 Endpoints

---

### 🏥 Health Check

Check if server is running.

**Endpoint:** `GET /health`

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "status": "OK",
  "service": "Mission Exploit 2.0 Backend",
  "version": "2.0.0",
  "environment": "development",
  "timestamp": "2024-12-11T10:30:45.123Z",
  "uptime": 3600
}
```

---

### 🚩 Submit Flag

Submit a flag for validation and scoring.

**Endpoint:** `POST /api/submit-flag`

**Authentication:** None (validated by teamId/captainId)

**Rate Limit:** 5 requests per minute per team

**Request Body:**
```json
{
  "teamId": "team_abc123",
  "levelId": "level_1",
  "flag": "ME2{example_flag}",
  "timeTaken": 45.5,
  "captainId": "captain_xyz789"
}
```

**Field Validations:**
- `teamId`: Required, non-empty string
- `levelId`: Required, non-empty string
- `flag`: Required, 1-500 characters, format: `ME2{...}`
- `timeTaken`: Optional, positive number (minutes)
- `captainId`: Required, non-empty string

**Response (Correct Flag):**
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
  "submissionId": "sub_123abc"
}
```

**Response (Incorrect Flag):**
```json
{
  "success": false,
  "status": "incorrect",
  "message": "Incorrect flag"
}
```

**Response (Invalid Format):**
```json
{
  "success": false,
  "status": "incorrect",
  "message": "Invalid flag format. Expected: ME2{...}"
}
```

**Error Responses:**
- `400` - Already submitted, level inactive, invalid data
- `404` - Team or level not found
- `429` - Rate limit exceeded
- `500` - Server error

---

### 📊 Get Team Statistics

Get detailed statistics for a team.

**Endpoint:** `GET /api/team/:teamId/stats`

**Authentication:** None

**Parameters:**
- `teamId`: Team identifier (URL parameter)

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

---

### 🔧 Admin: Update Level

Update level configuration (admin only).

**Endpoint:** `POST /api/admin/update-level`

**Authentication:** Required (`X-Admin-Key`)

**Rate Limit:** 50 requests per minute

**Request Body:**
```json
{
  "levelId": "level_1",
  "updates": {
    "title": "Updated Title",
    "description": "New description",
    "basePoints": 600,
    "isActive": false,
    "hintsAvailable": 5,
    "pointDeduction": 75,
    "timePenalty": 10
  }
}
```

**Field Validations:**
- `levelId`: Required, non-empty string
- `updates`: Object with optional fields:
  - `title`: String
  - `description`: String
  - `basePoints`: Positive number
  - `isActive`: Boolean
  - `hintsAvailable`: Non-negative number
  - `pointDeduction`: Non-negative number
  - `timePenalty`: Non-negative number

**Response:**
```json
{
  "success": true,
  "message": "Level updated successfully"
}
```

---

### 💰 Admin: Update Score

Manually adjust team score (admin override).

**Endpoint:** `POST /api/admin/update-score`

**Authentication:** Required (`X-Admin-Key`)

**Request Body:**
```json
{
  "teamId": "team_123",
  "scoreChange": 100,
  "reason": "Bonus for creative solution"
}
```

**Field Validations:**
- `teamId`: Required, non-empty string
- `scoreChange`: Required, number (can be negative)
- `reason`: Optional, string

**Response:**
```json
{
  "success": true,
  "message": "Score updated successfully",
  "newScore": 1350
}
```

---

### 📈 Admin: Get Platform Stats

Get platform-wide statistics.

**Endpoint:** `GET /api/admin/stats`

**Authentication:** Required (`X-Admin-Key`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTeams": 10,
    "activeTeams": 7,
    "totalLevels": 5,
    "activeLevels": 4,
    "totalSubmissions": 21,
    "totalUsers": 15,
    "totalScore": 12500,
    "averageScore": 1250,
    "completionRate": 42
  }
}
```

---

### 📋 Admin: Get Recent Activity

Get recent submissions and activity.

**Endpoint:** `GET /api/admin/recent-activity?limit=20`

**Authentication:** Required (`X-Admin-Key`)

**Query Parameters:**
- `limit`: Number of records (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "activity": [
    {
      "id": "sub_123",
      "teamId": "team_1",
      "levelId": "level_2",
      "finalScore": 450,
      "submittedAt": 1702301234567
    }
  ],
  "count": 20
}
```

---

### 🔄 Admin: Reset Competition

Reset all competition data (dangerous!).

**Endpoint:** `POST /api/admin/reset-competition`

**Authentication:** Required (`X-Admin-Key`)

**Request Body:**
```json
{
  "confirmationCode": "RESET_COMPETITION_NOW"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Competition has been reset successfully",
  "resetStats": {
    "submissionsDeleted": 21,
    "hintsDeleted": 15,
    "teamsReset": 10
  }
}
```

**⚠️ Warning:** This action:
- Deletes ALL submissions
- Deletes ALL hint usage
- Resets ALL team scores to 0
- Clears the leaderboard
- **CANNOT BE UNDONE**

---

## 🔒 Security Features

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/submit-flag` | 5 requests/minute per team |
| `/api/admin/*` | 50 requests/minute |
| `/api/*` (general) | 100 requests/minute |

### Input Validation

All requests are validated using Zod schemas:
```javascript
// Example: Flag submission validation
{
  teamId: string (min 1 char),
  levelId: string (min 1 char),
  flag: string (1-500 chars),
  timeTaken: number (≥ 0),
  captainId: string (min 1 char)
}
```

### Flag Protection

- Flags are **NEVER** stored in plaintext
- Only SHA-256 hashes stored in `.env`
- Constant-time comparison prevents timing attacks
- Invalid flags don't reveal any information

## 📝 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "field": "flag",
      "message": "Flag is required"
    }
  ]
}
```

### Rate Limit Error
```json
{
  "success": false,
  "error": "Too many flag submission attempts. Please try again later.",
  "retryAfter": 60
}
```

## 🧪 Testing Examples

### Using cURL

**Submit Flag:**
```bash
curl -X POST http://localhost:5000/api/submit-flag \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team_1",
    "levelId": "level_1",
    "flag": "ME2{welcome_to_mission_exploit}",
    "timeTaken": 30,
    "captainId": "captain_1"
  }'
```

**Get Team Stats:**
```bash
curl http://localhost:5000/api/team/team_1/stats
```

**Admin - Get Stats:**
```bash
curl http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: your_admin_key"
```

### Using JavaScript/Fetch

```javascript
// Submit flag
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
  
  return await response.json();
};

// Admin - Update score
const updateScore = async (teamId, scoreChange, adminKey) => {
  const response = await fetch('http://localhost:5000/api/admin/update-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify({
      teamId,
      scoreChange,
      reason: 'Manual adjustment',
    }),
  });
  
  return await response.json();
};
```

## 🔍 Monitoring & Logs

### Log Format
```
[2024-12-11T10:30:45.123Z] POST /api/submit-flag - 200 (234ms)
[FlagController] Submission attempt - Team: team_1, Level: level_2
[FlagController] Correct flag - Team: team_1, Level: level_2
[FlagController] Score updated - Team: team_1, +450 points
```

### Important Logs to Monitor
- Flag submission attempts (detect brute force)
- Admin operations (audit trail)
- Failed authentications
- Rate limit violations
- Server errors

## 🔗 Integration with Frontend

Update your frontend Captain component to use backend:

```typescript
// src/components/captain/LevelCard.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const response = await fetch('http://localhost:5000/api/submit-flag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: team.id,
      levelId: level.id,
      flag: flag,
      timeTaken: parseFloat(timeTaken),
      captainId: user.id,
    }),
  });
  
  const data = await response.json();
  
  if (data.success && data.status === 'correct') {
    toast.success(`Mission Complete! +${data.scoreAwarded} points`);
    // Reload data from Firestore (already updated by backend)
  } else {
    toast.error('Incorrect flag. Try again!');
  }
};
```

---

**Complete, secure, production-ready backend!** 🛡️🚀

