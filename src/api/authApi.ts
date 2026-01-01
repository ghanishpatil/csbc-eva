import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const authApi = axios.create({
  baseURL: API_BASE_URL || undefined, // undefined is valid for axios.create, will fail at request time
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RegisterUserRequest {
  idToken: string;
  userData: {
    email: string;
    displayName: string;
    phone?: string;
    institute?: string;
    branch?: string;
    year?: number | null;
    role?: 'player' | 'captain' | 'admin';
  };
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  userId?: string;
  error?: string;
}

/**
 * Register a new user (create Firestore user document)
 * Requires Firebase ID token from authenticated user
 */
export const registerUser = async (data: RegisterUserRequest): Promise<RegisterUserResponse> => {
  const response = await authApi.post('/api/auth/register', data);
  return response.data;
};

