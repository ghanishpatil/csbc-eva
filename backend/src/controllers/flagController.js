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
    const { teamId, levelId, flag, timeTaken, captainId, participantId } = req.body;

    console.log(`[FlagController] Submission attempt - Team: ${teamId}, Level: ${levelId}`);

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

    // Get hint usage for this team/level
    const hintUsage = await getTeamHintUsage(teamId, levelId, db);
    const hintsUsed = hintUsage.length;

    // Calculate final score
    const scoring = calculateFinalScore({
      baseScore: level.basePoints,
      hintsUsed,
      pointDeduction: level.pointDeduction || 0,
      timeTaken: timeTaken || 0,
      timePenalty: level.timePenalty || 0,
      hintType: level.hintType || 'points',
    });

    // Create submission record
    const submissionId = await createSubmission({
      teamId,
      levelId,
      flag: null, // NEVER store the actual flag
      flagHash: null, // Don't even store the hash
      timeTaken: timeTaken || 0,
      hintsUsed,
      baseScore: scoring.baseScore,
      pointDeduction: scoring.pointDeduction,
      timePenalty: scoring.timePenalty,
      finalScore: scoring.finalScore,
      submittedBy: captainId || participantId || 'unknown',
    });

    // Update team score
    const newTeamScore = (team.score || 0) + scoring.finalScore;
    const newLevelsCompleted = (team.levelsCompleted || 0) + 1;
    const newTimePenalty = (team.timePenalty || 0) + scoring.timePenalty;

    // FIX 3: Enforce state machine - Update current level to next level (sequential progression)
    // State transition: SOLVING → MOVING (after successful flag submission)
    const nextLevelNumber = level.number + 1;

    await updateTeam(teamId, {
      score: newTeamScore,
      levelsCompleted: newLevelsCompleted,
      timePenalty: newTimePenalty,
      currentLevel: nextLevelNumber, // Unlock next level
      status: 'moving', // State transition: SOLVING → MOVING (team must move to next location)
    });

    // Update leaderboard
    await updateLeaderboard(teamId, {
      teamName: team.name,
      groupId: team.groupId,
      score: newTeamScore,
      levelsCompleted: newLevelsCompleted,
      totalTimePenalty: newTimePenalty,
    });

    console.log(`[FlagController] Score updated - Team: ${teamId}, +${scoring.finalScore} points`);

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


