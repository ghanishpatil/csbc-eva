import { create } from 'zustand';

interface PlatformStats {
  totalTeams: number;
  activeTeams: number;
  totalLevels: number;
  activeLevels: number;
  totalSubmissions: number;
  totalUsers: number;
  totalScore: number;
  averageScore: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  teamId: string;
  levelId: string;
  finalScore: number;
  submittedAt: number;
}

interface AdminStore {
  // Platform stats
  platformStats: PlatformStats | null;
  setPlatformStats: (stats: PlatformStats) => void;

  // Recent activity
  recentActivity: RecentActivity[];
  setRecentActivity: (activity: RecentActivity[]) => void;

  // Backend health
  backendHealth: 'connected' | 'disconnected' | 'checking';
  setBackendHealth: (status: 'connected' | 'disconnected' | 'checking') => void;

  // Event state
  eventState: 'running' | 'paused' | 'ended';
  setEventState: (state: 'running' | 'paused' | 'ended') => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Selected entities
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;

  selectedLevelId: string | null;
  setSelectedLevelId: (id: string | null) => void;

  // Filters
  filters: {
    teamSearch: string;
    levelSearch: string;
    groupFilter: string;
  };
  setFilter: (key: string, value: string) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  // Platform stats
  platformStats: null,
  setPlatformStats: (stats) => set({ platformStats: stats }),

  // Recent activity
  recentActivity: [],
  setRecentActivity: (activity) => set({ recentActivity: activity }),

  // Backend health
  backendHealth: 'checking',
  setBackendHealth: (status) => set({ backendHealth: status }),

  // Event state
  eventState: 'running',
  setEventState: (state) => set({ eventState: state }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Selected entities
  selectedTeamId: null,
  setSelectedTeamId: (id) => set({ selectedTeamId: id }),

  selectedLevelId: null,
  setSelectedLevelId: (id) => set({ selectedLevelId: id }),

  // Filters
  filters: {
    teamSearch: '',
    levelSearch: '',
    groupFilter: 'all',
  },
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
}));

