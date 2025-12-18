# ⚠️ Environment Files - Required Fixes for Production

## 🚨 CRITICAL: Files Are NOT Ready for Production

I've identified **4 CRITICAL issues** that must be fixed before deployment.

---

## 🔴 CRITICAL ISSUE #1: Exposed Firebase Private Key

**Location:** `backend/.env` line 17

**Problem:** Your Firebase private key is exposed in the file. This is a **CRITICAL SECURITY RISK**.

**IMMEDIATE ACTION REQUIRED:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to: **Project Settings** → **Service Accounts**
3. **DELETE** the exposed service account key
4. Generate a **NEW** private key
5. Update `backend/.env` with the new key

**⚠️ If this key is in Git, you MUST:**
- Revoke it immediately
- Consider rotating all Firebase credentials
- Review Git history for any commits containing this key

---

## 🔴 CRITICAL ISSUE #2: Development URLs

**Problem:** Both files use `localhost` URLs which won't work in production.

### Fix `backend/.env`:
```env
# CHANGE THIS:
FRONTEND_URL=http://localhost:3000

# TO THIS (replace with your actual domain):
FRONTEND_URL=https://your-production-domain.com
```

### Fix `.env`:
```env
# CHANGE THIS:
VITE_BACKEND_URL=http://localhost:5002

# TO THIS (replace with your actual backend domain):
VITE_BACKEND_URL=https://api.your-production-domain.com
```

**Note:** Use `https://` (not `http://`) for production!

---

## 🔴 CRITICAL ISSUE #3: Weak Admin Secret

**Location:** `backend/.env` line 47

**Problem:** `ADMIN_SECRET_KEY` appears to be a placeholder pattern.

**Fix:**
```bash
# Generate a strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update:
```env
ADMIN_SECRET_KEY=<paste-generated-secret-here>
```

**Also update** `.env` line 14 with the same value:
```env
VITE_ADMIN_TOKEN=<same-secret-as-above>
```

---

## 🔴 CRITICAL ISSUE #4: Placeholder Flag Hashes

**Location:** `backend/.env` lines 37-41

**Problem:** Flag hashes appear to be empty string hashes (not real flags).

**Fix:**
```bash
# Generate real flag hashes
cd backend
node scripts/generate-flag-hashes.js

# Or manually for each flag:
echo -n "CSBC{your_real_flag_here}" | shasum -a 256
```

Update all `LEVEL_X_FLAG_HASH` values with real hashes.

---

## ⚠️ WARNINGS (Should Also Fix)

### 1. Rate Limiting Too Restrictive
**Current:** 5 requests per minute  
**Recommended:** 100 requests per minute

```env
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Missing Production-Specific Files
Consider creating:
- `.env.production` (frontend)
- `backend/.env.production` (backend)

---

## ✅ GOOD NEWS

1. ✅ `.env` files are in `.gitignore` (protected)
2. ✅ `NODE_ENV=production` is set correctly
3. ✅ Firebase project ID is configured
4. ✅ Comments and documentation are present

---

## 📋 Quick Fix Checklist

- [ ] **Revoke and regenerate Firebase private key**
- [ ] **Update FRONTEND_URL to production domain (HTTPS)**
- [ ] **Update VITE_BACKEND_URL to production domain (HTTPS)**
- [ ] **Generate strong ADMIN_SECRET_KEY**
- [ ] **Update VITE_ADMIN_TOKEN to match ADMIN_SECRET_KEY**
- [ ] **Generate real flag hashes for all levels**
- [ ] **Adjust rate limiting (optional but recommended)**

---

## 🎯 After Fixes

Once all fixes are applied:
1. Test configuration locally
2. Deploy to staging environment
3. Verify all connections work
4. Deploy to production

---

**⏱️ Estimated Time:** 30-60 minutes to fix all issues

**🚫 DO NOT DEPLOY UNTIL ALL CRITICAL ISSUES ARE FIXED**

