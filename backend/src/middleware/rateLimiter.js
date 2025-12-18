import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for flag submission endpoint
 * Prevents brute-force attacks
 */
export const flagSubmissionLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many flag submission attempts. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP + teamId for more granular rate limiting
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.teamId || 'unknown'}`;
  },
});

/**
 * Rate limiter for general API endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for admin endpoints
 */
export const adminLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 50, // 50 requests per minute
  message: {
    success: false,
    error: 'Too many admin requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


