import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Trophy, LogIn, UserPlus, Zap, Activity } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-cyber-gradient text-cyber-text-primary relative">
      <div className="fixed inset-0 pointer-events-none opacity-10 grid-bg"></div>

      <nav className="sticky top-0 z-50 border-b border-cyber-border bg-[rgba(15,20,30,0.85)] backdrop-blur-xl shadow-cyber-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs font-mono text-cyber-text-secondary">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-cyber-neon-green">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>SYSTEM ONLINE</span>
              </span>
              <span>CSBC-EVA v2.0</span>
            </div>
            <div className="text-cyber-text-secondary">
              {new Date().toLocaleString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>

          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <Shield className="h-10 w-10 text-cyber-neon-blue transition-all group-hover:text-cyber-neon-green" />
                  <Zap className="h-4 w-4 text-cyber-neon-green absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <div className="text-xl font-cyber font-bold text-cyber-text-primary group-hover:text-cyber-neon-blue transition-colors">
                    MISSION EXPLOIT
                  </div>
                  <div className="text-xs text-cyber-text-secondary tracking-wider">
                    // CTF PLATFORM v2.0
                  </div>
                </div>
              </Link>

              <div className="hidden md:flex space-x-2">
                <Link
                  to="/"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                    isActive('/')
                      ? 'bg-cyber-neon-blue/10 text-cyber-neon-blue border border-cyber-neon-blue/40 shadow-neon-blue'
                      : 'text-cyber-text-secondary hover:text-cyber-neon-blue hover:border hover:border-cyber-neon-blue/30'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>HOME</span>
                </Link>

                <Link
                  to="/leaderboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                    isActive('/leaderboard')
                      ? 'bg-cyber-neon-green/10 text-cyber-neon-green border border-cyber-neon-green/40 shadow-neon-green'
                      : 'text-cyber-text-secondary hover:text-cyber-neon-green hover:border hover:border-cyber-neon-green/30'
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
                className="flex items-center space-x-2 px-6 py-2 rounded-lg font-cyber text-sm border border-cyber-neon-blue text-cyber-neon-blue hover:bg-cyber-neon-blue/10 transition-all group"
              >
                <LogIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>LOGIN</span>
              </button>

              <button
                onClick={() => navigate('/login?mode=signup')}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg font-cyber text-sm bg-gradient-to-r from-cyber-neon-blue to-cyber-neon-green text-dark-900 hover:shadow-neon-blue transition-all group font-bold"
              >
                <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>SIGN UP</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        {children}
      </main>

      <footer className="border-t border-cyber-border bg-[rgba(15,20,30,0.85)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs font-mono text-cyber-text-secondary space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-cyber-neon-blue" />
              <span>CSBC Cybersecurity Club © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1 text-cyber-neon-green">
                <div className="h-2 w-2 bg-cyber-neon-green rounded-full animate-pulse"></div>
                <span>CONNECTION SECURED</span>
              </span>
              <span className="text-cyber-neon-blue">MISSION EXPLOIT 2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

