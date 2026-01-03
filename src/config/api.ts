/**
 * Centralized API Configuration
 * Single source of truth for backend URL
 */

// Get backend URL from environment variable
// IMPORTANT: Set VITE_BACKEND_URL in your .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Validate that backend URL is set
if (!BACKEND_URL) {
  console.error(
    '❌ VITE_BACKEND_URL is not set! Please set it in your .env file.\n' +
    'Example: VITE_BACKEND_URL=http://localhost:5000'
  );
  throw new Error('Backend URL not configured. Check your .env file.');
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

