import express from 'express';
import { z } from 'zod';
import {
  getGroupOverview,
  getTeamDetail,
  getSubmissionLogs,
  sendAnnouncement,
} from '../controllers/captainController.js';
import { validateRequest, verifyCaptain } from '../middleware/validateRequest.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply captain authentication to all routes
router.use(verifyCaptain);
router.use(generalLimiter);

/**
 * Zod schema for announcement
 */
const announcementSchema = z.object({
  message: z.string().min(1).max(500),
});

/**
 * GET /api/captain/group
 * Get captain's assigned group overview
 */
router.get('/group', getGroupOverview);

/**
 * GET /api/captain/team/:teamId
 * Get team detail (only if team belongs to captain's group)
 */
router.get('/team/:teamId', getTeamDetail);

/**
 * GET /api/captain/logs
 * Get submission logs for captain's group
 */
router.get('/logs', getSubmissionLogs);

/**
 * POST /api/captain/announce
 * Send announcement to captain's group
 */
router.post('/announce', validateRequest(announcementSchema), sendAnnouncement);

export default router;


