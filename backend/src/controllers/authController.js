import { getFirestore, getAuth } from '../utils/firebase.js';

/**
 * Register a new user (create Firestore user document)
 * @route POST /api/auth/register
 * SECURITY: Requires valid Firebase ID token
 */
export const registerUser = async (req, res) => {
  try {
    const { idToken, userData } = req.body;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: 'ID token is required',
      });
    }

    if (!userData || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'User data with email is required',
      });
    }

    // Verify the ID token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[AuthController] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const userId = decodedToken.uid;
    const db = getFirestore();

    // Check if user document already exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Create user document in Firestore (using Admin SDK, bypasses security rules)
    const now = Date.now();
    await db.collection('users').doc(userId).set({
      id: userId,
      email: userData.email,
      displayName: userData.displayName || '',
      phone: userData.phone || '',
      institute: userData.institute || '',
      branch: userData.branch || '',
      year: userData.year || null,
      role: userData.role || 'player',
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[AuthController] User registered - ID: ${userId}, Email: ${userData.email}`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: userId,
    });
  } catch (error) {
    console.error('[AuthController] Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
};

