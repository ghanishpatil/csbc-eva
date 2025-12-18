/**
 * Format timestamp to readable date/time
 * Handles invalid timestamps gracefully
 */
export const formatDate = (timestamp: number | string | undefined | null): string => {
  if (!timestamp) return '—';
  
  // Handle string timestamps
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  
  // Check if valid number
  if (isNaN(ts) || ts <= 0) return '—';
  
  const date = new Date(ts);
  
  // Check if valid date
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time in minutes to readable format
 */
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Generate team name
 */
export const generateTeamName = (index: number): string => {
  return `Team ${index + 1}`;
};

/**
 * Generate group name
 */
export const generateGroupName = (index: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `Group ${letters[index] || index + 1}`;
};

/**
 * Distribute teams into groups
 */
export const distributeTeamsIntoGroups = (
  totalTeams: number,
  totalGroups: number
): number[][] => {
  const teamsPerGroup = Math.ceil(totalTeams / totalGroups);
  const groups: number[][] = Array.from({ length: totalGroups }, () => []);
  
  for (let i = 0; i < totalTeams; i++) {
    const groupIndex = Math.floor(i / teamsPerGroup);
    if (groupIndex < totalGroups) {
      groups[groupIndex].push(i);
    }
  }
  
  return groups;
};

/**
 * Get difficulty color
 */
export const getDifficultyColor = (
  difficulty: 'easy' | 'medium' | 'hard'
): string => {
  const colors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };
  return colors[difficulty];
};

/**
 * Get rank color
 */
export const getRankColor = (rank: number): string => {
  if (rank === 1) return 'text-yellow-600';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-orange-600';
  return 'text-gray-600';
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

