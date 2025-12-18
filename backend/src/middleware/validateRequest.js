import { z } from 'zod';
import { getFirestore } from '../utils/firebase.js';
import admin from 'firebase-admin';

/**
 * Middleware factory for validating request bodies using Zod schemas
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} - Express middleware function
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
      });
    }
  };
};

/**
 * Middleware to verify admin authentication using Firebase ID token
 * SECURITY: All admin operations require valid Firebase ID token with admin role
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }

    const userId = decodedToken.uid;
    const db = getFirestore();

    // Get user document to verify role
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User is not an admin',
      });
    }

    // Attach admin info to request
    req.admin = {
      userId,
      userData,
    };

    next();
  } catch (error) {
    console.error('[AdminMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Middleware to verify captain authentication and get assigned group
 * STRICT: Captains can only access their assigned group
 */
export const verifyCaptain = async (req, res, next) => {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }

    const userId = decodedToken.uid;
    const db = getFirestore();

    // Get user document to verify role
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
    }

    const userData = userDoc.data();
    if (userData.role !== 'captain') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User is not a captain',
      });
    }

    // Get captain's assigned group
    const groupQuery = await db.collection('groups')
      .where('captainId', '==', userId)
      .limit(1)
      .get();

    if (groupQuery.empty) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Captain not assigned to any group',
      });
    }

    const groupDoc = groupQuery.docs[0];
    const groupId = groupDoc.id;
    const groupData = groupDoc.data();

    // Attach captain info to request
    req.captain = {
      userId,
      groupId,
      groupData,
    };

    next();
  } catch (error) {
    console.error('[CaptainMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Middleware to verify event is active (blocks access if event not started)
 * Must be applied to participant routes
 */
export const requireEventActive = async (req, res, next) => {
  try {
    const { getEventStatus } = await import('../services/eventService.js');
    const eventStatus = await getEventStatus();
    
    if (!eventStatus.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Event has not started yet. Please wait for the event to begin.',
      });
    }
    
    next();
  } catch (error) {
    console.error('[EventMiddleware] Error checking event status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify event status',
    });
  }
};

/**
 * Middleware to verify user authentication using Firebase ID token
 * SECURITY: All participant operations require valid Firebase ID token
 * NOTE: Any authenticated user can access participant routes (data is scoped by teamId)
 */
export const verifyParticipant = async (req, res, next) => {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }

    const userId = decodedToken.uid;
    const db = getFirestore();

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
    }

    const userData = userDoc.data();

    // Attach user info to request
    req.participant = {
      userId,
      userData,
    };

    next();
  } catch (error) {
    console.error('[ParticipantMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Middleware to log requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });
  
  next();
};

