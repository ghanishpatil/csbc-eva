// User Roles
export type UserRole = 'admin' | 'captain' | 'player';

// Hint Types
export type HintType = 'points' | 'time';

// User Interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  institute?: string;
  branch?: string;
  year?: string;
  role: UserRole;
  teamId?: string;
  groupId?: string;
  createdAt: number;
  lastLoginAt?: number;
  isBlocked?: boolean;
}

// Team Interface
export interface Team {
  id: string;
  name: string;
  teamNumber?: number; // Auto-assigned sequential team number
  groupId: string;
  captainId: string;
  members: string[];
  score: number;
  levelsCompleted: number;
  timePenalty: number;
  currentLevel?: number; // Current level the team is on
  status?: 'waiting' | 'at_location' | 'solving' | 'moving'; // Team status
  currentLevelStartTime?: number; // When current level started
  lastCheckInAt?: number; // Last QR check-in time
  inviteCode?: string; // 6-character invite code for joining
  createdAt: number;
  updatedAt: number;
}

// Group Interface
export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  createdAt: number;
}

// Hint Interface
export interface Hint {
  number: number;
  content: string;
}

// Level Interface
export interface Level {
  id: string;
  groupId: string; // CRITICAL: Each mission belongs to a specific group
  number: number;
  title: string;
  description: string;
  basePoints: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  hintType: HintType;
  hintsAvailable: number;
  hints?: Hint[]; // Array of hint objects
  pointDeduction?: number; // For points-based hints
  timePenalty?: number; // For time-based hints (in minutes)
  flagFormat?: string;
  category?: string; // CTF category (Web, Crypto, Forensics, etc.)
  challengeUrl?: string; // URL to the challenge
  timeLimit?: number; // Time limit in minutes
  solves?: number; // Number of successful solves
  attempts?: number; // Total number of attempts
  fileUrl?: string; // URL to uploaded mission file (zip)
  fileName?: string; // Original filename
  fileSize?: number; // File size in bytes
  locationClue?: string; // Clue/riddle for the next location (shown after completing this level)
  qrCodeId?: string; // QR code ID for physical check-in at this mission
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Hint Usage Interface
export interface HintUsage {
  id: string;
  levelId: string;
  teamId: string;
  hintNumber: number;
  hintContent: string;
  usedAt: number;
  penalty: number; // Points or time depending on hint type
}

// Submission Interface
export interface Submission {
  id: string;
  teamId: string;
  levelId: string;
  levelTitle?: string; // Level title for display
  flag?: string;
  timeTaken: number; // in minutes
  hintsUsed: number;
  baseScore: number;
  pointDeduction: number;
  timePenalty: number;
  finalScore: number;
  scoreAwarded?: number; // Final score awarded (alias for finalScore)
  status?: 'correct' | 'incorrect'; // Submission status
  submittedAt: number;
  submittedBy: string; // Captain ID
}

// Leaderboard Entry Interface
export interface LeaderboardEntry {
  id: string; // Same as team ID
  teamId?: string;
  teamName: string;
  teamNumber?: number;
  groupId: string;
  score: number;
  levelsCompleted: number;
  totalTimeTaken?: number;
  totalTimePenalty: number;
  lastSubmissionAt?: number;
  lastUpdated?: number; // Alias for lastSubmissionAt
  rank?: number;
}

// Configuration Interface
export interface EventConfig {
  id: string;
  eventName: string;
  totalTeams: number;
  totalGroups: number;
  teamsPerGroup: number;
  totalLevels: number;
  isActive: boolean;
  status?: 'running' | 'paused' | 'stopped' | 'active';
  eventStatus?: 'running' | 'paused' | 'stopped' | 'active'; // Alias for status
  startTime?: number;
  endTime?: number;
  pausedAt?: number;
  pausedDuration?: number;
  createdAt: number;
  updatedAt: number;
}

// Form Types for Admin
export interface CreateTeamForm {
  numberOfTeams: number;
}

export interface CreateLevelForm {
  title: string;
  description: string;
  basePoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  hintType: HintType;
  hintsAvailable: number;
  pointDeduction?: number;
  timePenalty?: number;
  flagFormat?: string;
}

export interface UpdateTeamNameForm {
  teamId: string;
  newName: string;
}

// Captain Panel Types
export interface SubmitLevelForm {
  levelId: string;
  timeTaken: number;
  flag?: string;
}

export interface RequestHintForm {
  levelId: string;
}

// Statistics
export interface TeamStatistics {
  totalScore: number;
  levelsCompleted: number;
  hintsUsed: number;
  averageTime: number;
  rank: number;
}

