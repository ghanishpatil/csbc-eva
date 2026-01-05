import express from 'express';
import { z } from 'zod';
import { submitFlag, getTeamStats } from '../controllers/flagController.js';
import { validateRequest, requireEventActive, verifyParticipant } from '../middleware/validateRequest.js';
import { flagSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Zod schema for flag submission
 * SECURITY: Removed timeTaken from client input - will be calculated server-side
 */
const submitFlagSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required').max(100, 'Team ID too long'),
  levelId: z.string().min(1, 'Level ID is required').max(100, 'Level ID too long'),
  flag: z.string().min(1, 'Flag is required').max(500, 'Flag too long').regex(/^CSBC\{.+\}$/, 'Invalid flag format'),
  // timeTaken removed - will be calculated server-side from check-in time
});

/**
 * POST /api/submit-flag
 * Submit a flag for validation
 * SECURITY: Requires authentication and verifies team ownership
 * Rate limited to 5 requests per minute per team
 */
router.post(
  '/submit-flag',
  verifyParticipant, // CRITICAL: Require authentication
  flagSubmissionLimiter,
  requireEventActive,
  validateRequest(submitFlagSchema),
  submitFlag
);

/**
 * GET /api/team/:teamId/stats
 * Get statistics for a specific team
 */
router.get('/team/:teamId/stats', getTeamStats);

export default router;


