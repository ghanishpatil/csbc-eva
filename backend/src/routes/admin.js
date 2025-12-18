import express from 'express';
import { z } from 'zod';
import {
  updateLevel,
  createLevel,
  deleteLevel,
  setFlag,
  updateScore,
  createTeam,
  updateTeamController,
  deleteTeam,
  createGroup,
  updateGroup,
  deleteGroup,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getPlatformStats,
  getRecentActivity,
  resetCompetition,
  startEventController,
  stopEventController,
  pauseEventController,
  getEventStatusController,
  impersonateUser,
} from '../controllers/adminController.js';
import { validateRequest, verifyAdmin } from '../middleware/validateRequest.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyAdmin);
router.use(adminLimiter);

/**
 * Zod schema for level updates
 */
const updateLevelSchema = z.object({
  levelId: z.string().min(1),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    basePoints: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    hintsAvailable: z.number().min(0).optional(),
    pointDeduction: z.number().min(0).optional(),
    timePenalty: z.number().min(0).optional(),
  }),
});

/**
 * Zod schema for setting flag
 */
const setFlagSchema = z.object({
  levelId: z.string().min(1),
  flag: z.string().min(1).max(500),
});

/**
 * Zod schema for score updates
 */
const updateScoreSchema = z.object({
  teamId: z.string().min(1),
  scoreChange: z.number(),
  reason: z.string().optional(),
});

/**
 * Zod schema for reset confirmation
 */
const resetCompetitionSchema = z.object({
  confirmationCode: z.string().min(1),
});

/**
 * POST /api/admin/update-level
 * Update level configuration
 */
router.post('/update-level', validateRequest(updateLevelSchema), updateLevel);

/**
 * POST /api/admin/set-flag
 * Set flag hash for a level (SECURE - flag is hashed server-side)
 */
router.post('/set-flag', validateRequest(setFlagSchema), setFlag);

/**
 * POST /api/admin/update-score
 * Manually adjust team score
 */
router.post('/update-score', validateRequest(updateScoreSchema), updateScore);

/**
 * GET /api/admin/stats
 * Get platform-wide statistics
 */
router.get('/stats', getPlatformStats);

/**
 * GET /api/admin/recent-activity
 * Get recent submissions and activity
 */
router.get('/recent-activity', getRecentActivity);

/**
 * POST /api/admin/reset-competition
 * Reset all competition data
 */
router.post(
  '/reset-competition',
  validateRequest(resetCompetitionSchema),
  resetCompetition
);

/**
 * POST /api/admin/start-event
 * Start the event (FIX 4: Event control)
 */
router.post('/start-event', startEventController);

/**
 * POST /api/admin/stop-event
 * Stop the event (FIX 4: Event control)
 */
router.post('/stop-event', stopEventController);

/**
 * POST /api/admin/pause-event
 * Pause the event (FIX 4: Event control)
 */
router.post('/pause-event', pauseEventController);

/**
 * GET /api/admin/event-status
 * Get current event status (FIX 4: Event control)
 */
router.get('/event-status', getEventStatusController);

/**
 * POST /api/admin/create-level
 * Create a new level
 */
router.post('/create-level', createLevel);

/**
 * DELETE /api/admin/level/:levelId
 * Delete a level
 */
router.delete('/level/:levelId', deleteLevel);

/**
 * POST /api/admin/create-team
 * Create a new team
 */
router.post('/create-team', createTeam);

/**
 * POST /api/admin/update-team
 * Update a team
 */
router.post('/update-team', updateTeamController);

/**
 * DELETE /api/admin/team/:teamId
 * Delete a team
 */
router.delete('/team/:teamId', deleteTeam);

/**
 * POST /api/admin/create-group
 * Create a new group
 */
router.post('/create-group', createGroup);

/**
 * POST /api/admin/update-group
 * Update a group
 */
router.post('/update-group', updateGroup);

/**
 * DELETE /api/admin/group/:groupId
 * Delete a group
 */
router.delete('/group/:groupId', deleteGroup);

/**
 * POST /api/admin/create-announcement
 * Create an announcement
 */
router.post('/create-announcement', createAnnouncement);

/**
 * POST /api/admin/update-announcement
 * Update an announcement
 */
router.post('/update-announcement', updateAnnouncement);

/**
 * DELETE /api/admin/announcement/:announcementId
 * Delete an announcement
 */
router.delete('/announcement/:announcementId', deleteAnnouncement);

/**
 * POST /api/admin/impersonate-user
 * Generate a custom token to login as another user (captains/players only)
 */
router.post('/impersonate-user', impersonateUser);

export default router;


