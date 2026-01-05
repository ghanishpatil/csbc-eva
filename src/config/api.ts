/**
 * Centralized API Configuration
 * Single source of truth for backend URL
 */

// Get backend URL from environment variable
// IMPORTANT: Set VITE_BACKEND_URL in your .env file
// FIXED: Graceful fallback instead of crashing
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:8080' : '');

// Warn if backend URL is not set (but don't crash)
if (!BACKEND_URL && import.meta.env.DEV) {
  console.warn(
    '⚠️ VITE_BACKEND_URL is not set! Using fallback.\n' +
    'Please set it in your .env file for production.\n' +
    'Example: VITE_BACKEND_URL=http://localhost:8080'
  );
}

// Export the single constant URL
export const API_BASE_URL = BACKEND_URL;

// Admin token for admin API calls
export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  Backend URL:', API_BASE_URL);
  console.log('  Admin Token:', ADMIN_TOKEN ? '✓ Set' : '✗ Not set');
}

// Export configuration object
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;

