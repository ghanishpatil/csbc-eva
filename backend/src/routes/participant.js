import express from 'express';
import { z } from 'zod';
import {
  verifyCheckIn,
  getTeamStatus,
  getCurrentLevel,
  updateTeamStatus,
  requestHint,
} from '../controllers/participantController.js';
import {
  createTeam,
  joinTeam,
  getTeamDetails,
  leaveTeam,
} from '../controllers/teamController.js';
import { validateRequest, verifyParticipant } from '../middleware/validateRequest.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply participant authentication to all routes
router.use(verifyParticipant);

/**
 * Zod schema for QR check-in
 */
const checkInSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  levelId: z.string().min(1, 'Level ID is required'),
  qrCode: z.string().min(1, 'QR code is required'),
});

/**
 * Zod schema for updating team status
 */
const updateStatusSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  status: z.enum(['waiting', 'at_location', 'solving', 'moving'], {
    errorMap: () => ({ message: 'Status must be: waiting, at_location, solving, or moving' }),
  }),
});

/**
 * Zod schema for requesting a hint
 */
const requestHintSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  levelId: z.string().min(1, 'Level ID is required'),
});

/**
 * POST /api/participant/check-in
 * Verify QR code check-in for a team at a location
 */
router.post('/check-in', generalLimiter, validateRequest(checkInSchema), verifyCheckIn);

/**
 * GET /api/participant/status/:teamId
 * Get current team status (level, status, timer, etc.)
 */
router.get('/status/:teamId', generalLimiter, getTeamStatus);

/**
 * GET /api/participant/level/:teamId
 * Get current level details (only if checked in)
 */
router.get('/level/:teamId', generalLimiter, getCurrentLevel);

/**
 * POST /api/participant/update-status
 * FIX 2: BLOCKED - Participants cannot update team status directly
 * State transitions are managed automatically by backend
 */
router.post('/update-status', generalLimiter, updateTeamStatus);

/**
 * POST /api/participant/request-hint
 * Request a hint for the current level
 */
router.post('/request-hint', generalLimiter, validateRequest(requestHintSchema), requestHint);

/**
 * Zod schema for creating a team
 */
const createTeamSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters').max(50, 'Team name too long'),
  creatorId: z.string().min(1, 'Creator ID is required'),
});

/**
 * Zod schema for joining a team
 */
const joinTeamSchema = z.object({
  inviteCode: z.string().length(6, 'Invite code must be 6 characters'),
  participantId: z.string().min(1, 'Participant ID is required'),
});

/**
 * Zod schema for leaving a team
 */
const leaveTeamSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  participantId: z.string().min(1, 'Participant ID is required'),
});

/**
 * POST /api/participant/create-team
 * Create a new team
 */
router.post('/create-team', generalLimiter, validateRequest(createTeamSchema), createTeam);

/**
 * POST /api/participant/join-team
 * Join a team by invite code
 */
router.post('/join-team', generalLimiter, validateRequest(joinTeamSchema), joinTeam);

/**
 * GET /api/participant/team/:teamId
 * Get team details
 */
router.get('/team/:teamId', generalLimiter, getTeamDetails);

/**
 * POST /api/participant/leave-team
 * Leave a team
 */
router.post('/leave-team', generalLimiter, validateRequest(leaveTeamSchema), leaveTeam);

export default router;

