import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import initializeFirebase from './utils/firebase.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/validateRequest.js';

// Import routes
import submitFlagRoutes from './routes/submitFlag.js';
import adminRoutes from './routes/admin.js';
import captainRoutes from './routes/captain.js';
import participantRoutes from './routes/participant.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
} catch (error) {
  console.error('[Server] Failed to initialize Firebase:', error.message);
  process.exit(1);
}

// Initialize Express app
const app = express();
// Railway provides PORT; use it directly so we don't conflict with the platform
const PORT = Number(process.env.PORT);
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// General rate limiting
app.use('/api/', generalLimiter);
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'Mission Exploit 2.0 Backend',
    version: '2.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API info endpoint
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mission Exploit 2.0 API',
    version: '2.0.0',
    endpoints: {
      flagSubmission: 'POST /api/submit-flag',
      teamStats: 'GET /api/team/:teamId/stats',
      adminUpdateLevel: 'POST /api/admin/update-level',
      adminSetFlag: 'POST /api/admin/set-flag',
      adminUpdateScore: 'POST /api/admin/update-score',
      adminStats: 'GET /api/admin/stats',
      adminActivity: 'GET /api/admin/recent-activity',
      adminReset: 'POST /api/admin/reset-competition',
      captainGroup: 'GET /api/captain/group',
      captainTeam: 'GET /api/captain/team/:teamId',
      captainLogs: 'GET /api/captain/logs',
      captainAnnounce: 'POST /api/captain/announce',
      participantCheckIn: 'POST /api/participant/check-in',
      participantStatus: 'GET /api/participant/status/:teamId',
      participantLevel: 'GET /api/participant/level/:teamId',
      participantUpdateStatus: 'POST /api/participant/update-status',
      participantRequestHint: 'POST /api/participant/request-hint',
      participantCreateTeam: 'POST /api/participant/create-team',
      participantJoinTeam: 'POST /api/participant/join-team',
      participantGetTeam: 'GET /api/participant/team/:teamId',
      participantLeaveTeam: 'POST /api/participant/leave-team',
    },
    documentation: 'https://github.com/csbc/mission-exploit-2.0',
  });
});

/**
 * Mount routes
 */

// Root route used by deployment platforms (e.g. Railway) for health checks
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
  });
});

app.use('/api', submitFlagRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/captain', captainRoutes);
app.use('/api/participant', participantRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = NODE_ENV === 'development' ? err.message : 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MISSION EXPLOIT 2.0 - SECURE BACKEND');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⚡ Firebase project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 5} requests/min`);
  console.log('='.repeat(60));
  console.log('\n✅ Server is ready to accept requests\n');
});

// Graceful shutdown logging (do not force-exit; let the platform manage lifecycle)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received');
});

export default app;


