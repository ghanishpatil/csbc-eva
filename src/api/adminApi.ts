import axios from 'axios';
import { auth } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';

// Create axios instance
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase ID token to requests (replaces X-Admin-Key)
adminApi.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FIXED: Only log in development
    if (import.meta.env.DEV) {
      console.log(`[Admin API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIXED: Only log in development
    if (import.meta.env.DEV) {
      console.error('[Admin API] Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// LEVEL MANAGEMENT
// ============================================================================

export const createLevel = async (levelData: any) => {
  const response = await adminApi.post('/api/admin/create-level', levelData);
  return response.data;
};

export const updateLevel = async (levelId: string, updates: any) => {
  const response = await adminApi.post('/api/admin/update-level', {
    levelId,
    updates,
  });
  return response.data;
};

export const deleteLevel = async (levelId: string) => {
  const response = await adminApi.delete(`/api/admin/level/${levelId}`);
  return response.data;
};

/**
 * Set flag for a level (SECURE - flag is sent to backend for hashing)
 * @param levelId - The level ID
 * @param flag - The correct flag (will be hashed server-side)
 */
export const setFlag = async (levelId: string, flag: string) => {
  const response = await adminApi.post('/api/admin/set-flag', {
    levelId,
    flag,
  });
  return response.data;
};

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

export const createTeam = async (teamData: any) => {
  const response = await adminApi.post('/api/admin/create-team', teamData);
  return response.data;
};

export const updateTeam = async (teamId: string, updates: any) => {
  const response = await adminApi.post('/api/admin/update-team', {
    teamId,
    updates,
  });
  return response.data;
};

export const deleteTeam = async (teamId: string) => {
  const response = await adminApi.delete(`/api/admin/team/${teamId}`);
  return response.data;
};

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export const createGroup = async (groupData: any) => {
  const response = await adminApi.post('/api/admin/create-group', groupData);
  return response.data;
};

export const updateGroup = async (groupId: string, updates: any) => {
  const response = await adminApi.post('/api/admin/update-group', {
    groupId,
    updates,
  });
  return response.data;
};

export const deleteGroup = async (groupId: string) => {
  const response = await adminApi.delete(`/api/admin/group/${groupId}`);
  return response.data;
};

// ============================================================================
// ANNOUNCEMENT MANAGEMENT
// ============================================================================

export const createAnnouncement = async (announcementData: any) => {
  const response = await adminApi.post('/api/admin/create-announcement', announcementData);
  return response.data;
};

export const updateAnnouncement = async (announcementId: string, updates: any) => {
  const response = await adminApi.post('/api/admin/update-announcement', {
    announcementId,
    updates,
  });
  return response.data;
};

export const deleteAnnouncement = async (announcementId: string) => {
  const response = await adminApi.delete(`/api/admin/announcement/${announcementId}`);
  return response.data;
};

// ============================================================================
// SCORE MANAGEMENT
// ============================================================================

export const adjustScore = async (teamId: string, scoreChange: number, reason?: string) => {
  const response = await adminApi.post('/api/admin/update-score', {
    teamId,
    scoreChange,
    reason,
  });
  return response.data;
};

// ============================================================================
// PLATFORM STATISTICS
// ============================================================================

export const getPlatformStats = async () => {
  const response = await adminApi.get('/api/admin/stats');
  return response.data;
};

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

export const getRecentActivity = async (limit = 20) => {
  const response = await adminApi.get(`/api/admin/recent-activity?limit=${limit}`);
  return response.data;
};

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

export const resetCompetition = async (confirmationCode: string) => {
  const response = await adminApi.post('/api/admin/reset-competition', {
    confirmationCode,
  });
  return response.data;
};

// Event Control
export const startEvent = async () => {
  const response = await adminApi.post('/api/admin/start-event');
  return response.data;
};

export const stopEvent = async () => {
  const response = await adminApi.post('/api/admin/stop-event');
  return response.data;
};

export const pauseEvent = async () => {
  const response = await adminApi.post('/api/admin/pause-event');
  return response.data;
};

export const getEventStatus = async () => {
  const response = await adminApi.get('/api/admin/event-status');
  return response.data;
};

// ============================================================================
// USER IMPERSONATION
// ============================================================================

/**
 * Impersonate a user (login as participant/captain using their email)
 * Returns a custom token that can be used to sign in as the target user
 * @param email - The email of the user to impersonate
 */
export const impersonateUser = async (email: string) => {
  const response = await adminApi.post('/api/admin/impersonate-user', { email });
  return response.data;
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export interface UpdateUserRequest {
  userId: string;
  updates: {
    role?: 'admin' | 'captain' | 'player';
    displayName?: string;
    teamId?: string | null;
  };
}

export interface BlockUserRequest {
  userId: string;
  isBlocked: boolean;
}

/**
 * Update a user's information (role, displayName, teamId)
 */
export const updateUser = async (data: UpdateUserRequest) => {
  const response = await adminApi.post('/api/admin/update-user', data);
  return response.data;
};

/**
 * Block or unblock a user
 */
export const blockUser = async (data: BlockUserRequest) => {
  const response = await adminApi.post('/api/admin/block-user', data);
  return response.data;
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string) => {
  const response = await adminApi.delete(`/api/admin/user/${userId}`);
  return response.data;
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default adminApi;

