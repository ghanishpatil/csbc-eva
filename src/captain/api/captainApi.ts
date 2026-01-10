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
  number?: number; // Level number for sequential ordering
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
  levelTitle?: string;
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

  /**
   * Get manual submissions for a team in captain's group
   */
  getTeamManualSubmissions: async (teamId: string): Promise<{ submissions: ManualSubmission[]; count: number }> => {
    const response = await captainApi.get('/api/manual-submissions/team', {
      params: { teamId },
    });
    return response.data.data;
  },

  /**
   * Approve a manual submission
   */
  approveManualSubmission: async (submissionId: string): Promise<{ success: boolean; message?: string; data?: { submissionId: string; scoreAwarded: number } }> => {
    const response = await captainApi.post(`/api/manual-submissions/${submissionId}/approve`);
    return response.data;
  },

  /**
   * Reject a manual submission
   */
  rejectManualSubmission: async (submissionId: string, reason?: string): Promise<{ success: boolean; message?: string }> => {
    const response = await captainApi.post(`/api/manual-submissions/${submissionId}/reject`, { reason });
    return response.data;
  },
};

export interface ManualSubmission {
  id: string;
  teamId: string;
  teamName: string;
  levelId: string;
  levelTitle: string;
  flag: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: number;
  decision?: 'approved' | 'rejected';
  rejectionReason?: string;
  scoreAwarded?: number;
}

export default captainApiClient;
