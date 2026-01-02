import { useEffect, useState, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface ConfigValidatorProps {
  children: ReactNode;
}

/**
 * Validates critical configuration at runtime (after component mount)
 * This prevents module-level errors that cause blank screens
 */
export const ConfigValidator: React.FC<ConfigValidatorProps> = ({ children }) => {
  const [configError, setConfigError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const errors: string[] = [];

    // Validate API configuration
    if (!API_BASE_URL || typeof API_BASE_URL !== 'string' || API_BASE_URL.trim() === '') {
      errors.push('VITE_BACKEND_URL environment variable is not set');
    }

    // Validate Firebase configuration
    const requiredFirebaseVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    const missingFirebaseVars: string[] = [];
    requiredFirebaseVars.forEach((varName) => {
      const value = import.meta.env[varName];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        missingFirebaseVars.push(varName);
      }
    });

    if (missingFirebaseVars.length > 0) {
      errors.push(`Missing Firebase environment variables: ${missingFirebaseVars.join(', ')}`);
    } else {
      // All vars are present - verify Firebase config format
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
      
      // Basic format validation to catch common mistakes
      if (apiKey && !apiKey.startsWith('AIza')) {
        errors.push('VITE_FIREBASE_API_KEY appears to be invalid (Firebase API keys typically start with "AIza")');
      }
      
      if (authDomain && !authDomain.includes('.firebaseapp.com') && !authDomain.includes('.web.app')) {
        errors.push('VITE_FIREBASE_AUTH_DOMAIN format may be incorrect (should be: project-id.firebaseapp.com or project-id.web.app)');
      }
      
      // Note: If all vars are present but Firebase still fails to initialize,
      // the ErrorBoundary will catch the error when components try to use Firebase
      // and display a helpful error message
    }

    if (errors.length > 0) {
      setConfigError(errors.join('\n'));
    }

    setIsValidating(false);
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-neon-blue font-mono text-sm">Validating configuration...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-8 max-w-2xl w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-4">
            Configuration Error
          </h1>

          <p className="text-gray-400 text-center mb-6">
            The application is missing required environment variables. Please configure them in your deployment platform.
          </p>

          <div className="bg-slate-900 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm font-mono whitespace-pre-line break-words">
              {configError}
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-semibold mb-2">How to fix:</h3>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Go to your deployment platform (Vercel, Netlify, etc.)</li>
              <li>Navigate to Project Settings → Environment Variables</li>
              <li>Add the missing variables listed above</li>
              <li>Redeploy your application</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
          >
            Reload Page
          </button>

          <p className="text-gray-500 text-xs text-center mt-4">
            If you've already set these variables, wait a moment and reload the page
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

