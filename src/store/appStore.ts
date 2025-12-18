import { create } from 'zustand';
import { Team, Level, LeaderboardEntry, EventConfig, Group, Submission } from '@/types';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  isActive: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface AppState {
  teams: Team[];
  groups: Group[];
  levels: Level[];
  leaderboard: LeaderboardEntry[];
  submissions: Submission[];
  announcements: Announcement[];
  eventConfig: EventConfig | null;
  
  setTeams: (teams: Team[]) => void;
  setGroups: (groups: Group[]) => void;
  setLevels: (levels: Level[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setSubmissions: (submissions: Submission[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  setEventConfig: (config: EventConfig | null) => void;
  
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  updateLevel: (levelId: string, updates: Partial<Level>) => void;
  updateLeaderboardEntry: (entry: LeaderboardEntry) => void;
}

export const useAppStore = create<AppState>((set) => ({
  teams: [],
  groups: [],
  levels: [],
  leaderboard: [],
  submissions: [],
  announcements: [],
  eventConfig: null,
  
  setTeams: (teams) => set({ teams }),
  setGroups: (groups) => set({ groups }),
  setLevels: (levels) => set({ levels }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setSubmissions: (submissions) => set({ submissions }),
  setAnnouncements: (announcements) => set({ announcements }),
  setEventConfig: (eventConfig) => set({ eventConfig }),
  
  updateTeam: (teamId, updates) =>
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === teamId ? { ...team, ...updates } : team
      ),
    })),
  
  updateLevel: (levelId, updates) =>
    set((state) => ({
      levels: state.levels.map((level) =>
        level.id === levelId ? { ...level, ...updates } : level
      ),
    })),
  
  updateLeaderboardEntry: (entry) =>
    set((state) => ({
      leaderboard: state.leaderboard.map((item) =>
        item.id === entry.id ? entry : item
      ),
    })),
}));

