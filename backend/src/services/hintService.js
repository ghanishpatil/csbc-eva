/**
 * Get hints for a specific level
 * @param {string} levelId - The level identifier
 * @param {Object} db - Firestore instance
 * @returns {Promise<Array>} - Array of hints
 */
export const getLevelHints = async (levelId, db) => {
  try {
    const levelDoc = await db.collection('levels').doc(levelId).get();
    
    if (!levelDoc.exists) {
      return [];
    }
    
    const levelData = levelDoc.data();
    return levelData.hints || [];
  } catch (error) {
    console.error('[HintService] Error fetching hints:', error);
    return [];
  }
};

/**
 * Get hint usage for a team on a specific level
 * @param {string} teamId - The team identifier
 * @param {string} levelId - The level identifier
 * @param {Object} db - Firestore instance
 * @returns {Promise<Array>} - Array of hint usage records
 */
export const getTeamHintUsage = async (teamId, levelId, db) => {
  try {
    const hintsRef = db.collection('hint_usage'); // Fixed: Use consistent collection name
    const snapshot = await hintsRef
      .where('teamId', '==', teamId)
      .where('levelId', '==', levelId)
      .orderBy('usedAt', 'asc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('[HintService] Error fetching hint usage:', error);
    return [];
  }
};

/**
 * Calculate hint penalty for a team
 * @param {Array} hintUsage - Array of hint usage records
 * @param {Object} level - Level data containing hint configuration
 * @returns {Object} - Penalty information
 */
export const calculateHintPenalty = (hintUsage, level) => {
  if (!hintUsage || hintUsage.length === 0) {
    return {
      pointsPenalty: 0,
      timePenalty: 0,
      hintsUsed: 0,
    };
  }
  
  const hintsUsed = hintUsage.length;
  
  if (level.hintType === 'points') {
    return {
      pointsPenalty: hintsUsed * (level.pointDeduction || 0),
      timePenalty: 0,
      hintsUsed,
    };
  } else if (level.hintType === 'time') {
    return {
      pointsPenalty: 0,
      timePenalty: hintsUsed * (level.timePenalty || 0),
      hintsUsed,
    };
  }
  
  return {
    pointsPenalty: 0,
    timePenalty: 0,
    hintsUsed: 0,
  };
};

/**
 * Check if team can request another hint
 * @param {string} teamId - The team identifier
 * @param {string} levelId - The level identifier
 * @param {Object} db - Firestore instance
 * @returns {Promise<{canRequest: boolean, hintsUsed: number, hintsAvailable: number}>}
 */
export const canRequestHint = async (teamId, levelId, db) => {
  try {
    // Get level data
    const levelDoc = await db.collection('levels').doc(levelId).get();
    if (!levelDoc.exists) {
      return { canRequest: false, hintsUsed: 0, hintsAvailable: 0 };
    }
    
    const levelData = levelDoc.data();
    const hintsAvailable = levelData.hintsAvailable || 0;
    
    // Get hint usage
    const hintUsage = await getTeamHintUsage(teamId, levelId, db);
    const hintsUsed = hintUsage.length;
    
    return {
      canRequest: hintsUsed < hintsAvailable,
      hintsUsed,
      hintsAvailable,
    };
  } catch (error) {
    console.error('[HintService] Error checking hint availability:', error);
    return { canRequest: false, hintsUsed: 0, hintsAvailable: 0 };
  }
};


