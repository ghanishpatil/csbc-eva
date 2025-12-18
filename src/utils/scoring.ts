import { Level, HintType } from '@/types';

/**
 * Calculate final score based on level, hints used, and time taken
 */
export const calculateScore = (
  basePoints: number,
  hintsUsed: number,
  timeTaken: number,
  hintType: HintType,
  pointDeduction: number = 0,
  timePenalty: number = 0
): {
  finalScore: number;
  pointDeduction: number;
  timePenalty: number;
} => {
  let calculatedPointDeduction = 0;
  let calculatedTimePenalty = 0;

  if (hintType === 'points') {
    // Points-based hints
    calculatedPointDeduction = hintsUsed * pointDeduction;
    calculatedTimePenalty = 0;
  } else {
    // Time-based hints
    calculatedTimePenalty = hintsUsed * timePenalty;
    calculatedPointDeduction = 0;
  }

  // Calculate final score
  const finalScore = Math.max(0, basePoints - calculatedPointDeduction);

  return {
    finalScore,
    pointDeduction: calculatedPointDeduction,
    timePenalty: calculatedTimePenalty,
  };
};

/**
 * Generate hint content based on level and hint number
 */
export const generateHintContent = (level: Level, hintNumber: number): string => {
  // This is a placeholder. In production, hints would be stored in the level data
  const hints: Record<number, string> = {
    1: `Hint ${hintNumber}: Look for common vulnerabilities in the code.`,
    2: `Hint ${hintNumber}: Check the network requests for exposed data.`,
    3: `Hint ${hintNumber}: Consider using enumeration techniques.`,
  };

  return hints[hintNumber] || `Hint ${hintNumber}: Keep investigating!`;
};

/**
 * Validate flag format
 */
export const validateFlag = (flag: string, expectedFormat?: string): boolean => {
  if (!expectedFormat) return true;
  
  // Simple regex validation
  try {
    const regex = new RegExp(expectedFormat);
    return regex.test(flag);
  } catch {
    return true;
  }
};

/**
 * Calculate team statistics
 */
export const calculateTeamStats = (
  totalScore: number,
  levelsCompleted: number,
  totalTime: number,
  rank: number
) => {
  const averageTime = levelsCompleted > 0 ? totalTime / levelsCompleted : 0;
  
  return {
    totalScore,
    levelsCompleted,
    averageTime: Math.round(averageTime * 100) / 100,
    rank,
  };
};

