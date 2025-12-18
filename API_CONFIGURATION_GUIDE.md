# 🔧 API CONFIGURATION GUIDE

## ✅ CENTRALIZED API CONFIGURATION COMPLETE

All API calls now use a **single constant URL** from one centralized configuration file.

---

## 📁 **Configuration Structure**

```
Project Root
├── .env                          ← Frontend env (development)
├── .env.production              ← Frontend env (production)
├── backend/.env                 ← Backend env
│
└── src/
    ├── config/
    │   └── api.ts              ← ⭐ SINGLE SOURCE OF TRUTH
    │
    └── api/
        ├── adminApi.ts         ← Uses centralized config ✅
        ├── participantApi.ts   ← Uses centralized config ✅
        └── captain/
            └── captainApi.ts   ← Uses centralized config ✅
```

---

## 🎯 **How It Works**

### **1. Centralized Config File**
**`src/config/api.ts`** - Single source of truth for ALL API calls

```typescript
// Reads from .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Validates it's set
if (!BACKEND_URL) {
  throw new Error('Backend URL not configured');
}

// Exports single constant
export const API_BASE_URL = BACKEND_URL;
```

### **2. All API Clients Import From Here**

**Before (❌ Inconsistent):**
```typescript
// adminApi.ts
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// participantApi.ts  
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';

// captainApi.ts
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
```

**After (✅ Centralized):**
```typescript
// adminApi.ts
import { API_BASE_URL } from '@/config/api';

// participantApi.ts
import { API_BASE_URL } from '@/config/api';

// captainApi.ts
import { API_BASE_URL } from '@/config/api';
```

---

## ⚙️ **Environment Configuration**

### **Frontend Configuration**

**`.env` (Development)**
```env
# ⚠️ SINGLE SOURCE OF TRUTH - All API calls use this
VITE_BACKEND_URL=http://192.168.1.5:5002

# Must match backend/.env PORT setting
```

**`.env.production` (Production)**
```env
# ⚠️ UPDATE FOR PRODUCTION
VITE_BACKEND_URL=https://api.your-domain.com

# Or for Docker:
# VITE_BACKEND_URL=http://localhost:5002
```

### **Backend Configuration**

**`backend/.env`**
```env
PORT=5002  # ← Frontend VITE_BACKEND_URL must match this port
NODE_ENV=production
```

---

## 🚀 **Setup Instructions**

### **Step 1: Set Your Backend URL**

Edit `.env` file:
```env
VITE_BACKEND_URL=http://YOUR_IP:5002
```

**Options:**
- **Local Development:** `http://localhost:5002`
- **Network Access:** `http://192.168.1.X:5002`
- **Production:** `https://api.your-domain.com`

### **Step 2: Verify Backend Port**

Check `backend/.env`:
```env
PORT=5002  # Must match the port in VITE_BACKEND_URL
```

### **Step 3: Restart Both Servers**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
npm run dev
```

### **Step 4: Verify Connection**

Open browser console (F12) and you should see:
```
🔧 API Configuration:
  Backend URL: http://192.168.1.5:5002
  Admin Token: ✓ Set
```

---

## 🔍 **Troubleshooting**

### **Issue: "Backend URL not configured"**

**Problem:** `.env` file doesn't have `VITE_BACKEND_URL` set

**Fix:**
```bash
# Create/edit .env file
echo "VITE_BACKEND_URL=http://localhost:5002" > .env
```

### **Issue: "Network Error" or "ERR_CONNECTION_REFUSED"**

**Problem:** Frontend URL doesn't match backend port

**Fix:**
```bash
# 1. Check backend port
grep PORT backend/.env
# Output: PORT=5002

# 2. Update frontend .env to match
echo "VITE_BACKEND_URL=http://localhost:5002" > .env

# 3. Restart both servers
```

### **Issue: "Failed to load mission"**

**Problem:** CORS or wrong URL

**Fix:**
```bash
# 1. Check backend/.env has correct FRONTEND_URL
# backend/.env:
FRONTEND_URL=http://localhost:3000

# 2. Verify VITE_BACKEND_URL in frontend .env
# .env:
VITE_BACKEND_URL=http://localhost:5002

# 3. Both must be accessible to each other
```

---

## 🌐 **Network Access (Mobile Testing)**

### **Setup for Network Access:**

**1. Get Your IP Address:**
```bash
# Windows
ipconfig
# Look for IPv4 Address: 192.168.1.X

# Mac/Linux
ifconfig
# Look for inet: 192.168.1.X
```

**2. Update Frontend `.env`:**
```env
VITE_BACKEND_URL=http://192.168.1.5:5002
```

**3. Update Backend `backend/.env`:**
```env
FRONTEND_URL=http://192.168.1.5:3000
```

**4. Access from Mobile:**
```
Frontend: http://192.168.1.5:3000
Backend:  http://192.168.1.5:5002
```

---

## 📊 **Port Configuration Matrix**

| Component | Port | Environment Variable | Config File |
|-----------|------|---------------------|-------------|
| **Frontend Dev Server** | 3000 | - | vite.config.ts |
| **Backend API Server** | 5002 | `PORT` | backend/.env |
| **Frontend → Backend** | 5002 | `VITE_BACKEND_URL` | .env |
| **Backend → Frontend** | 3000 | `FRONTEND_URL` | backend/.env |

---

## ✅ **Verification Checklist**

- [ ] `.env` file has `VITE_BACKEND_URL` set
- [ ] `backend/.env` has `PORT` set
- [ ] `VITE_BACKEND_URL` port matches `backend/.env` PORT
- [ ] Backend server running on correct port
- [ ] Frontend server running
- [ ] Browser console shows API config
- [ ] No CORS errors in console
- [ ] API calls successful

---

## 🎯 **Summary**

### **What Changed:**
1. ✅ Created `src/config/api.ts` - single source of truth
2. ✅ All API files now import from centralized config
3. ✅ Removed hardcoded fallback URLs
4. ✅ Consistent timeout (30 seconds) across all APIs
5. ✅ Clear error if VITE_BACKEND_URL not set

### **How to Use:**
1. Set `VITE_BACKEND_URL` in `.env`
2. Make sure it matches `backend/.env` PORT
3. Restart servers
4. All API calls automatically use the correct URL

### **Benefits:**
- ✅ Single place to change backend URL
- ✅ No port mismatches
- ✅ Clear error messages if misconfigured
- ✅ Works for development, network access, and production
- ✅ Type-safe imports

**No more localhost scattered everywhere!** 🎉

