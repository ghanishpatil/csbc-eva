import express from 'express';
import { z } from 'zod';
import { startMission } from '../controllers/participantController.js';
import { validateRequest, verifyParticipant } from '../middleware/validateRequest.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply participant authentication to all routes
router.use(verifyParticipant);

/**
 * Zod schema for starting a mission
 */
const startMissionSchema = z.object({
  qrData: z.string().min(1, 'QR code data is required'),
});

/**
 * POST /api/mission/start
 * Start a mission challenge by scanning QR code
 * Backend validates QR, group, sequential order, and starts timer
 */
router.post('/start', generalLimiter, validateRequest(startMissionSchema), startMission);

export default router;

