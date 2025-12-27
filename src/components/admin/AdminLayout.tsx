import { ReactNode, useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import { LogOut, Shield, Activity, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { backendHealth } = useAdminStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient text-cyber-text-primary relative">
      <div className="fixed inset-0 pointer-events-none opacity-10 grid-bg"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-cyber-border bg-[rgba(15,20,30,0.9)] backdrop-blur-xl shadow-cyber-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-cyber-neon-red/15 flex items-center justify-center">
                  <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-cyber-neon-red" />
                </div>
                <div className="absolute inset-0 rounded-xl blur-xl bg-cyber-neon-red/10"></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-cyber font-bold text-cyber-text-primary truncate">
                  ADMIN CONTROL CENTER
                </h1>
                <p className="text-xs text-cyber-text-secondary">Mission Exploit 2.0</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-cyber-text-primary font-semibold truncate max-w-[120px]">{user?.displayName || 'Admin'}</p>
                <p className="text-xs text-cyber-text-secondary capitalize">{user?.role || 'admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-cyber text-xs sm:text-sm border border-cyber-neon-red/60 text-cyber-neon-red hover:bg-cyber-neon-red/10 transition-all"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3 text-[10px] sm:text-xs text-cyber-text-secondary">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span
                className={`flex items-center space-x-1 ${
                  backendHealth === 'connected'
                    ? 'text-cyber-neon-green'
                    : backendHealth === 'disconnected'
                    ? 'text-cyber-neon-red'
                    : 'text-yellow-400'
                }`}
              >
                <Activity className="h-3 w-3 animate-pulse flex-shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Backend: </span>
                  {backendHealth === 'connected'
                    ? 'Connected'
                    : backendHealth === 'disconnected'
                    ? 'Offline'
                    : 'Checking...'}
                </span>
              </span>
              <span className="hidden sm:flex items-center space-x-1 text-cyber-neon-blue">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>REAL-TIME</span>
              </span>
              <span className="hidden md:inline">CSBC-EVA Admin Suite</span>
            </div>
            <div className="font-mono tabular-nums text-[10px] sm:text-xs">
              {currentTime.toLocaleString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdminNav />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {children}
      </div>

      {/* Footer */}
      <div className="border-t border-cyber-border bg-[rgba(15,20,30,0.85)] backdrop-blur-xl mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-cyber-text-secondary">
            <p>© {new Date().getFullYear()} CSBC Cybersecurity Club - Mission Exploit 2.0</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-cyber-neon-blue">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>LIVE DATA</span>
              </span>
              <span className={`flex items-center space-x-1 ${
                backendHealth === 'connected' ? 'text-cyber-neon-green' : 'text-cyber-neon-red'
              }`}>
                <span className={`h-2 w-2 rounded-full animate-pulse ${
                  backendHealth === 'connected' ? 'bg-cyber-neon-green' : 'bg-cyber-neon-red'
                }`}></span>
                <span>{backendHealth === 'connected' ? 'BACKEND OK' : 'BACKEND OFFLINE'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

