import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Leaderboard } from '@/components/Leaderboard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Shield, Target, Trophy, Terminal, Activity, Users, Star, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';

export const Home: React.FC = () => {
  const { isAdmin, isCaptain, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect users to their respective portals
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isCaptain) {
        navigate('/captain/dashboard', { replace: true });
      } else if (user.role === 'player') {
        navigate('/participant/dashboard', { replace: true });
      }
    }
  }, [user, loading, isAdmin, isCaptain, navigate]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <PageHeader
          icon={Shield}
          title="WELCOME BACK"
          subtitle="Mission Control Dashboard"
          status={{ label: "STATUS", value: "ACTIVE", color: "green" }}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Target} label="Active Missions" value="12+" color="purple" />
          <StatCard icon={Users} label="Total Operators" value="100+" color="blue" />
          <StatCard icon={Activity} label="Your Submissions" value="0" color="green" />
          <StatCard icon={Star} label="Your Score" value="0" color="yellow" />
        </div>

        {/* User Info */}
        <CyberCard>
          <SectionTitle icon={Terminal} title="OPERATOR STATUS" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-cyber-text-secondary text-sm mb-1">OPERATOR ID</div>
              <div className="text-cyber-text-primary font-semibold">{user?.displayName || 'Unknown'}</div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-cyber-text-secondary text-sm mb-1">ACCESS LEVEL</div>
              <div className={`font-bold uppercase ${
                isAdmin ? 'text-cyber-neon-red' : isCaptain ? 'text-cyber-neon-purple' : 'text-cyber-neon-green'
              }`}>
                [ {user?.role} ]
              </div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-cyber-text-secondary text-sm mb-1">CONNECTION</div>
              <div className="text-cyber-neon-green font-bold flex items-center space-x-1">
                <div className="h-2 w-2 bg-cyber-neon-green rounded-full animate-pulse"></div>
                <span>SECURED</span>
              </div>
            </div>
          </div>
        </CyberCard>

        {/* Quick Actions */}
        <CyberCard>
          <SectionTitle icon={CheckCircle2} title="QUICK ACTIONS" />
          
          <div className="grid md:grid-cols-3 gap-6">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="bg-cyber-bg-darker border border-cyber-neon-red/30 hover:border-cyber-neon-red rounded-xl p-6 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-cyber-neon-red rounded-lg flex items-center justify-center mb-4 group-hover:shadow-neon-red transition-all">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-cyber font-bold text-cyber-text-primary mb-2">
                  CONTROL CENTER
                </h3>
                <p className="text-sm text-cyber-text-secondary">
                  Access admin dashboard
                </p>
              </button>
            )}
            
            {isCaptain && (
              <button
                onClick={() => navigate('/captain/levels')}
                className="bg-cyber-bg-darker border border-cyber-neon-purple/30 hover:border-cyber-neon-purple rounded-xl p-6 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-cyber-neon-purple rounded-lg flex items-center justify-center mb-4 group-hover:shadow-neon-blue transition-all">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-cyber font-bold text-cyber-text-primary mb-2">
                  ACTIVE MISSIONS
                </h3>
                <p className="text-sm text-cyber-text-secondary">
                  View and complete challenges
                </p>
              </button>
            )}
            
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-cyber-bg-darker border border-cyber-neon-green/30 hover:border-cyber-neon-green rounded-xl p-6 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-cyber-neon-green rounded-lg flex items-center justify-center mb-4 group-hover:shadow-neon-green transition-all">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-cyber font-bold text-cyber-text-primary mb-2">
                GLOBAL RANKINGS
              </h3>
              <p className="text-sm text-cyber-text-secondary">
                View competition leaderboard
              </p>
            </button>
          </div>
        </CyberCard>

        {/* Live Rankings */}
        <CyberCard>
          <div className="flex items-center justify-between mb-6">
            <SectionTitle icon={Trophy} title="LIVE RANKINGS" />
            <div className="flex items-center space-x-2 text-sm text-cyber-text-secondary">
              <Activity className="h-4 w-4 animate-pulse text-cyber-neon-green" />
              <span>REAL-TIME</span>
            </div>
          </div>
          <Leaderboard compact />
        </CyberCard>

        {/* Mission Brief */}
        <CyberCard>
          <SectionTitle icon={Shield} title="MISSION BRIEF" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="text-cyber-neon-blue font-bold mb-4 text-lg font-cyber">OBJECTIVE</div>
              <p className="text-cyber-text-secondary leading-relaxed">
                Infiltrate secure systems, exploit vulnerabilities, capture flags, 
                and earn points to climb the rankings.
              </p>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="text-cyber-neon-green font-bold mb-4 text-lg font-cyber">RULES</div>
              <p className="text-cyber-text-secondary leading-relaxed">
                Complete challenges within time limits. Request hints but beware 
                of point deductions. Team coordination is key.
              </p>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="text-cyber-neon-purple font-bold mb-4 text-lg font-cyber">REWARDS</div>
              <p className="text-cyber-text-secondary leading-relaxed">
                Top performers earn exclusive recognition. Every completed 
                challenge brings you closer to victory.
              </p>
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};
