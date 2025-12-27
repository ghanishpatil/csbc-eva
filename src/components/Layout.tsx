import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Shield, Trophy, Users, Terminal, Zap, Activity, Home, QrCode, Target, Radio, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut, isAdmin, isCaptain, isPlayer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('[ LOGOUT SUCCESSFUL ]');
      navigate('/login');
    } catch (error) {
      toast.error('[ LOGOUT FAILED ]');
    }
  };

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
              <span className="flex items-center space-x-1 text-cyber-neon-blue">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>REAL-TIME</span>
              </span>
              <span>CSBC-EVA v2.0</span>
            </div>
            <div className="text-cyber-text-secondary font-mono tabular-nums">
              {currentTime.toLocaleString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>

          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="relative">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-cyber-neon-blue transition-all group-hover:text-cyber-neon-green" />
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-cyber-neon-green absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-lg sm:text-xl font-cyber font-bold text-cyber-text-primary group-hover:text-cyber-neon-blue transition-colors">
                    MISSION EXPLOIT
                  </div>
                  <div className="text-xs text-cyber-text-secondary tracking-wider">
                    // CTF PLATFORM v2.0
                  </div>
                </div>
              </Link>

              <div className="hidden md:flex space-x-2">
                <Link
                  to="/leaderboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                    isActive('/leaderboard')
                      ? 'bg-cyber-neon-blue/10 text-cyber-neon-blue border border-cyber-neon-blue/40 shadow-neon-blue'
                      : 'text-cyber-text-secondary hover:text-cyber-neon-blue hover:border hover:border-cyber-neon-blue/30'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span>RANKINGS</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/admin/dashboard')
                        ? 'bg-cyber-neon-red/10 text-cyber-neon-red border border-cyber-neon-red/40 shadow-neon-red'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-red hover:border hover:border-cyber-neon-red/30'
                    }`}
                  >
                    <Terminal className="h-4 w-4" />
                    <span>CONTROL</span>
                  </Link>
                )}

                {isCaptain && (
                  <Link
                    to="/captain/levels"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/captain/levels')
                        ? 'bg-cyber-neon-purple/10 text-cyber-neon-purple border border-cyber-neon-purple/40 shadow-neon-blue'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-purple hover:border hover:border-cyber-neon-purple/30'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>MISSIONS</span>
                  </Link>
                )}

                {isPlayer && (
                  <>
                    <Link
                      to="/participant/dashboard"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                        isActive('/participant/dashboard')
                          ? 'bg-cyber-neon-green/10 text-cyber-neon-green border border-cyber-neon-green/40 shadow-neon-green'
                          : 'text-cyber-text-secondary hover:text-cyber-neon-green hover:border hover:border-cyber-neon-green/30'
                      }`}
                    >
                      <Home className="h-4 w-4" />
                      <span>DASHBOARD</span>
                    </Link>

                    <Link
                      to="/participant/check-in"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                        isActive('/participant/check-in')
                          ? 'bg-cyber-neon-blue/10 text-cyber-neon-blue border border-cyber-neon-blue/40 shadow-neon-blue'
                          : 'text-cyber-text-secondary hover:text-cyber-neon-blue hover:border hover:border-cyber-neon-blue/30'
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      <span>CHECK-IN</span>
                    </Link>

                    <Link
                      to="/participant/mission"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                        isActive('/participant/mission')
                          ? 'bg-cyber-neon-yellow/10 text-cyber-neon-yellow border border-cyber-neon-yellow/40 shadow-neon-yellow'
                          : 'text-cyber-text-secondary hover:text-cyber-neon-yellow hover:border hover:border-cyber-neon-yellow/30'
                      }`}
                    >
                      <Target className="h-4 w-4" />
                      <span>MISSION</span>
                    </Link>

                    <Link
                      to="/participant/team"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-cyber text-sm transition-all ${
                        isActive('/participant/team')
                          ? 'bg-cyber-neon-purple/10 text-cyber-neon-purple border border-cyber-neon-purple/40 shadow-neon-purple'
                          : 'text-cyber-text-secondary hover:text-cyber-neon-purple hover:border hover:border-cyber-neon-purple/30'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>TEAM</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {user && (
                <>
                  <div className="hidden sm:block text-right">
                    <div className="font-cyber text-sm text-cyber-text-primary">{user.displayName}</div>
                    <div className="text-xs font-mono text-cyber-text-secondary uppercase tracking-wider">
                      [ {user.role} ]
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 font-cyber text-sm border border-cyber-neon-red/60 text-cyber-neon-red rounded-lg hover:bg-cyber-neon-red/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>EXIT</span>
                  </button>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-cyber-text-secondary hover:text-cyber-neon-blue transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-cyber-border py-4 space-y-2 animate-in slide-in-from-top">
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                  isActive('/leaderboard')
                    ? 'bg-cyber-neon-blue/10 text-cyber-neon-blue border border-cyber-neon-blue/40'
                    : 'text-cyber-text-secondary hover:text-cyber-neon-blue hover:bg-cyber-neon-blue/5 border border-cyber-border/60'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>RANKINGS</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                    isActive('/admin/dashboard')
                      ? 'bg-cyber-neon-red/10 text-cyber-neon-red border border-cyber-neon-red/40'
                      : 'text-cyber-text-secondary hover:text-cyber-neon-red hover:bg-cyber-neon-red/5 border border-cyber-border/60'
                  }`}
                >
                  <Terminal className="h-4 w-4" />
                  <span>CONTROL</span>
                </Link>
              )}

              {isCaptain && (
                <Link
                  to="/captain/levels"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                    isActive('/captain/levels')
                      ? 'bg-cyber-neon-purple/10 text-cyber-neon-purple border border-cyber-neon-purple/40'
                      : 'text-cyber-text-secondary hover:text-cyber-neon-purple hover:bg-cyber-neon-purple/5 border border-cyber-border/60'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>MISSIONS</span>
                </Link>
              )}

              {isPlayer && (
                <>
                  <Link
                    to="/participant/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/participant/dashboard')
                        ? 'bg-cyber-neon-green/10 text-cyber-neon-green border border-cyber-neon-green/40'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-green hover:bg-cyber-neon-green/5 border border-cyber-border/60'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span>DASHBOARD</span>
                  </Link>

                  <Link
                    to="/participant/check-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/participant/check-in')
                        ? 'bg-cyber-neon-blue/10 text-cyber-neon-blue border border-cyber-neon-blue/40'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-blue hover:bg-cyber-neon-blue/5 border border-cyber-border/60'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>CHECK-IN</span>
                  </Link>

                  <Link
                    to="/participant/mission"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/participant/mission')
                        ? 'bg-cyber-neon-yellow/10 text-cyber-neon-yellow border border-cyber-neon-yellow/40'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-yellow hover:bg-cyber-neon-yellow/5 border border-cyber-border/60'
                    }`}
                  >
                    <Target className="h-4 w-4" />
                    <span>MISSION</span>
                  </Link>

                  <Link
                    to="/participant/team"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-cyber text-sm transition-all ${
                      isActive('/participant/team')
                        ? 'bg-cyber-neon-purple/10 text-cyber-neon-purple border border-cyber-neon-purple/40'
                        : 'text-cyber-text-secondary hover:text-cyber-neon-purple hover:bg-cyber-neon-purple/5 border border-cyber-border/60'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>TEAM</span>
                  </Link>
                </>
              )}

              {user && (
                <div className="pt-2 border-t border-cyber-border space-y-2">
                  <div className="px-4 py-2">
                    <div className="font-cyber text-sm text-cyber-text-primary">{user.displayName}</div>
                    <div className="text-xs font-mono text-cyber-text-secondary uppercase tracking-wider">
                      [ {user.role} ]
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 font-cyber text-sm border border-cyber-neon-red/60 text-cyber-neon-red rounded-lg hover:bg-cyber-neon-red/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>EXIT</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-cyber-border bg-[rgba(15,20,30,0.85)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs font-mono text-cyber-text-secondary">
            <div>CSBC Cybersecurity Club © {new Date().getFullYear()}</div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-cyber-neon-blue">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>LIVE DATA</span>
              </div>
              <div className="flex items-center space-x-2 text-cyber-neon-green">
                <div className="h-2 w-2 bg-cyber-neon-green rounded-full animate-pulse"></div>
                <span>SECURED</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

