/**
 * Calculate the final score for a submission
 * @param {Object} params - Scoring parameters
 * @param {number} params.baseScore - Base points for the level
 * @param {number} params.hintsUsed - Number of hints used
 * @param {number} params.pointDeduction - Points deducted per hint (for points-based)
 * @param {number} params.timeTaken - Time taken in minutes
 * @param {number} params.timePenalty - Time penalty per hint in minutes (for time-based)
 * @param {string} params.hintType - Type of hint system ('points' or 'time')
 * @returns {Object} - Calculated scores and penalties
 */
export const calculateFinalScore = ({
  baseScore,
  hintsUsed = 0,
  pointDeduction = 0,
  timeTaken = 0,
  timePenalty = 0,
  hintType = 'points',
}) => {
  let finalScore = baseScore;
  let totalPointDeduction = 0;
  let totalTimePenalty = 0;
  
  if (hintType === 'points') {
    // Points-based hint system
    totalPointDeduction = hintsUsed * pointDeduction;
    finalScore = Math.max(0, baseScore - totalPointDeduction);
  } else if (hintType === 'time') {
    // Time-based hint system (doesn't affect score, only adds time penalty)
    totalTimePenalty = hintsUsed * timePenalty;
    // Score remains the same, but time penalty is tracked
  }
  
  return {
    finalScore: Math.round(finalScore),
    baseScore,
    pointDeduction: totalPointDeduction,
    timePenalty: totalTimePenalty,
    totalTime: timeTaken + totalTimePenalty,
  };
};

/**
 * Calculate team statistics
 * @param {Array} submissions - Array of team submissions
 * @returns {Object} - Team statistics
 */
export const calculateTeamStats = (submissions) => {
  if (!submissions || submissions.length === 0) {
    return {
      totalScore: 0,
      levelsCompleted: 0,
      averageTime: 0,
      totalHintsUsed: 0,
      totalTimePenalty: 0,
    };
  }
  
  const totalScore = submissions.reduce((sum, sub) => sum + (sub.finalScore || 0), 0);
  const levelsCompleted = submissions.length;
  const totalTime = submissions.reduce((sum, sub) => sum + (sub.timeTaken || 0), 0);
  const totalHintsUsed = submissions.reduce((sum, sub) => sum + (sub.hintsUsed || 0), 0);
  const totalTimePenalty = submissions.reduce((sum, sub) => sum + (sub.timePenalty || 0), 0);
  
  return {
    totalScore,
    levelsCompleted,
    averageTime: levelsCompleted > 0 ? totalTime / levelsCompleted : 0,
    totalHintsUsed,
    totalTimePenalty,
  };
};

/**
 * Validate scoring parameters
 * @param {Object} params - Parameters to validate
 * @returns {{isValid: boolean, error?: string}}
 */
export const validateScoringParams = (params) => {
  const { baseScore, hintsUsed, pointDeduction, timeTaken, timePenalty } = params;
  
  if (typeof baseScore !== 'number' || baseScore < 0) {
    return { isValid: false, error: 'Invalid base score' };
  }
  
  if (typeof hintsUsed !== 'number' || hintsUsed < 0) {
    return { isValid: false, error: 'Invalid hints used' };
  }
  
  if (typeof timeTaken !== 'number' || timeTaken < 0) {
    return { isValid: false, error: 'Invalid time taken' };
  }
  
  if (pointDeduction !== undefined && (typeof pointDeduction !== 'number' || pointDeduction < 0)) {
    return { isValid: false, error: 'Invalid point deduction' };
  }
  
  if (timePenalty !== undefined && (typeof timePenalty !== 'number' || timePenalty < 0)) {
    return { isValid: false, error: 'Invalid time penalty' };
  }
  
  return { isValid: true };
};


