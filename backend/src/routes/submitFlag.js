import express from 'express';
import { z } from 'zod';
import { submitFlag, getTeamStats } from '../controllers/flagController.js';
import { validateRequest, requireEventActive } from '../middleware/validateRequest.js';
import { flagSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Zod schema for flag submission
 */
const submitFlagSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  levelId: z.string().min(1, 'Level ID is required'),
  flag: z.string().min(1, 'Flag is required').max(500, 'Flag too long'),
  timeTaken: z.number().min(0, 'Time must be positive').optional(),
  captainId: z.string().optional(),
  participantId: z.string().optional(),
}).refine((data) => data.captainId || data.participantId, {
  message: 'Either captainId or participantId is required',
});

/**
 * POST /api/submit-flag
 * Submit a flag for validation
 * Rate limited to 5 requests per minute per team
 */
/**
 * POST /api/submit-flag
 * Submit a flag for validation
 * FIX 4: Requires event to be active
 * FIX 1: QR check-in verification enforced in controller
 */
router.post(
  '/submit-flag',
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


