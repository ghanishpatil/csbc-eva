import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: Calculate and update score when a submission is created
 * Triggers on new submission document creation
 */
export const calculateScore = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    try {
      const submission = snap.data();
      const { teamId, finalScore, timePenalty, levelId } = submission;

      console.log('Processing submission:', {
        teamId,
        finalScore,
        timePenalty,
        levelId,
      });

      // Get team document
      const teamRef = db.collection('teams').doc(teamId);
      const teamDoc = await teamRef.get();

      if (!teamDoc.exists) {
        console.error('Team not found:', teamId);
        return null;
      }

      const teamData = teamDoc.data();
      if (!teamData) {
        console.error('Team data is empty');
        return null;
      }

      // Update team score and stats
      const newScore = (teamData.score || 0) + finalScore;
      const newLevelsCompleted = (teamData.levelsCompleted || 0) + 1;
      const newTimePenalty = (teamData.timePenalty || 0) + timePenalty;

      await teamRef.update({
        score: newScore,
        levelsCompleted: newLevelsCompleted,
        timePenalty: newTimePenalty,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update leaderboard
      const leaderboardRef = db.collection('leaderboard').doc(teamId);
      await leaderboardRef.set(
        {
          id: teamId,
          teamName: teamData.name,
          groupId: teamData.groupId,
          score: newScore,
          levelsCompleted: newLevelsCompleted,
          totalTimePenalty: newTimePenalty,
          lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Score calculated successfully:', {
        teamId,
        newScore,
        newLevelsCompleted,
      });

      return null;
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Process hint usage and apply penalties
 * Triggers on new hint usage document creation
 */
export const processHintUsage = functions.firestore
  .document('hints/{hintId}')
  .onCreate(async (snap, context) => {
    try {
      const hint = snap.data();
      const { teamId, levelId, penalty } = hint;

      console.log('Processing hint usage:', { teamId, levelId, penalty });

      // Get level to determine hint type
      const levelDoc = await db.collection('levels').doc(levelId).get();
      
      if (!levelDoc.exists) {
        console.error('Level not found:', levelId);
        return null;
      }

      const level = levelDoc.data();
      if (!level) {
        console.error('Level data is empty');
        return null;
      }

      // Get team document
      const teamRef = db.collection('teams').doc(teamId);
      const teamDoc = await teamRef.get();

      if (!teamDoc.exists) {
        console.error('Team not found:', teamId);
        return null;
      }

      // If it's a time-based hint, update team's time penalty immediately
      if (level.hintType === 'time') {
        const teamData = teamDoc.data();
        const currentTimePenalty = teamData?.timePenalty || 0;
        
        await teamRef.update({
          timePenalty: currentTimePenalty + penalty,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update leaderboard
        const leaderboardRef = db.collection('leaderboard').doc(teamId);
        await leaderboardRef.update({
          totalTimePenalty: admin.firestore.FieldValue.increment(penalty),
        });
      }

      console.log('Hint usage processed successfully');
      return null;
    } catch (error) {
      console.error('Error processing hint usage:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Initialize event configuration
 * Callable function for admin to set up the event
 */
export const initializeEvent = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    const { eventName, totalTeams, totalGroups, totalLevels } = data;

    const eventConfig = {
      id: 'event',
      eventName,
      totalTeams,
      totalGroups,
      teamsPerGroup: Math.ceil(totalTeams / totalGroups),
      totalLevels,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('config').doc('event').set(eventConfig, { merge: true });

    return { success: true, message: 'Event initialized successfully' };
  } catch (error) {
    console.error('Error initializing event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initialize event');
  }
});

/**
 * Cloud Function: Reset competition
 * Callable function for admin to reset all data
 */
export const resetCompetition = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    // Delete all submissions
    const submissionsSnapshot = await db.collection('submissions').get();
    const submissionsBatch = db.batch();
    submissionsSnapshot.docs.forEach((doc) => {
      submissionsBatch.delete(doc.ref);
    });
    await submissionsBatch.commit();

    // Delete all hints
    const hintsSnapshot = await db.collection('hints').get();
    const hintsBatch = db.batch();
    hintsSnapshot.docs.forEach((doc) => {
      hintsBatch.delete(doc.ref);
    });
    await hintsBatch.commit();

    // Reset teams
    const teamsSnapshot = await db.collection('teams').get();
    const teamsBatch = db.batch();
    teamsSnapshot.docs.forEach((doc) => {
      teamsBatch.update(doc.ref, {
        score: 0,
        levelsCompleted: 0,
        timePenalty: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await teamsBatch.commit();

    // Clear leaderboard
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    const leaderboardBatch = db.batch();
    leaderboardSnapshot.docs.forEach((doc) => {
      leaderboardBatch.delete(doc.ref);
    });
    await leaderboardBatch.commit();

    console.log('Competition reset successfully');
    return { success: true, message: 'Competition reset successfully' };
  } catch (error) {
    console.error('Error resetting competition:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reset competition');
  }
});

/**
 * Cloud Function: Get team statistics
 * Callable function to get detailed team stats
 */
export const getTeamStatistics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    const { teamId } = data;

    // Get team data
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Team not found');
    }

    const teamData = teamDoc.data();

    // Get submissions
    const submissionsSnapshot = await db
      .collection('submissions')
      .where('teamId', '==', teamId)
      .orderBy('submittedAt', 'desc')
      .get();

    const submissions = submissionsSnapshot.docs.map((doc) => doc.data());

    // Get hints used
    const hintsSnapshot = await db
      .collection('hints')
      .where('teamId', '==', teamId)
      .get();

    const totalHintsUsed = hintsSnapshot.size;

    // Calculate statistics
    const totalTimeTaken = submissions.reduce(
      (acc, sub: any) => acc + sub.timeTaken,
      0
    );
    const averageTimePerLevel =
      submissions.length > 0 ? totalTimeTaken / submissions.length : 0;

    // Get rank from leaderboard
    const leaderboardSnapshot = await db
      .collection('leaderboard')
      .orderBy('score', 'desc')
      .get();

    let rank = 1;
    leaderboardSnapshot.docs.forEach((doc, index) => {
      if (doc.id === teamId) {
        rank = index + 1;
      }
    });

    return {
      success: true,
      statistics: {
        teamName: teamData?.name,
        score: teamData?.score || 0,
        levelsCompleted: teamData?.levelsCompleted || 0,
        totalHintsUsed,
        totalTimeTaken,
        averageTimePerLevel: Math.round(averageTimePerLevel * 100) / 100,
        rank,
        submissions: submissions.length,
      },
    };
  } catch (error) {
    console.error('Error getting team statistics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get statistics');
  }
});

