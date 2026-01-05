import { getFirestore } from '../utils/firebase.js';

/**
 * Get Firestore database instance (lazy loaded)
 */
const getDb = () => getFirestore();

/**
 * Get level data by ID
 * @param {string} levelId - The level identifier
 * @returns {Promise<Object|null>}
 */
export const getLevel = async (levelId) => {
  try {
    const db = getDb();
    const doc = await db.collection('levels').doc(levelId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('[FirestoreService] Error fetching level:', error);
    return null;
  }
};

/**
 * Get team data by ID
 * @param {string} teamId - The team identifier
 * @returns {Promise<Object|null>}
 */
export const getTeam = async (teamId) => {
  try {
    const db = getDb();
    const doc = await db.collection('teams').doc(teamId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('[FirestoreService] Error fetching team:', error);
    return null;
  }
};

/**
 * Create a submission record
 * @param {Object} submissionData - The submission data
 * @returns {Promise<string>} - The submission ID
 */
export const createSubmission = async (submissionData) => {
  try {
    const db = getDb();
    const docRef = await db.collection('submissions').add({
      ...submissionData,
      submittedAt: Date.now(),
      id: null, // Will be updated below
    });
    
    // Update with the document ID
    await docRef.update({ id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('[FirestoreService] Error creating submission:', error);
    throw error;
  }
};

/**
 * Update team score and statistics
 * @param {string} teamId - The team identifier
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateTeam = async (teamId, updates) => {
  try {
    const db = getDb();
    const teamRef = db.collection('teams').doc(teamId);
    await teamRef.update({
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[FirestoreService] Error updating team:', error);
    throw error;
  }
};

/**
 * Update leaderboard entry
 * @param {string} teamId - The team identifier
 * @param {Object} data - Leaderboard data
 * @returns {Promise<void>}
 */
export const updateLeaderboard = async (teamId, data) => {
  try {
    const db = getDb();
    const leaderboardRef = db.collection('leaderboard').doc(teamId);
    
    // Ensure all required fields are present
    const leaderboardData = {
      ...data,
      id: teamId,
      lastSubmissionAt: data.lastSubmissionAt || Date.now(),
      // Ensure score is always a number (not undefined/null)
      score: data.score ?? 0,
      levelsCompleted: data.levelsCompleted ?? 0,
      totalTimePenalty: data.totalTimePenalty ?? 0,
    };
    
    await leaderboardRef.set(leaderboardData, { merge: true });
  } catch (error) {
    console.error('[FirestoreService] Error updating leaderboard:', error);
    throw error;
  }
};

/**
 * Sync leaderboard with team scores (utility function to fix any discrepancies)
 * @param {string} teamId - Optional team ID to sync, or null to sync all teams
 * @returns {Promise<void>}
 */
export const syncLeaderboard = async (teamId = null) => {
  try {
    const db = getDb();
    
    if (teamId) {
      // Sync single team
      const teamDoc = await db.collection('teams').doc(teamId).get();
      if (!teamDoc.exists) {
        throw new Error('Team not found');
      }
      
      const teamData = teamDoc.data();
      await updateLeaderboard(teamId, {
        teamName: teamData.name,
        groupId: teamData.groupId,
        score: teamData.score || 0,
        levelsCompleted: teamData.levelsCompleted || 0,
        totalTimePenalty: teamData.timePenalty || 0,
      });
    } else {
      // Sync all teams
      const teamsSnapshot = await db.collection('teams').get();
      const batch = db.batch();
      
      teamsSnapshot.docs.forEach((doc) => {
        const teamData = doc.data();
        const leaderboardRef = db.collection('leaderboard').doc(doc.id);
        
        batch.set(leaderboardRef, {
          id: doc.id,
          teamName: teamData.name || '',
          groupId: teamData.groupId || null,
          score: teamData.score || 0,
          levelsCompleted: teamData.levelsCompleted || 0,
          totalTimePenalty: teamData.timePenalty || 0,
          lastSubmissionAt: teamData.updatedAt || Date.now(),
        }, { merge: true });
      });
      
      await batch.commit();
      console.log(`[FirestoreService] Synced ${teamsSnapshot.size} teams to leaderboard`);
    }
  } catch (error) {
    console.error('[FirestoreService] Error syncing leaderboard:', error);
    throw error;
  }
};

/**
 * Increment team score
 * @param {string} teamId - The team identifier
 * @param {number} scoreToAdd - Score to add
 * @returns {Promise<void>}
 */
export const incrementTeamScore = async (teamId, scoreToAdd) => {
  try {
    const db = getDb();
    const teamRef = db.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      throw new Error('Team not found');
    }
    
    const currentScore = teamDoc.data().score || 0;
    const currentLevelsCompleted = teamDoc.data().levelsCompleted || 0;
    
    await teamRef.update({
      score: currentScore + scoreToAdd,
      levelsCompleted: currentLevelsCompleted + 1,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[FirestoreService] Error incrementing score:', error);
    throw error;
  }
};

/**
 * Get all submissions for a team
 * @param {string} teamId - The team identifier
 * @returns {Promise<Array>}
 */
export const getTeamSubmissions = async (teamId) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('submissions')
      .where('teamId', '==', teamId)
      .orderBy('submittedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('[FirestoreService] Error fetching submissions:', error);
    return [];
  }
};

/**
 * Get recent submissions (for monitoring)
 * @param {number} limit - Number of submissions to fetch
 * @returns {Promise<Array>}
 */
export const getRecentSubmissions = async (limit = 10) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('submissions')
      .orderBy('submittedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('[FirestoreService] Error fetching recent submissions:', error);
    return [];
  }
};


