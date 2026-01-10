import express from 'express';
import { z } from 'zod';
import {
  submitManualFlag,
  getTeamManualSubmissions,
  approveSubmission,
  rejectSubmission,
  getAllManualSubmissions,
} from '../controllers/manualSubmissionsController.js';
import { validateRequest, verifyParticipant, verifyCaptain, verifyAdmin } from '../middleware/validateRequest.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Zod schema for manual flag submission
 */
const submitManualFlagSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required').max(100, 'Team ID too long'),
  levelId: z.string().min(1, 'Level ID is required').max(100, 'Level ID too long'),
  flag: z.string().min(1, 'Flag is required').max(500, 'Flag too long').regex(/^CSBC\{.+\}$/, 'Invalid flag format'),
});

/**
 * Zod schema for rejecting a submission
 */
const rejectSubmissionSchema = z.object({
  reason: z.string().max(500, 'Reason too long').optional(),
});

/**
 * POST /api/manual-submissions
 * Submit a manual flag for review
 * @access Participant
 */
router.post(
  '/',
  verifyParticipant,
  generalLimiter,
  validateRequest(submitManualFlagSchema),
  submitManualFlag
);

/**
 * GET /api/manual-submissions/team?teamId=xxx
 * Get manual submissions for a team
 * @access Participant (own team) or Captain (team in their group)
 * Note: Controller handles auth check for both roles
 */
router.get(
  '/team',
  generalLimiter,
  getTeamManualSubmissions
);

/**
 * POST /api/manual-submissions/:id/approve
 * Approve a manual submission
 * @access Captain (only for teams in their group)
 */
router.post(
  '/:id/approve',
  verifyCaptain,
  generalLimiter,
  approveSubmission
);

/**
 * POST /api/manual-submissions/:id/reject
 * Reject a manual submission
 * @access Captain (only for teams in their group)
 */
router.post(
  '/:id/reject',
  verifyCaptain,
  generalLimiter,
  validateRequest(rejectSubmissionSchema),
  rejectSubmission
);


export default router;
