import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Trophy, LogIn, UserPlus, Zap, Activity, Home } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="relative terminal-window border-b border-neon-blue/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top status bar */}
        <div className="flex items-center justify-between py-2 border-b border-neon-blue/10 text-xs font-mono">
          <div className="flex items-center space-x-4 text-neon-green">
            <span className="flex items-center space-x-1">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </span>
            <span>CSBC-EVA v2.0</span>
          </div>
          <div className="text-cyan-400">
            {new Date().toLocaleString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <Shield className="h-10 w-10 text-neon-blue transition-all group-hover:text-neon-green" />
                <Zap className="h-4 w-4 text-neon-green absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <div className="text-xl font-cyber font-bold text-neon-blue group-hover:text-neon-green transition-colors">
                  MISSION EXPLOIT
                </div>
                <div className="text-xs text-cyan-400 font-mono tracking-wider">
                  // CTF PLATFORM v2.0
                </div>
              </div>
            </Link>

            <div className="hidden md:flex space-x-2">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 font-cyber text-sm transition-all border border-transparent ${
                  isActive('/')
                    ? 'border-neon-blue text-neon-blue bg-neon-blue/10 shadow-lg shadow-neon-blue/20'
                    : 'text-cyan-300 hover:text-neon-blue hover:border-neon-blue/50 hover:bg-neon-blue/5'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>HOME</span>
              </Link>

              <Link
                to="/leaderboard"
                className={`flex items-center space-x-2 px-4 py-2 font-cyber text-sm transition-all border border-transparent ${
                  isActive('/leaderboard')
                    ? 'border-neon-green text-neon-green bg-neon-green/10 shadow-lg shadow-neon-green/20'
                    : 'text-cyan-300 hover:text-neon-green hover:border-neon-green/50 hover:bg-neon-green/5'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>RANKINGS</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-6 py-2 font-cyber text-sm border border-neon-blue text-neon-blue hover:bg-neon-blue/10 transition-all group"
            >
              <LogIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>LOGIN</span>
            </button>

            <button
              onClick={() => navigate('/login?mode=signup')}
              className="flex items-center space-x-2 px-6 py-2 font-cyber text-sm bg-gradient-to-r from-neon-blue to-neon-green text-dark-900 hover:shadow-lg hover:shadow-neon-blue/50 transition-all group font-bold"
            >
              <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>SIGN UP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-pulse"></div>
    </nav>
  );
};

