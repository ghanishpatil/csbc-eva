import axios from 'axios';
import { auth } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';

// Create axios instance with auth interceptor
export const captainApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add Firebase ID token to requests
captainApi.interceptors.request.use(
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

export interface GroupOverview {
  groupId: string;
  groupName: string;
  teams: Team[];
  levels: Level[];
  solveMatrix?: number[][]; // Team x Level solve matrix for heatmap
  stats: {
    totalScore: number;
    solves: number;
    hintsUsed: number;
    totalTeams: number;
    totalLevels: number;
  };
}

export interface Team {
  id: string;
  name: string;
  teamNumber?: number;
  groupId: string;
  score: number;
  levelsCompleted: number;
  hintsUsed?: number;
  status?: 'waiting' | 'at_location' | 'solving' | 'moving';
  members?: string[];
}

export interface Level {
  id: string;
  title: string;
  description: string;
  basePoints: number;
  difficulty: string;
  isActive: boolean;
}

export interface TeamDetail {
  teamId: string;
  teamName: string;
  score: number;
  levelsCompleted: number;
  solvedLevels: Array<{
    levelId: string;
    submittedAt: number;
    scoreAwarded: number;
    timeTaken: number;
    hintsUsed: number;
  }>;
  attempts: Array<{
    levelId: string;
    submittedAt: number;
    flagPrefix: string;
  }>;
  metrics: {
    avgSolveTime: number;
    totalHintsUsed: number;
    totalAttempts: number;
    solveRate: number;
  };
}

export interface SubmissionLog {
  id: string;
  teamId: string;
  teamName: string;
  levelId: string;
  status: 'correct' | 'incorrect';
  scoreAwarded: number;
  hintsUsed: number;
  submittedAt: number;
  timeTaken?: number;
  flagPrefix?: string;
}

export const captainApiClient = {
  /**
   * Get captain's assigned group overview
   */
  getGroupOverview: async (): Promise<GroupOverview> => {
    const response = await captainApi.get('/api/captain/group');
    return response.data.data;
  },

  /**
   * Get team detail (only if team belongs to captain's group)
   */
  getTeamDetail: async (teamId: string): Promise<TeamDetail> => {
    const response = await captainApi.get(`/api/captain/team/${teamId}`);
    return response.data.data;
  },

  /**
   * Get submission logs for captain's group
   */
  getSubmissionLogs: async (limit = 100): Promise<{ logs: SubmissionLog[]; count: number }> => {
    const response = await captainApi.get(`/api/captain/logs?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Send announcement to captain's group
   */
  sendAnnouncement: async (message: string): Promise<void> => {
    await captainApi.post('/api/captain/announce', { message });
  },
};

export default captainApiClient;
