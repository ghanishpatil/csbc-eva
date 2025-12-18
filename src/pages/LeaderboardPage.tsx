import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PublicLayout } from '@/components/PublicLayout';
import { Leaderboard } from '@/components/Leaderboard';
import { Trophy, TrendingUp, Target, Crown, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useAppStore } from '@/store/appStore';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, leaderboard } = useAppStore();
  const LayoutComponent = user ? Layout : PublicLayout;

  // Calculate stats
  const stats = useMemo(() => {
    const teamsWithScores = teams.filter(t => t.score && t.score > 0);
    const totalScore = teams.reduce((sum, t) => sum + (t.score || 0), 0);
    const activeTeams = teams.filter(t => t.status && t.status !== 'waiting').length;
    
    return {
      topTeams: leaderboard.length > 0 ? leaderboard.length : teamsWithScores.length,
      totalScore: totalScore.toLocaleString(),
      activeTeams,
    };
  }, [teams, leaderboard]);

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <PageHeader
          icon={Trophy}
          title="GLOBAL RANKINGS"
          subtitle="Real-time leaderboard tracking"
          status={{ label: "STATUS", value: "LIVE UPDATES", color: "green" }}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Trophy} label="Top Teams" value={String(stats.topTeams)} color="yellow" />
          <StatCard icon={TrendingUp} label="Total Score" value={stats.totalScore} color="purple" />
          <StatCard icon={Users} label="Active Teams" value={String(stats.activeTeams)} color="blue" />
        </div>

        {/* Leaderboard */}
        <CyberCard>
          <Leaderboard />
        </CyberCard>

        {/* Bottom Info */}
        {!user && (
          <CyberCard className="text-center">
            <Crown className="w-16 h-16 text-cyber-neon-yellow mx-auto mb-6" />
            <h3 className="text-3xl font-cyber font-bold text-cyber-text-primary mb-4">
              WANT TO COMPETE?
            </h3>
            <p className="text-cyber-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Join the cyber warfare platform to participate in challenges and climb the rankings
            </p>
            <NeonButton color="blue" icon={Target} onClick={() => navigate('/login')}>
              JOIN NOW
            </NeonButton>
          </CyberCard>
        )}
      </div>
    </LayoutComponent>
  );
};
