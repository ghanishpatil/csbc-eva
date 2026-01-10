import { getFirestore } from '../utils/firebase.js';

/**
 * Get captain's assigned group overview
 * @route GET /api/captain/group
 */
export const getGroupOverview = async (req, res) => {
  try {
    const { captain } = req;
    const db = getFirestore();

    // Get all teams in captain's group
    const teamsSnapshot = await db.collection('teams')
      .where('groupId', '==', captain.groupId)
      .get();

    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all levels
    const levelsSnapshot = await db.collection('levels')
      .where('isActive', '==', true)
      .get();

    const levels = levelsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get submissions for teams in this group
    // Firestore 'in' operator has a limit of 10, so we need to batch queries
    const teamIds = teams.map(t => t.id);
    let allSubmissions = [];
    
    if (teamIds.length > 0) {
      // Batch queries if more than 10 teams
      for (let i = 0; i < teamIds.length; i += 10) {
        const batch = teamIds.slice(i, i + 10);
        const snapshot = await db.collection('submissions')
          .where('teamId', 'in', batch)
          .get();
        allSubmissions.push(...snapshot.docs);
      }
    }
    
    const submissions = allSubmissions.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Aggregate per-team hint usage (sum of hintsUsed across all submissions)
    const hintsPerTeam = {};
    submissions.forEach((s) => {
      const teamId = s.teamId;
      if (!teamId) return;
      const used = s.hintsUsed || 0;
      if (!used) return;
      hintsPerTeam[teamId] = (hintsPerTeam[teamId] || 0) + used;
    });

    // Attach hintsUsed to each team object (total hints this team has used in the group)
    const teamsWithHints = teams.map((team) => ({
      ...team,
      hintsUsed: hintsPerTeam[team.id] || 0,
    }));

    // Calculate stats
    const totalScore = teamsWithHints.reduce((sum, team) => sum + (team.score || 0), 0);
    const correctSubmissions = submissions.filter(s => s.status === 'correct');
    const solves = correctSubmissions.length;
    const totalHintsUsed = Object.values(hintsPerTeam).reduce((sum, v) => sum + v, 0);

    // Calculate solve matrix for heatmap (team x level)
    const solveMatrix = teamsWithHints.map(team => {
      const teamSubmissions = submissions.filter(s => s.teamId === team.id && s.status === 'correct');
      return levels.map(level => {
        const solved = teamSubmissions.some(s => s.levelId === level.id);
        return solved ? 1 : 0;
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        groupId: captain.groupId,
        groupName: captain.groupData.name || `Group ${captain.groupId}`,
        teams: teamsWithHints,
        levels,
        solveMatrix, // Add solve matrix for heatmap
        stats: {
          totalScore,
          solves,
          hintsUsed: totalHintsUsed,
          totalTeams: teams.length,
          totalLevels: levels.length,
        },
      },
    });
  } catch (error) {
    console.error('[CaptainController] Get group overview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch group overview',
    });
  }
};

/**
 * Get team detail (only if team belongs to captain's group)
 * @route GET /api/captain/team/:teamId
 */
export const getTeamDetail = async (req, res) => {
  try {
    const { captain } = req;
    const { teamId } = req.params;
    const db = getFirestore();

    // Verify team belongs to captain's group
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const teamData = teamDoc.data();
    if (teamData.groupId !== captain.groupId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Team does not belong to your group',
      });
    }

    // Get team submissions
    const submissionsSnapshot = await db.collection('submissions')
      .where('teamId', '==', teamId)
      .orderBy('submittedAt', 'desc')
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get solved levels
    const solvedLevels = submissions
      .filter(s => s.status === 'correct')
      .map(s => ({
        levelId: s.levelId,
        submittedAt: s.submittedAt,
        scoreAwarded: s.scoreAwarded,
        timeTaken: s.timeTaken,
        hintsUsed: s.hintsUsed || 0,
      }));

    // Get attempts (wrong submissions)
    const attempts = submissions
      .filter(s => s.status === 'incorrect')
      .map(s => ({
        levelId: s.levelId,
        submittedAt: s.submittedAt,
        flagPrefix: s.flag ? s.flag.substring(0, 8) + '...' : 'N/A', // Only show prefix for security
      }));

    // Calculate metrics
    const totalTime = submissions
      .filter(s => s.status === 'correct')
      .reduce((sum, s) => sum + (s.timeTaken || 0), 0);

    const avgTime = solvedLevels.length > 0 ? Math.round(totalTime / solvedLevels.length) : 0;
    const totalHintsUsed = submissions.reduce((sum, s) => sum + (s.hintsUsed || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        teamId,
        teamName: teamData.name,
        score: teamData.score || 0,
        levelsCompleted: teamData.levelsCompleted || 0,
        solvedLevels,
        attempts,
        metrics: {
          avgSolveTime: avgTime,
          totalHintsUsed,
          totalAttempts: attempts.length,
          solveRate: submissions.length > 0 
            ? Math.round((solvedLevels.length / submissions.length) * 100) 
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('[CaptainController] Get team detail error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team detail',
    });
  }
};

/**
 * Get submission logs for captain's group
 * @route GET /api/captain/logs
 */
export const getSubmissionLogs = async (req, res) => {
  try {
    const { captain } = req;
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 100;

    // Get all teams in captain's group
    const teamsSnapshot = await db.collection('teams')
      .where('groupId', '==', captain.groupId)
      .get();

    const teamIds = teamsSnapshot.docs.map(doc => doc.id);

    if (teamIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          logs: [],
          count: 0,
        },
      });
    }

    // Get submissions for these teams
    // Firestore 'in' operator has a limit of 10, so we need to batch queries
    let allSubmissions = [];
    for (let i = 0; i < teamIds.length; i += 10) {
      const batch = teamIds.slice(i, i + 10);
      const snapshot = await db.collection('submissions')
        .where('teamId', 'in', batch)
        .get();
      allSubmissions.push(...snapshot.docs);
    }
    
    // Get all unique level IDs from submissions
    const levelIds = [...new Set(allSubmissions.map(doc => doc.data().levelId).filter(Boolean))];
    
    // Fetch level data to get level names (fetch each level document)
    const levelMap = {};
    if (levelIds.length > 0) {
      // Use Promise.all to fetch all levels in parallel for better performance
      const levelPromises = levelIds.map(async (levelId) => {
        try {
          const levelDoc = await db.collection('levels').doc(levelId).get();
          if (levelDoc.exists) {
            const levelData = levelDoc.data();
            return {
              id: levelId,
              title: levelData.title || `Level ${levelData.number || 'N/A'}`,
            };
          }
          return { id: levelId, title: `Level ${levelId.substring(0, 8)}...` };
        } catch (error) {
          console.error(`[CaptainController] Error fetching level ${levelId}:`, error);
          return { id: levelId, title: `Level ${levelId.substring(0, 8)}...` };
        }
      });
      
      const levelResults = await Promise.all(levelPromises);
      levelResults.forEach(({ id, title }) => {
        levelMap[id] = title;
      });
    }
    
    // Sort and limit in memory (since we can't use orderBy with batched queries)
    allSubmissions.sort((a, b) => (b.data().submittedAt || 0) - (a.data().submittedAt || 0));
    const submissionsSnapshot = {
      docs: allSubmissions.slice(0, limit)
    };

    const logs = submissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        teamName: teamsSnapshot.docs.find(t => t.id === data.teamId)?.data()?.name || 'Unknown',
        levelId: data.levelId,
        levelTitle: levelMap[data.levelId] || `Level ${data.levelId?.substring(0, 8) || 'Unknown'}`,
        status: data.status,
        scoreAwarded: data.scoreAwarded || 0,
        hintsUsed: data.hintsUsed || 0,
        submittedAt: data.submittedAt,
        timeTaken: data.timeTaken,
        // Don't expose actual flags
        flagPrefix: data.flag ? data.flag.substring(0, 8) + '...' : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        logs,
        count: logs.length,
      },
    });
  } catch (error) {
    console.error('[CaptainController] Get submission logs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission logs',
    });
  }
};

/**
 * Send announcement to captain's group (optional)
 * @route POST /api/captain/announce
 */
export const sendAnnouncement = async (req, res) => {
  try {
    const { captain } = req;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const db = getFirestore();

    // Create announcement document
    await db.collection('announcements').add({
      groupId: captain.groupId,
      message: message.trim(),
      sentBy: captain.userId,
      sentAt: Date.now(),
      type: 'group', // Group-specific announcement
    });

    return res.status(200).json({
      success: true,
      message: 'Announcement sent successfully',
    });
  } catch (error) {
    console.error('[CaptainController] Send announcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send announcement',
    });
  }
};


