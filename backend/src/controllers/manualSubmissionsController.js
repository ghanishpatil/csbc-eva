import admin from 'firebase-admin';
import { getFirestore } from '../utils/firebase.js';
import { getLevel, getTeam, updateTeam, updateLeaderboard } from '../services/firestoreService.js';
import { calculateFinalScore } from '../services/scoringService.js';
import { getTeamHintUsage } from '../services/hintService.js';
import { getEventStatus } from '../services/eventService.js';

/**
 * Submit a manual flag for review
 * @route POST /api/manual-submissions
 * @access Participant
 */
export const submitManualFlag = async (req, res) => {
  try {
    const { teamId, levelId, flag } = req.body;
    const userId = req.participant?.userId;
    const userData = req.participant?.userData;

    if (!userId || !userData) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    // Verify user belongs to the team
    if (userData.teamId !== teamId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only submit flags for your own team',
      });
    }

    if (!teamId || !levelId || !flag) {
      return res.status(400).json({
        success: false,
        error: 'Team ID, Level ID, and flag are required',
      });
    }

    // Validate flag format
    if (!flag.startsWith('CSBC{') || !flag.endsWith('}')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flag format. Expected: CSBC{...}',
      });
    }

    // SECURITY: Verify event is active
    const eventStatus = await getEventStatus();
    if (!eventStatus.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Event has not started yet. Manual flag submissions are not allowed.',
      });
    }

    const db = getFirestore();

    // Verify team exists
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // SECURITY: Verify team has a groupId
    if (!team.groupId) {
      return res.status(400).json({
        success: false,
        error: 'Team is not assigned to a group',
      });
    }

    // Verify level exists
    const level = await getLevel(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Level not found',
      });
    }

    // SECURITY: Verify level is active
    if (!level.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This level is not currently active',
      });
    }

    // SECURITY: Verify level belongs to team's group
    if (level.groupId && level.groupId !== team.groupId) {
      return res.status(403).json({
        success: false,
        error: 'This level does not belong to your group. You cannot submit flags for it.',
      });
    }

    // SECURITY: Verify team is at correct sequential level
    if (team.currentLevel !== level.number) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit flags for your current level. Complete previous levels first.',
      });
    }

    // Get participant name
    const participantName = userData.name || userData.email || 'Unknown';

    // SECURITY: Use transaction to atomically check and create submission (prevents race conditions)
    const submissionId = `manual_${teamId}_${levelId}`;
    const submissionRef = db.collection('manual_submissions').doc(submissionId);
    
    try {
      await db.runTransaction(async (transaction) => {
        // Check if team has already completed this level
        const existingSubmissionRef = db.collection('submissions').doc(`${teamId}_${levelId}`);
        const existingSubmission = await transaction.get(existingSubmissionRef);
        
        if (existingSubmission.exists && existingSubmission.data().status === 'correct') {
          throw new Error('DUPLICATE: This level has already been completed by your team');
        }

        // Check if there's already a pending manual submission (atomic check)
        const pendingSubmission = await transaction.get(submissionRef);
        if (pendingSubmission.exists) {
          const pendingData = pendingSubmission.data();
          if (pendingData.status === 'pending') {
            throw new Error('DUPLICATE: You already have a pending submission for this level. Please wait for review.');
          }
        }

        // Create manual submission record atomically
        transaction.set(submissionRef, {
          id: submissionId,
          teamId,
          teamName: team.name,
          levelId,
          levelTitle: level.title || `Level ${level.levelNumber || 'N/A'}`,
          flag, // Store the actual flag for captain review
          submittedBy: userId,
          submittedByName: participantName,
          submittedAt: Date.now(),
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          decision: null,
          // Audit trail
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });
      });
    } catch (error) {
      if (error.message.startsWith('DUPLICATE:')) {
        return res.status(400).json({
          success: false,
          error: error.message.replace('DUPLICATE: ', ''),
        });
      }
      throw error; // Re-throw other errors
    }

    console.log(`[ManualSubmissions] New manual submission created: ${submissionId} by ${userId} for team ${teamId}, level ${levelId}`);

    return res.status(201).json({
      success: true,
      message: 'Flag submitted for review',
      data: {
        submissionId,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('[ManualSubmissions] Submit error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit flag for review',
    });
  }
};

/**
 * Get manual submissions for a team
 * @route GET /api/manual-submissions/team
 * @access Participant (own team) or Captain (team in their group)
 */
export const getTeamManualSubmissions = async (req, res) => {
  try {
    const { teamId } = req.query;
    
    // Check authentication - must be either participant or captain
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
      });
    }

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required',
      });
    }

    const db = getFirestore();
    
    // Verify token and get user
    const idToken = authHeader.split('Bearer ')[1];
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
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
    }

    const userData = userDoc.data();
    const isParticipant = userData.role === 'player';
    const isCaptain = userData.role === 'captain';

    if (!isParticipant && !isCaptain) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Must be a participant or captain',
      });
    }

    // If participant, verify they belong to the team
    if (isParticipant && userData.teamId !== teamId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only view submissions for your own team',
      });
    }

    // If captain, verify team belongs to their group
    if (isCaptain) {
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

      const groupId = groupQuery.docs[0].id;
      const team = await getTeam(teamId);
      if (!team || team.groupId !== groupId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Team does not belong to your group',
        });
      }
    }

    // Fetch manual submissions for the team
    // Note: Removing orderBy temporarily to avoid index requirement
    // After deploying indexes, this can be optimized with orderBy in query
    const submissionsSnapshot = await db.collection('manual_submissions')
      .where('teamId', '==', teamId)
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)); // Sort in memory

    return res.status(200).json({
      success: true,
      data: {
        submissions,
        count: submissions.length,
      },
    });
  } catch (error) {
    console.error('[ManualSubmissions] Get team submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  }
};

/**
 * Approve a manual submission
 * @route POST /api/manual-submissions/:id/approve
 * @access Captain (only for teams in their group)
 */
export const approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const captain = req.captain;

    if (!captain) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only captains can approve submissions',
      });
    }

    const db = getFirestore();
    const submissionRef = db.collection('manual_submissions').doc(id);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    const submission = submissionDoc.data();

    // Verify submission is pending
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Submission has already been ${submission.status}`,
      });
    }

    // Verify team belongs to captain's group
    const team = await getTeam(submission.teamId);
    if (!team || team.groupId !== captain.groupId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Team does not belong to your group',
      });
    }

    // Get captain's user data for name
    const captainUserDoc = await db.collection('users').doc(captain.userId).get();
    const captainName = captainUserDoc.exists 
      ? (captainUserDoc.data().name || captainUserDoc.data().email || 'Captain')
      : 'Captain';

    // Get level data
    const level = await getLevel(submission.levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Level not found',
      });
    }

    // SECURITY: Verify level is active
    if (!level.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This level is not currently active',
      });
    }

    // SECURITY: Verify level belongs to team's group
    if (level.groupId && level.groupId !== team.groupId) {
      return res.status(403).json({
        success: false,
        error: 'This level does not belong to the team\'s group',
      });
    }

    // SECURITY: Verify team is at correct sequential level (prevent level skipping)
    if (team.currentLevel !== level.number) {
      return res.status(403).json({
        success: false,
        error: `Team is at level ${team.currentLevel}, cannot approve submission for level ${level.number}. Teams must complete levels sequentially.`,
      });
    }

    // Calculate scoring (same logic as regular flag submission)
    const hintsUsed = await getTeamHintUsage(submission.teamId, submission.levelId);
    const timeTaken = team.currentLevelStartTime
      ? Math.floor((Date.now() - team.currentLevelStartTime) / 60000) // Convert to minutes
      : 0;

    const scoring = calculateFinalScore({
      baseScore: level.basePoints || 0,
      hintsUsed,
      pointDeduction: level.pointDeduction || 0,
      timeTaken,
      timePenalty: level.timePenalty || 0,
      hintType: level.hintType || 'points',
    });

    // SECURITY: Use transaction to ensure atomicity and prevent race conditions
    await db.runTransaction(async (transaction) => {
      // Re-check submission status (prevent double approval)
      const currentSubmission = await transaction.get(submissionRef);
      if (!currentSubmission.exists) {
        throw new Error('Submission not found');
      }
      if (currentSubmission.data().status !== 'pending') {
        throw new Error('Submission has already been processed');
      }

      // SECURITY: Re-check if team has already completed this level (atomic check)
      const existingSubmissionRef = db.collection('submissions').doc(`${submission.teamId}_${submission.levelId}`);
      const existingSubmission = await transaction.get(existingSubmissionRef);
      
      if (existingSubmission.exists && existingSubmission.data().status === 'correct') {
        // Mark manual submission as rejected (duplicate) within transaction
        transaction.update(submissionRef, {
          status: 'rejected',
          reviewedBy: captain.userId,
          reviewedByName: captainName,
          reviewedAt: Date.now(),
          decision: 'rejected',
          rejectionReason: 'Level already completed via another submission',
        });
        throw new Error('DUPLICATE: This level has already been completed by the team');
      }

      // SECURITY: Re-fetch team data within transaction to get latest state
      const teamRef = db.collection('teams').doc(submission.teamId);
      const currentTeam = await transaction.get(teamRef);
      if (!currentTeam.exists) {
        throw new Error('Team not found during transaction');
      }
      const currentTeamData = currentTeam.data();

      // SECURITY: Re-verify level progression within transaction
      if (currentTeamData.currentLevel !== level.number) {
        throw new Error(`Team progression mismatch: team at level ${currentTeamData.currentLevel}, submission for level ${level.number}`);
      }

      // Update manual submission
      transaction.update(submissionRef, {
        status: 'approved',
        reviewedBy: captain.userId,
        reviewedByName: captainName,
        reviewedAt: Date.now(),
        decision: 'approved',
        scoreAwarded: scoring.finalScore,
      });

      // Create regular submission record (for consistency with existing system)
      const regularSubmissionRef = db.collection('submissions').doc(`${submission.teamId}_${submission.levelId}`);
      transaction.set(regularSubmissionRef, {
        id: `${submission.teamId}_${submission.levelId}`,
        teamId: submission.teamId,
        levelId: submission.levelId,
        flag: null, // Don't store flag
        flagHash: null,
        timeTaken,
        hintsUsed,
        baseScore: scoring.baseScore,
        pointDeduction: scoring.pointDeduction,
        timePenalty: scoring.timePenalty,
        finalScore: scoring.finalScore,
        submittedBy: submission.submittedBy,
        submittedAt: submission.submittedAt,
        status: 'correct',
        scoreProcessed: true,
        isManualSubmission: true, // Flag to indicate this came from manual review
        manualSubmissionId: id,
        reviewedBy: captain.userId,
        ipAddress: submission.ipAddress,
        userAgent: submission.userAgent,
      });

      // Calculate final scores based on current team data (prevents double counting)
      const finalTeamScore = (currentTeamData.score || 0) + scoring.finalScore;
      const finalLevelsCompleted = (currentTeamData.levelsCompleted || 0) + 1;
      const finalTimePenalty = (currentTeamData.timePenalty || 0) + scoring.timePenalty;
      const nextLevelNumber = (currentTeamData.currentLevel || 0) + 1;

      transaction.update(teamRef, {
        score: finalTeamScore,
        levelsCompleted: finalLevelsCompleted,
        timePenalty: finalTimePenalty,
        currentLevel: nextLevelNumber,
        status: 'moving',
        updatedAt: Date.now(),
      });

      // Update leaderboard
      const leaderboardRef = db.collection('leaderboard').doc(submission.teamId);
      transaction.set(leaderboardRef, {
        id: submission.teamId,
        teamName: team.name,
        groupId: team.groupId,
        score: finalTeamScore,
        levelsCompleted: finalLevelsCompleted,
        totalTimePenalty: finalTimePenalty,
        lastSubmissionAt: Date.now(),
      }, { merge: true });
    });

    console.log(`[ManualSubmissions] Submission ${id} approved by captain ${captain.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Submission approved and points awarded',
      data: {
        submissionId: id,
        scoreAwarded: scoring.finalScore,
      },
    });
  } catch (error) {
    console.error('[ManualSubmissions] Approve error:', error);
    
    // Handle specific transaction errors
    if (error.message === 'Submission has already been processed') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.startsWith('DUPLICATE:')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('DUPLICATE: ', ''),
      });
    }

    if (error.message.includes('Team progression mismatch')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    // Provide more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to approve submission: ${error.message}`
      : 'Failed to approve submission';

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Reject a manual submission
 * @route POST /api/manual-submissions/:id/reject
 * @access Captain (only for teams in their group)
 */
export const rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const captain = req.captain;

    if (!captain) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only captains can reject submissions',
      });
    }

    const db = getFirestore();
    const submissionRef = db.collection('manual_submissions').doc(id);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    const submission = submissionDoc.data();

    // Verify submission is pending
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Submission has already been ${submission.status}`,
      });
    }

    // Verify team belongs to captain's group
    const team = await getTeam(submission.teamId);
    if (!team || team.groupId !== captain.groupId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Team does not belong to your group',
      });
    }

    // Get captain's user data for name
    const captainUserDoc = await db.collection('users').doc(captain.userId).get();
    const captainName = captainUserDoc.exists 
      ? (captainUserDoc.data().name || captainUserDoc.data().email || 'Captain')
      : 'Captain';

    // Update submission status
    await submissionRef.update({
      status: 'rejected',
      reviewedBy: captain.userId,
      reviewedByName: captainName,
      reviewedAt: Date.now(),
      decision: 'rejected',
      rejectionReason: reason || 'Flag is incorrect',
    });

    console.log(`[ManualSubmissions] Submission ${id} rejected by captain ${captain.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Submission rejected',
      data: {
        submissionId: id,
      },
    });
  } catch (error) {
    console.error('[ManualSubmissions] Reject error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject submission',
    });
  }
};

/**
 * Get all manual submissions (admin only)
 * @route GET /api/admin/manual-submissions
 * @access Admin
 */
export const getAllManualSubmissions = async (req, res) => {
  try {
    const db = getFirestore();

    // Fetch all manual submissions
    const submissionsSnapshot = await db.collection('manual_submissions')
      .orderBy('submittedAt', 'desc')
      .limit(500) // Limit to prevent excessive data
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        submissions,
        count: submissions.length,
      },
    });
  } catch (error) {
    console.error('[ManualSubmissions] Get all submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  }
};
