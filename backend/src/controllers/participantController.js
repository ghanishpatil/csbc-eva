import { getFirestore } from '../utils/firebase.js';
import { getTeam, getLevel } from '../services/firestoreService.js';
import { canRequestHint, getLevelHints, getTeamHintUsage } from '../services/hintService.js';
import { calculateHintPenalty } from '../services/hintService.js';
// Event status check removed - no longer required

/**
 * Start a mission challenge by scanning QR code
 * @route POST /api/mission/start
 * SECURITY: Backend validates QR, group, sequential order, and starts timer
 */
export const startMission = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData || typeof qrData !== 'string' || !qrData.trim()) {
      return res.status(400).json({
        success: false,
        error: 'QR code data is required',
      });
    }

    const db = getFirestore();
    const userId = req.participant.userId;
    const userData = req.participant.userData;

    // Get teamId from user document
    if (!userData.teamId) {
      return res.status(400).json({
        success: false,
        error: 'User is not assigned to a team',
      });
    }

    const teamId = userData.teamId;

    // Get team data
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

    const qrCodeValue = qrData.trim();
    let levelDoc = null;
    let levelId = null;
    let levelData = null;

    // PRIORITY 1: Search by qrCodeId (the actual QR code identifier)
    const levelsByQrSnapshot = await db
      .collection('levels')
      .where('qrCodeId', '==', qrCodeValue)
      .get();

    if (!levelsByQrSnapshot.empty) {
      // Filter by team's groupId
      const groupLevel = levelsByQrSnapshot.docs.find(
        (doc) => doc.data().groupId === team.groupId
      );
      
      if (groupLevel) {
        levelDoc = groupLevel;
        levelId = groupLevel.id;
        levelData = groupLevel.data();
      } else {
        // QR code doesn't belong to team's group
        return res.status(403).json({
          success: false,
          error: 'This QR code does not belong to your group. Please scan the correct QR code for your group.',
        });
      }
    }

    // PRIORITY 2: If QR code is just a number, find by level number within group
    if (!levelDoc && /^\d+$/.test(qrCodeValue)) {
      const levelNumber = parseInt(qrCodeValue);
      const levelsByNumberSnapshot = await db
        .collection('levels')
        .where('groupId', '==', team.groupId)
        .where('number', '==', levelNumber)
        .limit(1)
        .get();

      if (!levelsByNumberSnapshot.empty) {
        levelDoc = levelsByNumberSnapshot.docs[0];
        levelId = levelDoc.id;
        levelData = levelDoc.data();
      }
    }

    // PRIORITY 3: Check if it's a level_X format
    if (!levelDoc && qrCodeValue.startsWith('level_')) {
      const levelNumber = parseInt(qrCodeValue.replace('level_', ''));
      if (!isNaN(levelNumber)) {
        const levelsByNumberSnapshot = await db
          .collection('levels')
          .where('groupId', '==', team.groupId)
          .where('number', '==', levelNumber)
          .limit(1)
          .get();

        if (!levelsByNumberSnapshot.empty) {
          levelDoc = levelsByNumberSnapshot.docs[0];
          levelId = levelDoc.id;
          levelData = levelDoc.data();
        }
      }
    }

    // PRIORITY 4: Try using QR code as direct levelId (document ID)
    if (!levelDoc) {
      try {
        const levelDocRef = db.collection('levels').doc(qrCodeValue);
        const levelDocSnap = await levelDocRef.get();
        if (levelDocSnap.exists) {
          const data = levelDocSnap.data();
          // Verify it belongs to team's group
          if (data.groupId === team.groupId) {
            levelDoc = levelDocSnap;
            levelId = qrCodeValue;
            levelData = data;
          }
        }
      } catch (error) {
        // Invalid document ID format, continue to error
      }
    }

    // If no level found
    if (!levelDoc || !levelData) {
      return res.status(404).json({
        success: false,
        error: 'Level not found. Please check the QR code.',
      });
    }

    // CRITICAL: Verify level belongs to team's group (GROUP-SCOPED MISSION)
    if (levelData.groupId && levelData.groupId !== team.groupId) {
      return res.status(403).json({
        success: false,
        error: 'This level does not belong to your group. You cannot access this mission.',
      });
    }

    // CRITICAL: Verify QR code matches this level's qrCodeId (PHYSICAL PRESENCE PROOF)
    if (levelData.qrCodeId && qrCodeValue !== levelData.qrCodeId) {
      return res.status(403).json({
        success: false,
        error: 'Invalid QR code for this level. Please scan the correct QR code at the physical location.',
      });
    }

    // CRITICAL: Check sequential order (no skipping levels)
    const currentLevelNumber = team.currentLevel || 1;
    if (levelData.number > currentLevelNumber) {
      return res.status(403).json({
        success: false,
        error: `This level is not unlocked for your team. Complete Level ${currentLevelNumber} first.`,
      });
    }

    // Check if level is already completed
    if (team.levelsCompleted >= levelData.number) {
      return res.status(400).json({
        success: false,
        error: 'This level has already been completed.',
      });
    }

    // Check if there's an active session for this level
    const sessionRef = db.collection('mission_sessions').doc(`${teamId}_${levelId}`);
    const sessionDoc = await sessionRef.get();

    if (sessionDoc.exists) {
      const sessionData = sessionDoc.data();
      if (sessionData.status === 'active') {
        // Return existing session info
        return res.status(200).json({
          success: true,
          message: 'Mission already started',
          level: levelData.number,
          description: levelData.description || levelData.title,
          timeLimit: levelData.timeLimit || 0,
          levelId: levelId,
          startTime: sessionData.startTime,
        });
      }
    }

    // FIX: Enforce state machine - Update team status to "At Location" (MOVING → at_location)
    // Only allow if current state is 'waiting' or 'moving'
    const currentStatus = team.status || 'waiting';
    if (!['waiting', 'moving'].includes(currentStatus)) {
      return res.status(403).json({
        success: false,
        error: `Invalid state transition: Cannot start mission from '${currentStatus}' state. You must be in 'waiting' or 'moving' state.`,
      });
    }

    const startTime = Date.now();

    // Create/update session record
    await sessionRef.set({
      teamId,
      levelId,
      level: levelData.number,
      startTime,
      status: 'active',
      createdAt: startTime,
      updatedAt: startTime,
    });

    // Update team status and start timer
    await db.collection('teams').doc(teamId).update({
      currentLevel: levelData.number,
      status: 'at_location', // State transition: MOVING → at_location
      lastCheckInAt: startTime,
      currentLevelStartTime: startTime,
      updatedAt: startTime,
    });

    // Record check-in
    const checkInRef = db.collection('check_ins').doc(`${teamId}_${levelId}`);
    const checkInDoc = await checkInRef.get();
    if (!checkInDoc.exists) {
      await checkInRef.set({
        teamId,
        levelId,
        levelNumber: levelData.number,
        checkedInAt: startTime,
      });
    }

    console.log(`[ParticipantController] Mission started - Team: ${teamId}, Level: ${levelData.number}`);

    return res.status(200).json({
      success: true,
      message: `Mission Level ${levelData.number} started`,
      level: levelData.number,
      description: levelData.description || levelData.title,
      timeLimit: levelData.timeLimit || 0,
      levelId: levelId,
      startTime: startTime,
    });
  } catch (error) {
    console.error('[ParticipantController] Start mission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start mission',
    });
  }
};

/**
 * Verify QR check-in for a team at a specific level
 * @route POST /api/participant/check-in
 */
export const verifyCheckIn = async (req, res) => {
  try {
    const { teamId, levelId, qrCode } = req.body;

    if (!teamId || !levelId || !qrCode) {
      return res.status(400).json({
        success: false,
        error: 'Team ID, Level ID, and QR code are required',
      });
    }

    const db = getFirestore();

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

    // CRITICAL: Verify level belongs to team's group (GROUP-SCOPED MISSION)
    if (level.groupId && level.groupId !== team.groupId) {
      return res.status(403).json({
        success: false,
        error: 'This level does not belong to your group. You cannot check in here.',
      });
    }

    // CRITICAL: Verify QR code matches this level's qrCodeId (PHYSICAL PRESENCE PROOF)
    if (level.qrCodeId && qrCode !== level.qrCodeId) {
      return res.status(403).json({
        success: false,
        error: 'Invalid QR code for this level. Please scan the correct QR code at the physical location.',
      });
    }

    // Fallback QR validation if qrCodeId not set (legacy support)
    if (!level.qrCodeId) {
      const expectedQRPattern = `level_${level.number}`;
      if (!qrCode.includes(level.number.toString()) && !qrCode.includes(levelId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code for this location',
        });
      }
    }

    // Check if team has completed previous levels (sequential progression)
    const currentLevelNumber = team.currentLevel || 1;
    if (level.number > currentLevelNumber) {
      return res.status(403).json({
        success: false,
        error: 'This location is not unlocked for your team. Complete previous levels first.',
      });
    }

    // Check if team has already checked in at this level
    const checkInRef = db.collection('check_ins').doc(`${teamId}_${levelId}`);
    const checkInDoc = await checkInRef.get();

    if (checkInDoc.exists) {
      return res.status(200).json({
        success: true,
        message: 'Already checked in at this location',
        levelId: levelId,
        levelNumber: level.number,
        levelTitle: level.title,
        checkedInAt: checkInDoc.data().checkedInAt,
      });
    }

    // Record check-in
    await checkInRef.set({
      teamId,
      levelId,
      levelNumber: level.number,
      checkedInAt: Date.now(),
    });

    // FIX 3: Enforce state machine - Update team status to "At Location" (MOVING → at_location)
    // Only allow if current state is 'waiting' or 'moving'
    const currentStatus = team.status || 'waiting';
    if (!['waiting', 'moving'].includes(currentStatus)) {
      return res.status(403).json({
        success: false,
        error: `Invalid state transition: Cannot check in from '${currentStatus}' state. You must be in 'waiting' or 'moving' state.`,
      });
    }

    await db.collection('teams').doc(teamId).update({
      currentLevel: level.number,
      status: 'at_location', // State transition: MOVING → at_location
      lastCheckInAt: Date.now(),
      currentLevelStartTime: Date.now(),
    });

    console.log(`[ParticipantController] Check-in successful - Team: ${teamId}, Level: ${level.number}`);

    return res.status(200).json({
      success: true,
      message: `You have reached Level ${level.number} location`,
      levelId: levelId,
      levelNumber: level.number,
      levelTitle: level.title,
      checkedInAt: Date.now(),
    });
  } catch (error) {
    console.error('[ParticipantController] Check-in error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process check-in',
    });
  }
};

/**
 * Get current team status (current level, status, timer, etc.)
 * @route GET /api/participant/status/:teamId
 */
export const getTeamStatus = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required',
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

    // Get group data
    let groupName = 'Unknown';
    if (team.groupId) {
      const groupDoc = await db.collection('groups').doc(team.groupId).get();
      if (groupDoc.exists) {
        groupName = groupDoc.data().name || 'Unknown';
      }
    }

    // Get current level data if available
    // CRITICAL: Scope by (groupId + level number) for group-specific missions
    let currentLevelData = null;
    if (team.currentLevel && team.groupId) {
      const levelsSnapshot = await db
        .collection('levels')
        .where('groupId', '==', team.groupId)
        .where('number', '==', team.currentLevel)
        .limit(1)
        .get();

      if (!levelsSnapshot.empty) {
        const levelDoc = levelsSnapshot.docs[0];
        currentLevelData = {
          id: levelDoc.id,
          groupId: levelDoc.data().groupId,
          number: levelDoc.data().number,
          title: levelDoc.data().title,
          description: levelDoc.data().description,
          basePoints: levelDoc.data().basePoints,
          flagFormat: levelDoc.data().flagFormat || 'CSBC{...}',
          category: levelDoc.data().category,
          challengeUrl: levelDoc.data().challengeUrl,
          fileUrl: levelDoc.data().fileUrl,
          fileName: levelDoc.data().fileName,
          hintsAvailable: levelDoc.data().hintsAvailable || 0,
          qrCodeId: levelDoc.data().qrCodeId,
          isActive: levelDoc.data().isActive || false,
        };
      }
    }

    // Calculate time elapsed since level start
    const timeElapsed = team.currentLevelStartTime
      ? Math.floor((Date.now() - team.currentLevelStartTime) / 1000) // in seconds
      : 0;

    // Get check-in status for current level
    let isCheckedIn = false;
    if (team.currentLevel && currentLevelData) {
      const checkInRef = db.collection('check_ins').doc(`${teamId}_${currentLevelData.id}`);
      const checkInDoc = await checkInRef.get();
      isCheckedIn = checkInDoc.exists;
    }

    // Determine status badge
    let statusBadge = 'waiting';
    if (team.status) {
      statusBadge = team.status;
    } else if (team.currentLevel === 1 && !isCheckedIn) {
      statusBadge = 'waiting';
    } else if (isCheckedIn && team.status === 'at_location') {
      statusBadge = 'at_location';
    } else if (team.status === 'solving') {
      statusBadge = 'solving';
    } else if (team.status === 'moving') {
      statusBadge = 'moving';
    }

    return res.status(200).json({
      success: true,
      team: {
        id: teamId,
        name: team.name,
        groupId: team.groupId,
        groupName: groupName,
        score: team.score || 0,
        levelsCompleted: team.levelsCompleted || 0,
        currentLevel: team.currentLevel || 1,
        status: statusBadge,
        timeElapsed: timeElapsed,
        currentLevelStartTime: team.currentLevelStartTime,
        isCheckedIn: isCheckedIn,
      },
      currentLevel: currentLevelData,
    });
  } catch (error) {
    console.error('[ParticipantController] Get status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team status',
    });
  }
};

/**
 * Get current level details (only if unlocked and checked in)
 * @route GET /api/participant/level/:teamId
 */
export const getCurrentLevel = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required',
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

    // If no current level, return success with null
    if (!team.currentLevel) {
      return res.status(200).json({
        success: true,
        message: 'No active mission. Complete check-in to start.',
        level: null,
        teamStatus: team.status || 'waiting',
      });
    }

    // Try to find level - first by group+number, then fallback to just number
    let levelDoc = null;
    let levelData = null;

    // Try group-scoped lookup first
    if (team.groupId) {
      const levelsSnapshot = await db
        .collection('levels')
        .where('groupId', '==', team.groupId)
        .where('number', '==', team.currentLevel)
        .limit(1)
        .get();
      
      if (!levelsSnapshot.empty) {
        levelDoc = levelsSnapshot.docs[0];
        levelData = levelDoc.data();
      }
    }

    // Fallback: Try to find level by number only (for simpler setups)
    if (!levelDoc) {
      const fallbackSnapshot = await db
        .collection('levels')
        .where('number', '==', team.currentLevel)
        .limit(1)
        .get();
      
      if (!fallbackSnapshot.empty) {
        levelDoc = fallbackSnapshot.docs[0];
        levelData = fallbackSnapshot.docs[0].data();
      }
    }

    // If still no level found, return helpful message
    if (!levelDoc || !levelData) {
      return res.status(200).json({
        success: true,
        message: `Level ${team.currentLevel} not configured yet. Please wait for admin to set up missions.`,
        level: null,
        teamStatus: team.status || 'waiting',
        currentLevel: team.currentLevel,
      });
    }

    // Check if team has checked in (optional - don't block if no check-in system)
    const checkInRef = db.collection('check_ins').doc(`${teamId}_${levelDoc.id}`);
    const checkInDoc = await checkInRef.get();
    const isCheckedIn = checkInDoc.exists;

    // FIX 3: Enforce state machine - Auto-transition to SOLVING when viewing mission
    // State transition: at_location → solving
    if (team.status === 'at_location') {
      await db.collection('teams').doc(teamId).update({
        status: 'solving',
        updatedAt: Date.now(),
      });
      // Update team object for response
      team.status = 'solving';
    }

    // Get hint usage for this team/level
    const hintUsageSnapshot = await db
      .collection('hint_usage')
      .where('teamId', '==', teamId)
      .where('levelId', '==', levelDoc.id)
      .get();

    const hintsUsed = hintUsageSnapshot.size;
    const hintsUsedNumbers = hintUsageSnapshot.docs.map((doc) => doc.data().hintNumber);

    // Return level data (without revealing hints not yet used)
    return res.status(200).json({
      success: true,
      level: {
        id: levelDoc.id,
        number: levelData.number,
        title: levelData.title,
        description: levelData.description,
        basePoints: levelData.basePoints,
        flagFormat: levelData.flagFormat || 'CSBC{...}',
        category: levelData.category,
        challengeUrl: levelData.challengeUrl,
        fileUrl: levelData.fileUrl,
        fileName: levelData.fileName,
        hintsAvailable: levelData.hintsAvailable || 0,
        hintsUsed: hintsUsed,
        hintsUsedNumbers: hintsUsedNumbers,
        // Only return hints that have been used
        hints: levelData.hints
          ? levelData.hints.filter((h) => hintsUsedNumbers.includes(h.number))
          : [],
        timeLimit: levelData.timeLimit,
        isActive: levelData.isActive !== false,
      },
      isCheckedIn: isCheckedIn,
      checkInTime: isCheckedIn && checkInDoc.data() ? checkInDoc.data().checkedInAt : null,
      timeElapsed: team.currentLevelStartTime
        ? Math.floor((Date.now() - team.currentLevelStartTime) / 1000)
        : 0,
    });
  } catch (error) {
    console.error('[ParticipantController] Get level error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch level details',
    });
  }
};

/**
 * Request a hint for the current level
 * @route POST /api/participant/request-hint
 */
export const requestHint = async (req, res) => {
  try {
    const { teamId, levelId } = req.body;

    if (!teamId || !levelId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID and Level ID are required',
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

    // Get level data
    const level = await getLevel(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Level not found',
      });
    }

    // Check if team has checked in
    const checkInRef = db.collection('check_ins').doc(`${teamId}_${levelId}`);
    const checkInDoc = await checkInRef.get();
    if (!checkInDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'You must check in at the location first',
      });
    }

    // Check if team can request another hint
    const { canRequest, hintsUsed, hintsAvailable } = await canRequestHint(teamId, levelId, db);
    
    if (!canRequest) {
      return res.status(400).json({
        success: false,
        error: `No more hints available. You have used ${hintsUsed} of ${hintsAvailable} hints.`,
      });
    }

    // Get all hints for this level
    const allHints = await getLevelHints(levelId, db);
    if (!allHints || allHints.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No hints available for this level',
      });
    }

    // Get already used hint numbers for this team/level (team-scoped hints)
    const hintUsage = await getTeamHintUsage(teamId, levelId, db);
    const usedHintNumbers = hintUsage.map((h) => h.hintNumber);

    // Find the next available hint (lowest number not yet used)
    const nextHint = allHints
      .sort((a, b) => a.number - b.number)
      .find((h) => !usedHintNumbers.includes(h.number));

    if (!nextHint) {
      return res.status(400).json({
        success: false,
        status: 'no_more_hints',
        message: 'Your team has already used all available hints for this level',
        error: 'No more hints available',
      });
    }

    // Use a deterministic document ID to ensure one usage per team/level/hintNumber
    const usageDocId = `${teamId}_${levelId}_${nextHint.number}`;
    const usageRef = db.collection('hint_usage').doc(usageDocId);

    let createdNewUsage = false;

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(usageRef);

      if (existing.exists) {
        // Hint already recorded for this team/level/number - do NOT charge again
        createdNewUsage = false;
        return;
      }

      createdNewUsage = true;

      transaction.set(usageRef, {
        id: usageDocId,
        teamId,
        levelId,
        hintNumber: nextHint.number,
        hintContent: nextHint.content,
        usedAt: Date.now(),
      });
    });

    // Recompute hint usage after potential new record (for consistent penalties)
    const updatedHintUsage = createdNewUsage
      ? [...hintUsage, { hintNumber: nextHint.number }]
      : hintUsage;

    const penalty = calculateHintPenalty(updatedHintUsage, level);

    console.log(
      `[ParticipantController] Hint requested - Team: ${teamId}, Level: ${levelId}, Hint: #${nextHint.number}, createdNewUsage=${createdNewUsage}`
    );

    return res.status(200).json({
      success: true,
      hint: {
        number: nextHint.number,
        content: nextHint.content,
      },
      penalty: {
        type: level.hintType,
        // Only charge incremental penalty when a new usage was created
        points: createdNewUsage ? penalty.pointsPenalty : 0,
        time: createdNewUsage ? penalty.timePenalty : 0,
      },
      hintsRemaining: createdNewUsage
        ? hintsAvailable - (hintsUsed + 1)
        : hintsAvailable - hintsUsed,
      alreadyUsed: !createdNewUsage,
    });
  } catch (error) {
    console.error('[ParticipantController] Request hint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to request hint',
    });
  }
};

/**
 * FIX 2: REMOVED - Participants cannot update team status directly
 * State transitions must happen only via:
 * 1) QR check-in endpoint (MOVING → at_location)
 * 2) Successful flag submission (SOLVING → MOVING)
 * 3) Admin override endpoint
 * 
 * This endpoint is now BLOCKED for participants.
 * If needed for edge cases, it should be admin-only.
 */
export const updateTeamStatus = async (req, res) => {
  // FIX 2: Block participant-controlled state updates
  return res.status(403).json({
    success: false,
    error: 'Participants cannot update team status directly. State transitions are managed automatically by the backend.',
  });
};
