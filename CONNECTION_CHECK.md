# Backend-Frontend Connection Check

## Current Configuration

### Frontend (.env)
- **VITE_BACKEND_URL**: `http://localhost:5002`
- **Frontend Port**: `3000` (from vite.config.ts)

### Backend (backend/.env)
- **PORT**: `5002`
- **FRONTEND_URL**: `http://localhost:3000`
- **CORS Origin**: Configured for `http://localhost:3000`

## Connection Status

✅ **Configuration Match**: 
- Frontend points to backend port 5002 ✓
- Backend listens on port 5002 ✓
- CORS allows frontend origin ✓

## Testing Connection

### 1. Check if Backend is Running
```powershell
# Test backend health endpoint
Invoke-WebRequest -Uri "http://localhost:5002/health" -UseBasicParsing
```

### 2. Start Backend (if not running)
```powershell
cd backend
npm start
```

### 3. Start Frontend
```powershell
npm run dev
```

### 4. Verify Connection in Browser
- Open browser console (F12)
- Check for API calls to `http://localhost:5002`
- Look for CORS errors or connection errors

## Common Issues

### Issue 1: Backend Not Running
**Symptom**: Frontend shows "Backend offline" or connection errors
**Solution**: Start backend server with `cd backend && npm start`

### Issue 2: Port Mismatch
**Symptom**: Connection refused errors
**Solution**: Ensure:
- Frontend `.env` has `VITE_BACKEND_URL=http://localhost:5002`
- Backend `.env` has `PORT=5002`

### Issue 3: CORS Errors
**Symptom**: Browser console shows CORS policy errors
**Solution**: Update `backend/.env`:
```
FRONTEND_URL=http://localhost:3000
```
Or add your frontend URL to CORS_ORIGINS if using multiple origins.

### Issue 4: Firewall Blocking
**Symptom**: Connection timeout
**Solution**: 
- Check Windows Firewall settings
- Ensure port 5002 is not blocked
- Try disabling firewall temporarily to test

## Health Check Endpoint

The backend provides a health check at:
```
GET http://localhost:5002/health
```

Expected response:
```json
{
  "success": true,
  "status": "OK",
  "service": "Mission Exploit 2.0 Backend",
  "version": "2.0.0",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## API Configuration Files

- **Frontend API Config**: `src/config/api.ts`
- **Backend Server**: `backend/src/server.js`
- **Admin API**: `src/api/adminApi.ts`
- **Participant API**: `src/api/participantApi.ts`
- **Captain API**: `src/captain/api/captainApi.ts`

All APIs use `API_BASE_URL` from `src/config/api.ts`, which reads from `VITE_BACKEND_URL` environment variable.

