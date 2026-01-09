import { validateFlag, hasAlreadySubmitted } from '../services/flagService.js';
import { calculateFinalScore } from '../services/scoringService.js';
import { getTeamHintUsage } from '../services/hintService.js';
import {
  getLevel,
  getTeam,
  createSubmission,
  updateTeam,
  updateLeaderboard,
} from '../services/firestoreService.js';
import { getFirestore } from '../utils/firebase.js';
import { getEventStatus } from '../services/eventService.js';

/**
 * Handle flag submission
 * @route POST /api/submit-flag
 */
export const submitFlag = async (req, res) => {
  try {
    const { teamId, levelId, flag } = req.body;
    
    // CRITICAL SECURITY: Verify user is authenticated and belongs to the team
    const userId = req.participant?.userId;
    const userData = req.participant?.userData;
    
    if (!userId || !userData) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    // CRITICAL SECURITY: Verify user belongs to the team they're submitting for
    if (userData.teamId !== teamId) {
      console.warn(`[FlagController] SECURITY: User ${userId} attempted to submit flag for team ${teamId}, but belongs to team ${userData.teamId || 'none'}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only submit flags for your own team',
      });
    }

    console.log(`[FlagController] Submission attempt - Team: ${teamId}, Level: ${levelId}, User: ${userId}`);

    // FIX 4: Verify event is active
    const eventStatus = await getEventStatus();
    if (!eventStatus.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Event has not started yet. Flag submissions are not allowed.',
      });
    }

    // Check if already submitted
    const db = getFirestore();
    const alreadySubmitted = await hasAlreadySubmitted(teamId, levelId, db);
    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        error: 'This level has already been completed by your team',
      });
    }

    // Get team data first
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // CRITICAL: Verify team has a groupId
    if (!team.groupId) {
      return res.status(400).json({
        success: false,
        error: 'Team is not assigned to a group',
      });
    }

    // Get level data
    const level = await getLevel(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Level not found',
      });
    }

    if (!level.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This level is not currently active',
      });
    }

    // CRITICAL: Verify level belongs to team's group (GROUP-SCOPED MISSION)
    if (level.groupId && level.groupId !== team.groupId) {
      return res.status(403).json({
        success: false,
        error: 'This level does not belong to your group. You cannot submit flags for it.',
      });
    }

    // CRITICAL: Verify team has checked in at this location (QR check-in required)
    const checkInRef = db.collection('check_ins').doc(`${teamId}_${levelId}`);
    const checkInDoc = await checkInRef.get();
    if (!checkInDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'You must check in at the location first before submitting flags',
      });
    }

    // CRITICAL SECURITY: Calculate timeTaken server-side from check-in time (prevents client manipulation)
    const checkInData = checkInDoc.data();
    const checkInTime = checkInData.checkedInAt || Date.now();
    const timeTaken = Math.max(0, Math.floor((Date.now() - checkInTime) / 60000)); // Time in minutes

    // CRITICAL: Verify team is at correct sequential level
    if (team.currentLevel !== level.number) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit flags for your current level. Complete previous levels first.',
      });
    }

    // CRITICAL: Verify team state allows submission (must be SOLVING)
    if (team.status !== 'solving') {
      return res.status(403).json({
        success: false,
        error: 'Invalid team state for flag submission. You must be actively solving the challenge (status: solving).',
      });
    }

    // Validate flag
    const { isValid, error: validationError } = await validateFlag(flag, levelId);

    if (!isValid) {
      // Log failed attempt (for security monitoring)
      console.log(`[FlagController] Invalid flag attempt - Team: ${teamId}, Level: ${levelId}`);
      
      return res.status(200).json({
        success: false,
        status: 'incorrect',
        message: validationError || 'Incorrect flag',
      });
    }

    // Flag is correct - calculate score
    console.log(`[FlagController] Correct flag - Team: ${teamId}, Level: ${levelId}`);

    // Get hint usage for this team/level (server-side verification)
    const hintUsage = await getTeamHintUsage(teamId, levelId, db);
    const hintsUsed = hintUsage.length;

    // CRITICAL SECURITY: Validate scoring parameters to prevent manipulation
    const baseScore = typeof level.basePoints === 'number' && level.basePoints >= 0 ? level.basePoints : 0;
    const pointDeduction = typeof level.pointDeduction === 'number' && level.pointDeduction >= 0 ? level.pointDeduction : 0;
    const timePenalty = typeof level.timePenalty === 'number' && level.timePenalty >= 0 ? level.timePenalty : 0;
    const hintType = level.hintType === 'points' || level.hintType === 'time' ? level.hintType : 'points';

    // Calculate final score (all inputs validated server-side)
    const scoring = calculateFinalScore({
      baseScore,
      hintsUsed,
      pointDeduction,
      timeTaken, // Server-calculated, not from client
      timePenalty,
      hintType,
    });

    // CRITICAL FIX: Use Firestore transaction with unique document ID to prevent duplicate submissions
    // Using teamId_levelId as document ID ensures uniqueness and atomic duplicate prevention
    const nextLevelNumber = level.number + 1;
    const submissionId = `${teamId}_${levelId}`; // Unique document ID prevents duplicates
    let finalTeamScore;
    let finalLevelsCompleted;
    let finalTimePenalty;

    // CRITICAL: Use transaction with unique document ID to prevent duplicate submissions atomically
    try {
      await db.runTransaction(async (transaction) => {
        // CRITICAL: Check if submission already exists (atomic check within transaction)
        const submissionRef = db.collection('submissions').doc(submissionId);
        const submissionDoc = await transaction.get(submissionRef);
        
        if (submissionDoc.exists) {
          throw new Error('DUPLICATE_SUBMISSION: This level has already been completed by your team');
        }

        // Re-fetch team data within transaction to get latest score (prevents race conditions)
        const teamRef = db.collection('teams').doc(teamId);
        const teamDoc = await transaction.get(teamRef);
        
        if (!teamDoc.exists) {
          throw new Error('Team not found during transaction');
        }

        const currentTeamData = teamDoc.data();
        
        // CRITICAL: Calculate new scores based on CURRENT team data (prevents double counting)
        // This ensures if the transaction retries, it uses the latest score
        finalTeamScore = (currentTeamData.score || 0) + scoring.finalScore;
        finalLevelsCompleted = (currentTeamData.levelsCompleted || 0) + 1;
        finalTimePenalty = (currentTeamData.timePenalty || 0) + scoring.timePenalty;

        // Create submission record with unique ID (prevents duplicate creation)
        // Using teamId_levelId ensures only one submission per team per level
        transaction.set(submissionRef, {
          id: submissionId,
          teamId,
          levelId,
          flag: null, // NEVER store the actual flag
          flagHash: null, // Don't even store the hash
          timeTaken, // Server-calculated time
          hintsUsed,
          baseScore: scoring.baseScore,
          pointDeduction: scoring.pointDeduction,
          timePenalty: scoring.timePenalty,
          finalScore: scoring.finalScore,
          submittedBy: userId, // Use authenticated user ID
          submittedAt: Date.now(),
          scoreProcessed: true, // Flag to indicate backend already processed the score
          // SECURITY: Audit trail
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });

        // Update team score atomically
        transaction.update(teamRef, {
          score: finalTeamScore,
          levelsCompleted: finalLevelsCompleted,
          timePenalty: finalTimePenalty,
          currentLevel: nextLevelNumber, // Unlock next level
          status: 'moving', // State transition: SOLVING → MOVING
          updatedAt: Date.now(),
        });

        // Update leaderboard atomically
        const leaderboardRef = db.collection('leaderboard').doc(teamId);
        transaction.set(leaderboardRef, {
          id: teamId,
          teamName: team.name,
          groupId: team.groupId,
          score: finalTeamScore,
          levelsCompleted: finalLevelsCompleted,
          totalTimePenalty: finalTimePenalty,
          lastSubmissionAt: Date.now(),
        }, { merge: true });
      });
    } catch (transactionError) {
      // Handle duplicate submission error gracefully
      if (transactionError.message && transactionError.message.includes('DUPLICATE_SUBMISSION')) {
        return res.status(400).json({
          success: false,
          status: 'already_completed',
          message: 'This level has already been completed by your team',
          error: 'This level has already been completed by your team',
        });
      }
      // Re-throw other errors to be handled by outer catch block
      throw transactionError;
    }

    // SECURITY: Comprehensive audit logging
    console.log(`[FlagController] Score updated - Team: ${teamId}, Level: ${levelId}, User: ${userId}, Score: +${scoring.finalScore} points, Time: ${timeTaken}min, Hints: ${hintsUsed}`);

    // Get next level's location clue if available
    // CRITICAL: Scope by (groupId + level number) for group-specific missions
    let nextLocationClue = null;
    if (nextLevelNumber && team.groupId) {
      const nextLevelsSnapshot = await db
        .collection('levels')
        .where('groupId', '==', team.groupId)
        .where('number', '==', nextLevelNumber)
        .limit(1)
        .get();
      
      if (!nextLevelsSnapshot.empty) {
        const nextLevelData = nextLevelsSnapshot.docs[0].data();
        nextLocationClue = nextLevelData.locationClue || null;
      }
    }

    // Return success (without revealing any flag information)
    return res.status(200).json({
      success: true,
      status: 'correct',
      scoreAwarded: scoring.finalScore,
      breakdown: {
        baseScore: scoring.baseScore,
        hintsUsed,
        pointDeduction: scoring.pointDeduction,
        timePenalty: scoring.timePenalty,
        finalScore: scoring.finalScore,
      },
      submissionId,
      nextLevel: nextLevelNumber, // Next level number
      nextLocationClue: nextLocationClue || null, // Location clue for next level
    });
  } catch (error) {
    console.error('[FlagController] Submission error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Submission processing failed',
    });
  }
};

/**
 * Get submission statistics for a team
 * @route GET /api/team/:teamId/stats
 */
export const getTeamStats = async (req, res) => {
  try {
    const { teamId } = req.params;

    const db = getFirestore();
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const submissions = await db
      .collection('submissions')
      .where('teamId', '==', teamId)
      .get();

    const stats = {
      teamName: team.name,
      score: team.score || 0,
      levelsCompleted: team.levelsCompleted || 0,
      timePenalty: team.timePenalty || 0,
      totalSubmissions: submissions.size,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[FlagController] Stats error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};


