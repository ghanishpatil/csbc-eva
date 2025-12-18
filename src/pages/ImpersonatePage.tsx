import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { LogIn, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const ImpersonatePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    const handleImpersonation = async () => {
      const token = searchParams.get('token');
      const role = searchParams.get('role');

      if (!token) {
        setStatus('error');
        setMessage('No authentication token provided');
        return;
      }

      try {
        setMessage('Signing in as user...');
        
        // Sign out any existing user first
        if (auth.currentUser) {
          await auth.signOut();
        }

        // Sign in with the custom token
        await signInWithCustomToken(auth, token);
        
        setStatus('success');
        setMessage('Successfully logged in! Redirecting...');

        // Redirect based on role after a short delay
        setTimeout(() => {
          if (role === 'captain') {
            navigate('/captain/dashboard', { replace: true });
          } else {
            navigate('/participant/dashboard', { replace: true });
          }
        }, 1500);
      } catch (error: any) {
        console.error('Impersonation error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to authenticate');
      }
    };

    handleImpersonation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      <div className="bg-cyber-bg-card border border-cyber-border rounded-2xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className={`h-20 w-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
          status === 'loading' ? 'bg-cyan-600/20 border border-cyan-500/50' :
          status === 'success' ? 'bg-green-600/20 border border-green-500/50' :
          'bg-red-600/20 border border-red-500/50'
        }`}>
          {status === 'loading' ? (
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle className="h-10 w-10 text-green-400" />
          ) : (
            <AlertCircle className="h-10 w-10 text-red-400" />
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          status === 'loading' ? 'text-cyan-400' :
          status === 'success' ? 'text-green-400' :
          'text-red-400'
        }`}>
          {status === 'loading' ? 'IMPERSONATING USER' :
           status === 'success' ? 'LOGIN SUCCESSFUL' :
           'AUTHENTICATION FAILED'}
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-6">{message}</p>

        {/* Admin Warning */}
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
            <LogIn className="h-4 w-4" />
            <span>Admin Impersonation Session</span>
          </div>
          <p className="text-yellow-300/70 text-xs mt-2">
            This is an admin bypass session. All actions are logged.
          </p>
        </div>

        {/* Error retry */}
        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
};

export default ImpersonatePage;

