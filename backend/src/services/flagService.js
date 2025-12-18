import { compareHash, validateFlagFormat } from '../utils/cryptoUtils.js';
import { getFirestore } from '../utils/firebase.js';

/**
 * Get the stored flag hash for a specific level from Firestore
 * @param {string} levelId - The level identifier
 * @returns {Promise<string|null>} - The flag hash or null if not found
 */
export const getFlagHash = async (levelId) => {
  try {
    const db = getFirestore();
    const flagDoc = await db.collection('flag_hashes').doc(levelId).get();
    
    if (!flagDoc.exists) {
      console.warn(`[FlagService] No flag hash found for level: ${levelId}`);
      return null;
    }
    
    const data = flagDoc.data();
    return data.flagHash || null;
  } catch (error) {
    console.error(`[FlagService] Error getting flag hash for ${levelId}:`, error);
    return null;
  }
};

/**
 * Validate a submitted flag against the stored hash
 * @param {string} submittedFlag - The flag submitted by the team
 * @param {string} levelId - The level identifier
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
export const validateFlag = async (submittedFlag, levelId) => {
  try {
    // Validate flag format
    if (!validateFlagFormat(submittedFlag)) {
      return {
        isValid: false,
        error: 'Invalid flag format. Expected: CSBC{...}',
      };
    }
    
    // Get the correct flag hash for this level
    const correctHash = await getFlagHash(levelId);
    
    if (!correctHash) {
      console.error(`[FlagService] No hash found for level: ${levelId}`);
      return {
        isValid: false,
        error: 'Level configuration error',
      };
    }
    
    // Compare hashes (constant-time to prevent timing attacks)
    const isValid = compareHash(submittedFlag, correctHash);
    
    // Add artificial delay to prevent timing analysis
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
    
    return {
      isValid,
      error: isValid ? null : 'Incorrect flag',
    };
  } catch (error) {
    console.error('[FlagService] Validation error:', error);
    return {
      isValid: false,
      error: 'Validation failed',
    };
  }
};

/**
 * Check if a team has already submitted this level
 * @param {string} teamId - The team identifier
 * @param {string} levelId - The level identifier
 * @param {Object} db - Firestore instance
 * @returns {Promise<boolean>}
 */
export const hasAlreadySubmitted = async (teamId, levelId, db) => {
  try {
    const submissionsRef = db.collection('submissions');
    const snapshot = await submissionsRef
      .where('teamId', '==', teamId)
      .where('levelId', '==', levelId)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('[FlagService] Error checking submissions:', error);
    return false;
  }
};

/**
 * Get all flag hashes (for admin purposes only)
 * @returns {Object} - Object with level numbers as keys and hashes as values
 */
export const getAllFlagHashes = () => {
  const hashes = {};
  
  for (let i = 1; i <= 20; i++) {
    const envKey = `LEVEL_${i}_FLAG_HASH`;
    if (process.env[envKey]) {
      hashes[i] = process.env[envKey];
    }
  }
  
  return hashes;
};


