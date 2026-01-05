import {
  getLevel,
  updateTeam,
  updateLeaderboard,
  getRecentSubmissions,
} from '../services/firestoreService.js';
import { getFirestore } from '../utils/firebase.js';
import { hashSHA256 } from '../utils/cryptoUtils.js';
import { startEvent, stopEvent, getEventStatus } from '../services/eventService.js';

/**
 * Update a level's configuration
 * @route POST /api/admin/update-level
 */
export const updateLevel = async (req, res) => {
  try {
    const { levelId, updates } = req.body;

    if (!levelId) {
      return res.status(400).json({
        success: false,
        error: 'Level ID is required',
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

    // Update level
    const db = getFirestore();
    await db.collection('levels').doc(levelId).update({
      ...updates,
      updatedAt: Date.now(),
    });

    console.log(`[AdminController] Level updated: ${levelId}`);

    return res.status(200).json({
      success: true,
      message: 'Level updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] Update level error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update level',
    });
  }
};

/**
 * Set flag hash for a level (SECURE - flag is hashed server-side)
 * @route POST /api/admin/set-flag
 */
export const setFlag = async (req, res) => {
  try {
    const { levelId, flag } = req.body;

    if (!levelId || !flag) {
      return res.status(400).json({
        success: false,
        error: 'Level ID and flag are required',
      });
    }

    // Validate flag format - must start with CSBC{ and end with }
    if (!flag.startsWith('CSBC{') || !flag.endsWith('}')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flag format. Expected: CSBC{...}',
      });
    }
    // Check that there's content between the braces
    const flagContent = flag.slice(5, -1);
    if (flagContent.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Flag cannot be empty. Expected: CSBC{your_flag}',
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

    // Hash the flag server-side (NEVER store plaintext)
    const flagHash = hashSHA256(flag);

    // Store hash in secure flags collection (separate from levels)
    const db = getFirestore();
    await db.collection('flag_hashes').doc(levelId).set({
      levelId,
      flagHash,
      setAt: Date.now(),
      setBy: req.adminId || 'admin', // Track who set it
    }, { merge: true });

    console.log(`[AdminController] Flag hash set for level: ${levelId} (hash: ${flagHash.substring(0, 16)}...)`);

    return res.status(200).json({
      success: true,
      message: 'Flag hash stored securely',
      // NEVER return the flag or hash to frontend
    });
  } catch (error) {
    console.error('[AdminController] Set flag error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to set flag',
    });
  }
};

/**
 * Manually update team score (admin override)
 * @route POST /api/admin/update-score
 */
export const updateScore = async (req, res) => {
  try {
    const { teamId, scoreChange, reason } = req.body;

    if (!teamId || scoreChange === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Team ID and score change are required',
      });
    }

    // Get current team data
    const db = getFirestore();
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const teamData = teamDoc.data();
    const oldScore = teamData.score || 0;
    const newScore = Math.max(0, oldScore + scoreChange);

    // SECURITY: Validate score change is reasonable (prevent accidental huge changes)
    if (Math.abs(scoreChange) > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Score change too large. Maximum allowed: ±10000 points per adjustment.',
      });
    }

    // Update team
    await updateTeam(teamId, {
      score: newScore,
    });

    // Update leaderboard - ensure it's in sync with team score
    await updateLeaderboard(teamId, {
      teamName: teamData.name,
      groupId: teamData.groupId,
      score: newScore,
      levelsCompleted: teamData.levelsCompleted || 0,
      totalTimePenalty: teamData.timePenalty || 0,
      lastSubmissionAt: Date.now(),
    });

    // SECURITY: Comprehensive audit logging for admin actions
    const adminId = req.admin?.userId || 'unknown';
    console.log(
      `[AdminController] SECURITY AUDIT - Manual score adjustment - Admin: ${adminId}, Team: ${teamId} (${teamData.name}), Old Score: ${oldScore}, Change: ${scoreChange > 0 ? '+' : ''}${scoreChange}, New Score: ${newScore}, Reason: ${reason || 'N/A'}`
    );

    // TODO: Store in audit log collection for compliance
    try {
      await db.collection('audit_logs').add({
        action: 'score_adjustment',
        adminId,
        teamId,
        teamName: teamData.name,
        oldScore,
        scoreChange,
        newScore,
        reason: reason || 'N/A',
        timestamp: Date.now(),
        ipAddress: req.ip || 'unknown',
      });
    } catch (auditError) {
      console.error('[AdminController] Failed to write audit log:', auditError);
      // Don't fail the request if audit logging fails
    }

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      newScore: Math.max(0, newScore),
    });
  } catch (error) {
    console.error('[AdminController] Update score error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update score',
    });
  }
};

/**
 * Get platform-wide statistics
 * @route GET /api/admin/stats
 */
export const getPlatformStats = async (req, res) => {
  try {
    const db = getFirestore();
    const [teamsSnapshot, levelsSnapshot, submissionsSnapshot, usersSnapshot] =
      await Promise.all([
        db.collection('teams').get(),
        db.collection('levels').get(),
        db.collection('submissions').get(),
        db.collection('users').get(),
      ]);

    const teams = teamsSnapshot.docs.map(doc => doc.data());
    const levels = levelsSnapshot.docs.map(doc => doc.data());
    const submissions = submissionsSnapshot.docs.map(doc => doc.data());

    const stats = {
      totalTeams: teamsSnapshot.size,
      activeTeams: teams.filter(t => t.levelsCompleted > 0).length,
      totalLevels: levelsSnapshot.size,
      activeLevels: levels.filter(l => l.isActive).length,
      totalSubmissions: submissionsSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalScore: teams.reduce((acc, team) => acc + (team.score || 0), 0),
      averageScore: teams.length > 0 
        ? Math.round(teams.reduce((acc, team) => acc + (team.score || 0), 0) / teams.length)
        : 0,
      completionRate: teams.length > 0 && levels.length > 0
        ? Math.round((submissionsSnapshot.size / (teams.length * levels.length)) * 100)
        : 0,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[AdminController] Stats error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

/**
 * Get recent activity
 * @route GET /api/admin/recent-activity
 */
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const submissions = await getRecentSubmissions(limit);

    return res.status(200).json({
      success: true,
      activity: submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('[AdminController] Recent activity error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
    });
  }
};

/**
 * Reset competition (delete all submissions and reset scores)
 * @route POST /api/admin/reset-competition
 */
export const resetCompetition = async (req, res) => {
  try {
    const { confirmationCode } = req.body;

    if (confirmationCode !== 'RESET_COMPETITION_NOW') {
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation code',
      });
    }

    console.log('[AdminController] Competition reset initiated');

    const db = getFirestore();

    // Delete all submissions
    const submissionsSnapshot = await db.collection('submissions').get();
    const batch1 = db.batch();
    submissionsSnapshot.docs.forEach((doc) => {
      batch1.delete(doc.ref);
    });
    await batch1.commit();

    // Delete all hint usage records
    const hintsSnapshot = await db.collection('hint_usage').get();
    const batch2 = db.batch();
    hintsSnapshot.docs.forEach((doc) => {
      batch2.delete(doc.ref);
    });
    await batch2.commit();

    // Reset all teams
    const teamsSnapshot = await db.collection('teams').get();
    const batch3 = db.batch();
    teamsSnapshot.docs.forEach((doc) => {
      batch3.update(doc.ref, {
        score: 0,
        levelsCompleted: 0,
        timePenalty: 0,
        updatedAt: Date.now(),
      });
    });
    await batch3.commit();

    // Clear leaderboard
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    const batch4 = db.batch();
    leaderboardSnapshot.docs.forEach((doc) => {
      batch4.delete(doc.ref);
    });
    await batch4.commit();

    console.log('[AdminController] Competition reset completed');

    return res.status(200).json({
      success: true,
      message: 'Competition has been reset successfully',
      resetStats: {
        submissionsDeleted: submissionsSnapshot.size,
        hintsDeleted: hintsSnapshot.size,
        teamsReset: teamsSnapshot.size,
      },
    });
  } catch (error) {
    console.error('[AdminController] Reset error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to reset competition',
    });
  }
};

/**
 * Start the event (admin only)
 * @route POST /api/admin/start-event
 */
export const startEventController = async (req, res) => {
  try {
    await startEvent();
    
    console.log('[AdminController] Event started');
    
    return res.status(200).json({
      success: true,
      message: 'Event started successfully',
    });
  } catch (error) {
    console.error('[AdminController] Start event error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start event',
    });
  }
};

/**
 * Stop the event (admin only)
 * @route POST /api/admin/stop-event
 */
export const stopEventController = async (req, res) => {
  try {
    await stopEvent();
    
    console.log('[AdminController] Event stopped');
    
    return res.status(200).json({
      success: true,
      message: 'Event stopped successfully',
    });
  } catch (error) {
    console.error('[AdminController] Stop event error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop event',
    });
  }
};

/**
 * Get event status (admin only)
 * @route GET /api/admin/event-status
 */
export const getEventStatusController = async (req, res) => {
  try {
    const eventStatus = await getEventStatus();
    
    return res.status(200).json({
      success: true,
      data: eventStatus,
    });
  } catch (error) {
    console.error('[AdminController] Get event status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get event status',
    });
  }
};

/**
 * Pause the event (admin only)
 * @route POST /api/admin/pause-event
 */
export const pauseEventController = async (req, res) => {
  try {
    const { pauseEvent } = await import('../services/eventService.js');
    await pauseEvent();
    
    console.log('[AdminController] Event paused');
    
    return res.status(200).json({
      success: true,
      message: 'Event paused successfully',
    });
  } catch (error) {
    console.error('[AdminController] Pause event error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to pause event',
    });
  }
};

/**
 * Create a new level
 * @route POST /api/admin/create-level
 */
export const createLevel = async (req, res) => {
  try {
    const levelData = req.body;
    const db = getFirestore();
    
    const levelRef = await db.collection('levels').add({
      ...levelData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return res.status(201).json({
      success: true,
      message: 'Level created successfully',
      levelId: levelRef.id,
    });
  } catch (error) {
    console.error('[AdminController] Create level error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create level',
    });
  }
};

/**
 * Delete a level
 * @route DELETE /api/admin/level/:levelId
 */
export const deleteLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const db = getFirestore();
    
    await db.collection('levels').doc(levelId).delete();
    
    return res.status(200).json({
      success: true,
      message: 'Level deleted successfully',
    });
  } catch (error) {
    console.error('[AdminController] Delete level error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete level',
    });
  }
};

/**
 * Create a new team
 * @route POST /api/admin/create-team
 */
export const createTeam = async (req, res) => {
  try {
    const teamData = req.body;
    const db = getFirestore();
    
    // Get next team number
    const teamsSnapshot = await db.collection('teams')
      .orderBy('teamNumber', 'desc')
      .limit(1)
      .get();
    
    let nextTeamNumber = 1;
    if (!teamsSnapshot.empty) {
      const highestTeam = teamsSnapshot.docs[0].data();
      nextTeamNumber = (highestTeam.teamNumber || 0) + 1;
    }
    
    const teamRef = await db.collection('teams').add({
      ...teamData,
      teamNumber: nextTeamNumber,
      score: 0,
      levelsCompleted: 0,
      members: [],
      createdAt: Date.now(),
    });
    
    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      teamId: teamRef.id,
      teamNumber: nextTeamNumber,
    });
  } catch (error) {
    console.error('[AdminController] Create team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
};

/**
 * Update a team
 * @route POST /api/admin/update-team
 */
export const updateTeamController = async (req, res) => {
  try {
    const { teamId, updates } = req.body;
    const db = getFirestore();
    
    await db.collection('teams').doc(teamId).update({
      ...updates,
      updatedAt: Date.now(),
    });
    
    return res.status(200).json({
      success: true,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] Update team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update team',
    });
  }
};

/**
 * Delete a team
 * @route DELETE /api/admin/team/:teamId
 */
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const db = getFirestore();

    // Delete team document
    await db.collection('teams').doc(teamId).delete();

    // Detach all users that were part of this team
    const usersSnapshot = await db.collection('users').where('teamId', '==', teamId).get();
    if (!usersSnapshot.empty) {
      const batch = db.batch();
      usersSnapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          teamId: null,
          updatedAt: Date.now(),
        });
      });
      await batch.commit();
    }

    // Remove team from leaderboard if present
    const leaderboardDoc = await db.collection('leaderboard').doc(teamId).get();
    if (leaderboardDoc.exists) {
      await db.collection('leaderboard').doc(teamId).delete();
    }

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully and members detached',
    });
  } catch (error) {
    console.error('[AdminController] Delete team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete team',
    });
  }
};

/**
 * Create a new group
 * @route POST /api/admin/create-group
 */
export const createGroup = async (req, res) => {
  try {
    const groupData = req.body;
    const db = getFirestore();
    
    const groupRef = await db.collection('groups').add({
      ...groupData,
      createdAt: Date.now(),
    });
    
    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      groupId: groupRef.id,
    });
  } catch (error) {
    console.error('[AdminController] Create group error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create group',
    });
  }
};

/**
 * Update a group
 * @route POST /api/admin/update-group
 */
export const updateGroup = async (req, res) => {
  try {
    const { groupId, updates } = req.body;
    const db = getFirestore();
    
    await db.collection('groups').doc(groupId).update({
      ...updates,
      updatedAt: Date.now(),
    });
    
    return res.status(200).json({
      success: true,
      message: 'Group updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] Update group error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update group',
    });
  }
};

/**
 * Delete a group
 * @route DELETE /api/admin/group/:groupId
 */
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const db = getFirestore();
    
    await db.collection('groups').doc(groupId).delete();
    
    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('[AdminController] Delete group error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete group',
    });
  }
};

/**
 * Create an announcement
 * @route POST /api/admin/create-announcement
 */
export const createAnnouncement = async (req, res) => {
  try {
    const announcementData = req.body;
    const db = getFirestore();
    
    const announcementRef = await db.collection('announcements').add({
      ...announcementData,
      createdAt: Date.now(),
      createdBy: req.admin?.userId || 'admin',
      isActive: true,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcementId: announcementRef.id,
    });
  } catch (error) {
    console.error('[AdminController] Create announcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create announcement',
    });
  }
};

/**
 * Update an announcement
 * @route POST /api/admin/update-announcement
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId, updates } = req.body;
    const db = getFirestore();
    
    await db.collection('announcements').doc(announcementId).update({
      ...updates,
      updatedAt: Date.now(),
    });
    
    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] Update announcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update announcement',
    });
  }
};

/**
 * Delete an announcement
 * @route DELETE /api/admin/announcement/:announcementId
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const db = getFirestore();
    
    await db.collection('announcements').doc(announcementId).delete();
    
    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('[AdminController] Delete announcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete announcement',
    });
  }
};

/**
 * Impersonate a user (login as participant/captain using email)
 * @route POST /api/admin/impersonate-user
 */
export const impersonateUser = async (req, res) => {
  try {
    const { email } = req.body;
    const db = getFirestore();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user by email in Firestore
    const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email',
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Don't allow impersonating admins (security measure)
    if (userData.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot impersonate admin users',
      });
    }

    // Check if user is blocked
    if (userData.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Cannot impersonate blocked users',
      });
    }

    // Import admin SDK and create custom token
    const adminSdk = await import('firebase-admin');
    const customToken = await adminSdk.default.auth().createCustomToken(userId, {
      impersonatedBy: req.admin.userId,
      impersonatedAt: Date.now(),
    });

    console.log(`[AdminController] Admin ${req.admin.userId} impersonating user ${userId} (${email})`);

    return res.status(200).json({
      success: true,
      customToken,
      user: {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        teamId: userData.teamId,
      },
      message: `Impersonation token generated for ${userData.displayName || email}`,
    });
  } catch (error) {
    console.error('[AdminController] Impersonate user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate impersonation token',
    });
  }
};

/**
 * Update a user's information (role, displayName, teamId, etc.)
 * @route POST /api/admin/update-user
 */
export const updateUser = async (req, res) => {
  try {
    const { userId, updates } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const db = getFirestore();

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Prevent admins from modifying other admins (unless it's themselves)
    if (userData.role === 'admin' && userId !== req.admin.userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify other admin users',
      });
    }

    // Build update object (only allow specific fields)
    const allowedUpdates = {};
    if (updates.role !== undefined) {
      allowedUpdates.role = updates.role;
    }
    if (updates.displayName !== undefined) {
      allowedUpdates.displayName = updates.displayName;
    }
    if (updates.teamId !== undefined) {
      allowedUpdates.teamId = updates.teamId || null;
    }

    // Update user document
    await db.collection('users').doc(userId).update({
      ...allowedUpdates,
      updatedAt: Date.now(),
    });

    console.log(`[AdminController] User updated - ID: ${userId}, Admin: ${req.admin.userId}`);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

/**
 * Block or unblock a user
 * @route POST /api/admin/block-user
 */
export const blockUser = async (req, res) => {
  try {
    const { userId, isBlocked } = req.body;

    if (!userId || typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'User ID and isBlocked (boolean) are required',
      });
    }

    const db = getFirestore();

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Prevent blocking admins
    if (userData.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot block admin users',
      });
    }

    // Prevent blocking yourself
    if (userId === req.admin.userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot block yourself',
      });
    }

    // Update user document
    await db.collection('users').doc(userId).update({
      isBlocked: isBlocked,
      updatedAt: Date.now(),
    });

    console.log(`[AdminController] User ${isBlocked ? 'blocked' : 'unblocked'} - ID: ${userId}, Admin: ${req.admin.userId}`);

    return res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    console.error('[AdminController] Block user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user status',
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/admin/user/:userId
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const db = getFirestore();

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Prevent deleting admins
    if (userData.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin users',
      });
    }

    // Prevent deleting yourself
    if (userId === req.admin.userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete yourself',
      });
    }

    // Delete user document
    await db.collection('users').doc(userId).delete();

    console.log(`[AdminController] User deleted - ID: ${userId}, Admin: ${req.admin.userId}`);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[AdminController] Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

