import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute Component
 * 
 * IMPORTANT SECURITY NOTE:
 * ========================
 * This component provides UI-level route protection ONLY.
 * It is NOT a security mechanism.
 * 
 * - Hash routing (#/admin, #/captain, #/participant) is for UI navigation ONLY
 * - Anyone can type any URL - the frontend cannot enforce security
 * - ALL security is enforced by the BACKEND via:
 *   - verifyAdmin middleware
 *   - verifyCaptain middleware  
 *   - verifyParticipant middleware
 * 
 * The backend ALWAYS:
 * 1. Verifies Firebase ID token
 * 2. Checks user role in database
 * 3. Returns 401/403 for unauthorized access
 * 
 * The frontend ONLY:
 * 1. Fetches user role from backend/Firestore on auth
 * 2. Renders appropriate UI based on role
 * 3. Shows "Access Denied" if route doesn't match role
 * 
 * URL hash routing does NOT equal authorization.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Loading state - verifying authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg">
        <div className="text-center terminal-window p-12">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-neon-blue font-cyber font-bold text-xl">AUTHENTICATING...</p>
          <p className="text-cyan-400 font-mono text-sm mt-2">// Verifying credentials with backend</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Save the attempted URL to redirect after login (use hash path)
    const currentPath = location.pathname;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    return <Navigate to="/login" replace />;
  }

  // User authenticated but role doesn't match - show Access Denied
  // NOTE: This is UI-only. Backend STILL enforces all permissions via middleware.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const getCorrectPath = () => {
      switch (user.role) {
        case 'admin': return '/admin';
        case 'captain': return '/captain/dashboard';
        case 'player': return '/participant/dashboard';
        default: return '/home';
      }
    };

    const getRoleLabel = () => {
      switch (user.role) {
        case 'admin': return 'Administrator';
        case 'captain': return 'Group Captain';
        case 'player': return 'Participant';
        default: return 'User';
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg p-4">
        <div className="terminal-window p-8 max-w-lg w-full text-center">
          {/* Access Denied Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-red-500/30 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldX className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-cyber font-bold text-red-500 mb-2">
            ACCESS DENIED
          </h1>
          <p className="text-cyan-400 font-mono text-sm mb-6">
            // ERROR 403: INSUFFICIENT PERMISSIONS
          </p>

          {/* Explanation */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-gray-300 text-sm mb-2">
              You are logged in as: <span className="text-neon-blue font-semibold">{getRoleLabel()}</span>
            </p>
            <p className="text-gray-300 text-sm mb-2">
              This page requires: <span className="text-red-400 font-semibold">{allowedRoles?.join(' or ').toUpperCase()}</span> role
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Note: All access permissions are enforced by the backend server.
              URL routing is for navigation purposes only.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(getCorrectPath())}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-green text-dark-900 font-cyber font-bold rounded-lg hover:shadow-lg hover:shadow-neon-blue/50 transition-all"
            >
              <Home className="w-4 h-4" />
              Go to My Portal
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white font-cyber rounded-lg hover:bg-slate-600 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User authenticated and has correct role - render children
  return <>{children}</>;
};

