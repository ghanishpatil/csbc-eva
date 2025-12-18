# Security Documentation - Mission Exploit 2.0 Backend

## 🛡️ Security Architecture

### Flag Protection System

```
┌─────────────────────────────────────────────────────────┐
│  1. Admin creates flag: "ME2{secret_flag}"             │
├─────────────────────────────────────────────────────────┤
│  2. Generate SHA-256 hash:                              │
│     a1b2c3d4e5f6... (64 characters)                    │
├─────────────────────────────────────────────────────────┤
│  3. Store hash in .env:                                 │
│     LEVEL_1_FLAG_HASH=a1b2c3d4e5f6...                  │
├─────────────────────────────────────────────────────────┤
│  4. Delete original flag everywhere                     │
├─────────────────────────────────────────────────────────┤
│  5. Captain submits: "ME2{secret_flag}"                │
├─────────────────────────────────────────────────────────┤
│  6. Backend hashes submission:                          │
│     a1b2c3d4e5f6...                                    │
├─────────────────────────────────────────────────────────┤
│  7. Compare hashes (constant-time):                     │
│     submitted_hash === stored_hash                      │
├─────────────────────────────────────────────────────────┤
│  8. Return result WITHOUT revealing flag                │
└─────────────────────────────────────────────────────────┘
```

### Why This is Secure

1. **No plaintext flags** - Never stored in database or code
2. **One-way hashing** - Cannot reverse SHA-256 to get flag
3. **Timing-safe comparison** - Prevents timing attack analysis
4. **Server-side only** - Frontend never sees flags or hashes
5. **No information leakage** - Errors don't reveal flag details

## 🚨 Attack Prevention

### 1. Brute Force Protection

**Attack:** Automated flag guessing

**Prevention:**
- Rate limiting: 5 attempts per minute per team
- Exponential backoff on repeated failures
- IP-based tracking
- Logging of all attempts

**Implementation:**
```javascript
// Rate limiter in middleware
flagSubmissionLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 requests max
  keyGenerator: (req) => `${req.ip}-${req.body?.teamId}`,
});
```

### 2. Timing Attacks

**Attack:** Measure response time to guess flag characters

**Prevention:**
- Constant-time hash comparison using `crypto.timingSafeEqual()`
- Artificial random delay (100-150ms)
- Always respond in similar timeframes

**Implementation:**
```javascript
// Constant-time comparison
compareHash(plaintext, hash) {
  return crypto.timingSafeEqual(
    Buffer.from(hashSHA256(plaintext), 'hex'),
    Buffer.from(hash, 'hex')
  );
}

// Artificial delay
await new Promise(resolve => 
  setTimeout(resolve, 100 + Math.random() * 50)
);
```

### 3. SQL Injection

**Attack:** Inject malicious SQL in parameters

**Prevention:**
- Firebase Firestore (NoSQL) - immune to SQL injection
- Zod schema validation
- Input sanitization
- Parameterized queries only

### 4. NoSQL Injection

**Attack:** Inject malicious objects in Firestore queries

**Prevention:**
- Strict type checking with Zod
- No raw query parameter acceptance
- Sanitize all string inputs

**Implementation:**
```javascript
const submitFlagSchema = z.object({
  teamId: z.string().min(1),
  levelId: z.string().min(1),
  flag: z.string().min(1).max(500),
  // ... strict typing for all fields
});
```

### 5. Unauthorized Access

**Attack:** Access admin endpoints without permission

**Prevention:**
- Admin secret key required
- Header-based authentication
- Environment variable storage
- Future: JWT token validation

**Implementation:**
```javascript
export const verifyAdmin = async (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized',
    });
  }
  
  next();
};
```

### 6. CORS Attacks

**Attack:** Unauthorized cross-origin requests

**Prevention:**
- CORS restricted to frontend URL only
- Credentials enabled only for allowed origins
- Pre-flight request validation

**Implementation:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### 7. DDoS Attacks

**Attack:** Overwhelming server with requests

**Prevention:**
- Rate limiting on all endpoints
- Request size limits (10MB max)
- Timeout configurations
- Connection limits

### 8. Information Disclosure

**Attack:** Extracting sensitive data from errors

**Prevention:**
- Generic error messages in production
- Detailed errors only in development
- No stack traces in production
- Sanitized log outputs

**Implementation:**
```javascript
app.use((err, req, res, next) => {
  const message = NODE_ENV === 'development' 
    ? err.message 
    : 'Internal server error';
  
  res.status(500).json({
    success: false,
    error: message,
  });
});
```

## 🔑 Secret Management

### Environment Variables (.env)

**NEVER commit these to Git:**
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_SECRET_KEY`
- `LEVEL_*_FLAG_HASH`

**Storage Best Practices:**
1. Use `.env` file (local development)
2. Use platform secrets (production):
   - Heroku: Config Vars
   - DigitalOcean: App-level env vars
   - AWS: Secrets Manager
   - Docker: Docker secrets

### Admin Key Generation

```bash
# Generate secure 32-byte (256-bit) key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Key Rotation

1. Generate new admin key
2. Update `.env`
3. Restart server
4. Update admin tools/scripts
5. Invalidate old key

## 🔍 Audit & Monitoring

### What to Log

✅ **DO Log:**
- All flag submission attempts (team, level, timestamp)
- Correct flag submissions
- Admin operations
- Failed authentication
- Rate limit violations
- Server errors

❌ **DON'T Log:**
- Actual submitted flags
- Private keys
- Admin secret keys
- User passwords

### Log Example

```
[2024-12-11T10:30:45.123Z] POST /api/submit-flag - 200 (234ms)
[FlagController] Submission attempt - Team: team_1, Level: level_2
[FlagController] Correct flag - Team: team_1, Level: level_2
[FlagController] Score updated - Team: team_1, +450 points
```

### Monitoring Metrics

Track these metrics:
- Requests per minute
- Flag submission success rate
- Average response time
- Error rate
- Failed authentication attempts

## 🚨 Incident Response

### If Flags are Compromised

1. **Immediately** generate new flags
2. Update hashes in `.env`
3. Restart server
4. Reset affected levels
5. Notify participants
6. Investigate how leak occurred

### If Admin Key is Compromised

1. **Immediately** generate new key
2. Update `.env`
3. Restart server
4. Review recent admin operations
5. Check for unauthorized changes

### If Database is Compromised

1. Check Firestore security rules
2. Review recent operations in Firebase Console
3. Backup current data
4. Restore from backup if needed
5. Investigate access logs

## ✅ Security Checklist

### Development
- [ ] .env file configured
- [ ] Flag hashes generated
- [ ] Admin key set (min 32 chars)
- [ ] .env NOT in Git
- [ ] Firebase service account secured
- [ ] CORS configured for localhost

### Production
- [ ] Strong admin key (64+ chars)
- [ ] HTTPS enforced
- [ ] FRONTEND_URL set correctly
- [ ] NODE_ENV=production
- [ ] Logging/monitoring enabled
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] All secrets in secure storage
- [ ] Rate limits appropriate
- [ ] Error messages sanitized

## 📚 Security References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Security is not optional. Stay vigilant!** 🛡️

