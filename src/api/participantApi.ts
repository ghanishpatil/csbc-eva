import axios from 'axios';
import { auth } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';

// Create axios instance
const participantApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase ID token to requests
participantApi.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
participantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Participant API] Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// PARTICIPANT API METHODS
// ============================================================================

export interface CheckInRequest {
  teamId: string;
  levelId: string;
  qrCode: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  levelId: string;
  levelNumber: number;
  levelTitle: string;
  checkedInAt: number;
  error?: string;
}

/**
 * Verify QR check-in for a team at a location
 */
export const verifyCheckIn = async (data: CheckInRequest): Promise<CheckInResponse> => {
  const response = await participantApi.post('/api/participant/check-in', data);
  return response.data;
};

export interface TeamStatus {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  score: number;
  levelsCompleted: number;
  currentLevel: number;
  status: 'waiting' | 'at_location' | 'solving' | 'moving';
  timeElapsed: number;
  currentLevelStartTime?: number;
  isCheckedIn: boolean;
}

export interface CurrentLevel {
  id: string;
  number: number;
  title: string;
  description: string;
  basePoints: number;
  flagFormat: string;
  category?: string;
  challengeUrl?: string;
  fileUrl?: string;
  fileName?: string;
  hintsAvailable: number;
  hintsUsed: number;
  hintsUsedNumbers: number[];
  hints: Array<{ number: number; content: string }>;
  timeLimit?: number;
  isActive: boolean;
}

export interface TeamStatusResponse {
  success: boolean;
  team: TeamStatus;
  currentLevel: CurrentLevel | null;
  error?: string;
}

/**
 * Get current team status (level, status, timer, etc.)
 */
export const getTeamStatus = async (teamId: string): Promise<TeamStatusResponse> => {
  const response = await participantApi.get(`/api/participant/status/${teamId}`);
  return response.data;
};

export interface CurrentLevelResponse {
  success: boolean;
  level: CurrentLevel | null;
  checkInTime?: number;
  timeElapsed: number;
  message?: string;
  error?: string;
}

/**
 * Get current level details (only if checked in)
 */
export const getCurrentLevel = async (teamId: string): Promise<CurrentLevelResponse> => {
  const response = await participantApi.get(`/api/participant/level/${teamId}`);
  return response.data;
};

export interface UpdateStatusRequest {
  teamId: string;
  status: 'waiting' | 'at_location' | 'solving' | 'moving';
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Update team status
 */
export const updateTeamStatus = async (data: UpdateStatusRequest): Promise<UpdateStatusResponse> => {
  const response = await participantApi.post('/api/participant/update-status', data);
  return response.data;
};

/**
 * Submit flag (uses existing submit-flag endpoint)
 */
export interface SubmitFlagRequest {
  teamId: string;
  levelId: string;
  flag: string;
  timeTaken?: number;
  participantId: string;
}

export interface SubmitFlagResponse {
  success: boolean;
  status: 'correct' | 'incorrect';
  scoreAwarded?: number;
  breakdown?: {
    baseScore: number;
    hintsUsed: number;
    pointDeduction: number;
    timePenalty: number;
    finalScore: number;
  };
  submissionId?: string;
  nextLevel?: number;
  nextLocationClue?: string | null;
  message?: string;
  error?: string;
}

export const submitFlag = async (data: SubmitFlagRequest): Promise<SubmitFlagResponse> => {
  const response = await participantApi.post('/api/submit-flag', data);
  return response.data;
};

/**
 * Request hint (uses existing request-hint endpoint)
 */
export interface RequestHintRequest {
  teamId: string;
  levelId: string;
}

export interface RequestHintResponse {
  success: boolean;
  hint?: {
    number: number;
    content: string;
  };
  penalty?: {
    type: 'points' | 'time';
    points: number;
    time: number;
  };
  hintsRemaining?: number;
  error?: string;
}

export const requestHint = async (data: RequestHintRequest): Promise<RequestHintResponse> => {
  const response = await participantApi.post('/api/participant/request-hint', data);
  return response.data;
};

/**
 * Team Management APIs
 */
export interface CreateTeamRequest {
  teamName: string;
  creatorId: string;
}

export interface CreateTeamResponse {
  success: boolean;
  team?: {
    id: string;
    name: string;
    teamNumber: number;
    inviteCode: string;
  };
  message?: string;
  error?: string;
}

export const createTeam = async (data: CreateTeamRequest): Promise<CreateTeamResponse> => {
  const response = await participantApi.post('/api/participant/create-team', data);
  return response.data;
};

export interface JoinTeamRequest {
  inviteCode: string;
  participantId: string;
}

export interface JoinTeamResponse {
  success: boolean;
  team?: {
    id: string;
    name: string;
    teamNumber?: number;
  };
  message?: string;
  error?: string;
}

export const joinTeam = async (data: JoinTeamRequest): Promise<JoinTeamResponse> => {
  const response = await participantApi.post('/api/participant/join-team', data);
  return response.data;
};

export interface TeamDetails {
  id: string;
  name: string;
  teamNumber?: number;
  inviteCode: string;
  members: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  score: number;
  levelsCompleted: number;
  currentLevel: number;
  status: 'waiting' | 'at_location' | 'solving' | 'moving';
  createdAt: number;
}

export interface TeamDetailsResponse {
  success: boolean;
  team?: TeamDetails;
  error?: string;
}

export const getTeamDetails = async (teamId: string, participantId: string): Promise<TeamDetailsResponse> => {
  const response = await participantApi.get(`/api/participant/team/${teamId}`, {
    params: { participantId },
  });
  return response.data;
};

export interface LeaveTeamRequest {
  teamId: string;
  participantId: string;
}

export interface LeaveTeamResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const leaveTeam = async (data: LeaveTeamRequest): Promise<LeaveTeamResponse> => {
  const response = await participantApi.post('/api/participant/leave-team', data);
  return response.data;
};

