import { getFirestore } from '../utils/firebase.js';
import { getTeam } from '../services/firestoreService.js';
import crypto from 'crypto';

/**
 * Create a new team (participant)
 * @route POST /api/participant/create-team
 */
export const createTeam = async (req, res) => {
  try {
    const { teamName, creatorId } = req.body;

    if (!teamName || !creatorId) {
      return res.status(400).json({
        success: false,
        error: 'Team name and creator ID are required',
      });
    }

    if (teamName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Team name must be at least 3 characters',
      });
    }

    const db = getFirestore();

    // Check if user already has a team
    const userDoc = await db.collection('users').doc(creatorId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // If user thinks they have a team, verify that team actually exists
    if (userData.teamId) {
      const existingTeamDoc = await db.collection('teams').doc(userData.teamId).get();

      // If team document is missing (e.g. deleted by admin), clean up the stale reference
      if (!existingTeamDoc.exists) {
        await db.collection('users').doc(creatorId).update({
          teamId: null,
          updatedAt: Date.now(),
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'You are already part of a team',
        });
      }
    }

    // Check if team name already exists
    const existingTeam = await db.collection('teams')
      .where('name', '==', teamName.trim())
      .limit(1)
      .get();

    if (!existingTeam.empty) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists',
      });
    }

    // Generate team invite code (6 characters, alphanumeric)
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 6);

    // Get the next team number (sequential assignment)
    const allTeamsSnapshot = await db.collection('teams')
      .orderBy('teamNumber', 'desc')
      .limit(1)
      .get();

    let nextTeamNumber = 1;
    if (!allTeamsSnapshot.empty) {
      const highestTeam = allTeamsSnapshot.docs[0].data();
      nextTeamNumber = (highestTeam.teamNumber || 0) + 1;
    }

    // Create team
    const teamRef = await db.collection('teams').add({
      name: teamName.trim(),
      teamNumber: nextTeamNumber, // Auto-assigned sequential number
      groupId: null, // Will be assigned by admin later
      captainId: null,
      members: [creatorId],
      score: 0,
      levelsCompleted: 0,
      timePenalty: 0,
      currentLevel: 1,
      status: 'waiting',
      inviteCode: inviteCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const teamId = teamRef.id;

    // Update team document with ID
    await db.collection('teams').doc(teamId).update({ id: teamId });

    // Update user document with teamId
    await db.collection('users').doc(creatorId).update({
      teamId: teamId,
      updatedAt: Date.now(),
    });

    console.log(`[TeamController] Team created - ID: ${teamId}, Name: ${teamName}, Creator: ${creatorId}`);

    return res.status(200).json({
      success: true,
      team: {
        id: teamId,
        name: teamName.trim(),
        teamNumber: nextTeamNumber,
        inviteCode: inviteCode,
      },
      message: 'Team created successfully',
    });
  } catch (error) {
    console.error('[TeamController] Create team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
};

/**
 * Join a team by invite code
 * @route POST /api/participant/join-team
 */
export const joinTeam = async (req, res) => {
  try {
    const { inviteCode, participantId } = req.body;

    if (!inviteCode || !participantId) {
      return res.status(400).json({
        success: false,
        error: 'Invite code and participant ID are required',
      });
    }

    const db = getFirestore();

    // Check if user already has a team
    const userDoc = await db.collection('users').doc(participantId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // If user thinks they have a team, verify that team actually exists
    if (userData.teamId) {
      const existingTeamDoc = await db.collection('teams').doc(userData.teamId).get();

      // If team document is missing (e.g. deleted by admin), clean up the stale reference
      if (!existingTeamDoc.exists) {
        await db.collection('users').doc(participantId).update({
          teamId: null,
          updatedAt: Date.now(),
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'You are already part of a team',
        });
      }
    }

    // Find team by invite code
    const teamQuery = await db.collection('teams')
      .where('inviteCode', '==', inviteCode.toUpperCase().trim())
      .limit(1)
      .get();

    if (teamQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite code',
      });
    }

    const teamDoc = teamQuery.docs[0];
    const teamData = teamDoc.data();
    const teamId = teamDoc.id;

    // Check if team is full (max 2 members)
    if (teamData.members && teamData.members.length >= 2) {
      return res.status(400).json({
        success: false,
        error: 'Team is full (maximum 2 members)',
      });
    }

    // Check if user is already in the team
    if (teamData.members && teamData.members.includes(participantId)) {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this team',
      });
    }

    // Add user to team
    const updatedMembers = [...(teamData.members || []), participantId];
    await db.collection('teams').doc(teamId).update({
      members: updatedMembers,
      updatedAt: Date.now(),
    });

    // Update user document with teamId
    await db.collection('users').doc(participantId).update({
      teamId: teamId,
      updatedAt: Date.now(),
    });

    console.log(`[TeamController] User joined team - User: ${participantId}, Team: ${teamId}`);

    return res.status(200).json({
      success: true,
      team: {
        id: teamId,
        name: teamData.name,
        teamNumber: teamData.teamNumber,
      },
      message: 'Successfully joined team',
    });
  } catch (error) {
    console.error('[TeamController] Join team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to join team',
    });
  }
};

/**
 * Get team details (for participant)
 * @route GET /api/participant/team/:teamId
 */
export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { participantId } = req.query;

    if (!teamId || !participantId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID and participant ID are required',
      });
    }

    const db = getFirestore();

    // Get team data
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Verify user is a member
    if (!team.members || !team.members.includes(participantId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this team',
      });
    }

    // Get member details
    const memberDetails = [];
    for (const memberId of team.members || []) {
      const memberDoc = await db.collection('users').doc(memberId).get();
      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        memberDetails.push({
          id: memberId,
          name: memberData.displayName || memberData.email || 'Unknown',
          email: memberData.email,
        });
      }
    }

    return res.status(200).json({
      success: true,
      team: {
        id: teamId,
        name: team.name,
        teamNumber: team.teamNumber || null,
        inviteCode: team.inviteCode,
        members: memberDetails,
        score: team.score || 0,
        levelsCompleted: team.levelsCompleted || 0,
        currentLevel: team.currentLevel || 1,
        status: team.status || 'waiting',
        createdAt: team.createdAt,
      },
    });
  } catch (error) {
    console.error('[TeamController] Get team details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team details',
    });
  }
};

/**
 * Leave team (participant)
 * @route POST /api/participant/leave-team
 */
export const leaveTeam = async (req, res) => {
  try {
    const { teamId, participantId } = req.body;

    if (!teamId || !participantId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID and participant ID are required',
      });
    }

    const db = getFirestore();

    // Get team data
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Verify user is a member
    if (!team.members || !team.members.includes(participantId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this team',
      });
    }

    // Remove user from team
    const updatedMembers = team.members.filter(id => id !== participantId);
    
    // If team becomes empty, delete it
    if (updatedMembers.length === 0) {
      await db.collection('teams').doc(teamId).delete();
    } else {
      await db.collection('teams').doc(teamId).update({
        members: updatedMembers,
        updatedAt: Date.now(),
      });
    }

    // Update user document
    await db.collection('users').doc(participantId).update({
      teamId: null,
      updatedAt: Date.now(),
    });

    console.log(`[TeamController] User left team - User: ${participantId}, Team: ${teamId}`);

    return res.status(200).json({
      success: true,
      message: 'Successfully left team',
    });
  } catch (error) {
    console.error('[TeamController] Leave team error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to leave team',
    });
  }
};

