import express from 'express';
import { z } from 'zod';
import { registerUser } from '../controllers/authController.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * Zod schema for user registration
 */
const registerSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  userData: z.object({
    email: z.string().email('Invalid email address'),
    displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
    phone: z.string().optional(),
    institute: z.string().optional(),
    branch: z.string().optional(),
    year: z.number().int().min(1).max(5).optional().nullable(),
    role: z.enum(['player', 'captain', 'admin']).optional(),
  }),
});

/**
 * POST /api/auth/register
 * Register a new user (create Firestore user document)
 * Public endpoint - requires Firebase ID token
 */
router.post('/register', generalLimiter, validateRequest(registerSchema), registerUser);

export default router;

