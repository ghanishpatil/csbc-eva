import { create } from 'zustand';
import { firestoreAPI } from '@/utils/firestore';
import { Level, Submission, LeaderboardEntry } from '@/types';

interface CaptainState {
  teamId?: string;
  teamName?: string;
  levels: Level[];
  submissions: Submission[];
  leaderboard: LeaderboardEntry[];
  activity: Submission[];
  loading: boolean;
  error?: string;
  setTeamId: (teamId: string) => void;
  loadData: (teamId: string) => Promise<void>;
}

export const useCaptainStore = create<CaptainState>((set, get) => ({
  teamId: undefined,
  teamName: undefined,
  levels: [],
  submissions: [],
  leaderboard: [],
  activity: [],
  loading: false,
  error: undefined,

  setTeamId: (teamId) => set({ teamId }),

  loadData: async (teamId: string) => {
    set({ loading: true, error: undefined });
    try {
      // Firestore reads for levels, submissions, leaderboard
      const [levels, submissions, leaderboard] = await Promise.all([
        firestoreAPI.getLevels(),
        firestoreAPI.getTeamSubmissions(teamId),
        firestoreAPI.getLeaderboard(),
      ]);

      // Derive activity from submissions (team-only)
      const activity = submissions
        .filter((s) => s.teamId === teamId)
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

      set({
        levels: levels || [],
        submissions: submissions || [],
        leaderboard: leaderboard || [],
        activity,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to load captain data', loading: false });
    }
  },
}));

