// Use Firebase Functions v1 compat layer to keep existing API (.firestore.document, https.onCall)
// This avoids v2 typing issues while still being supported on Node 20.
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: (LEGACY) Calculate score on submission creation
 *
 * IMPORTANT:
 * Scoring is now handled exclusively by the Express backend in a single
 * Firestore transaction (`submitFlag` controller). To guarantee that points
 * are applied exactly once per correct flag (and that hint penalties are
 * not double-counted), this Cloud Function has been turned into a NO-OP.
 *
 * It is kept only to avoid breaking existing deployments that still have
 * the trigger configured in Firebase.
 */
export const calculateScore = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data();
    const { teamId } = submission || {};

    console.log('calculateScore (legacy) trigger invoked but scoring is handled by backend. No action taken.', {
      teamId,
      submissionId: context.params.submissionId,
    });

    // Do nothing – backend already updates team + leaderboard inside a transaction
    return null;
  });

/**
 * Cloud Function: (LEGACY) Process hint usage
 *
 * Hints (both points-based and time-based) are now handled purely by the
 * backend scoring logic, which looks at `hint_usage` when a flag is
 * submitted and applies the correct single penalty.
 *
 * To avoid double-applying time penalties, this trigger has been converted
 * to a NO-OP.
 */
export const processHintUsage = functions.firestore
  .document('hints/{hintId}')
  .onCreate(async (snap, context) => {
    const hint = snap.data();
    const { teamId, levelId, penalty } = hint || {};

    console.log('processHintUsage (legacy) trigger invoked but penalties are handled by backend scoring. No action taken.', {
      teamId,
      levelId,
      penalty,
      hintId: context.params.hintId,
    });

    // Do nothing – backend will compute penalties from hint_usage
    return null;
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

