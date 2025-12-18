import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { captainApiClient, GroupOverview } from '@/captain/api/captainApi';
import { Trophy, Medal, Award, Eye, Target, Users, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const GroupLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupData, setGroupData] = useState<GroupOverview | null>(null);

  useEffect(() => {
    loadGroupData();
  }, []);

  const loadGroupData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await captainApiClient.getGroupOverview();
      setGroupData(data);
    } catch (error: any) {
      console.error('Error loading group data:', error);
      if (!isRefresh) {
        toast.error(error.response?.data?.error || 'Failed to load leaderboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadGroupData(true);
  };

  if (loading) {
    return (
      <Layout>
        <CaptainNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  if (!groupData) {
    return (
      <Layout>
        <CaptainNavbar />
        <CyberCard>
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-cyber-text-secondary/30 mx-auto mb-4" />
            <p className="text-cyber-text-secondary text-lg">No leaderboard data available.</p>
            <p className="text-cyber-text-secondary/60 text-sm mt-2">Check if you are assigned to a group.</p>
          </div>
        </CyberCard>
      </Layout>
    );
  }

  const { teams, groupName } = groupData;
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));
  const totalScore = sortedTeams.reduce((acc, t) => acc + (t.score || 0), 0);
  const totalLevelsCompleted = sortedTeams.reduce((acc, t) => acc + (t.levelsCompleted || 0), 0);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-7 w-7 text-cyber-neon-yellow animate-pulse" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-500" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-cyber-neon-yellow/20 to-amber-500/10 border-cyber-neon-yellow/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30';
    return 'border-cyber-border hover:border-cyber-border-light';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={Trophy}
          title={`${groupName} LEADERBOARD`}
          subtitle="Team rankings within your group (Read-only)"
          status={{ label: 'STATUS', value: 'LIVE', color: 'green' }}
          action={
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-secondary hover:text-cyber-text-primary hover:border-cyber-border-light transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Teams in Group" value={sortedTeams.length} color="blue" />
          <StatCard icon={TrendingUp} label="Total Score" value={totalScore.toLocaleString()} color="yellow" />
          <StatCard icon={Target} label="Missions Completed" value={totalLevelsCompleted} color="green" />
        </div>

        <CyberCard>
          <div className="flex items-center justify-between mb-6">
            <SectionTitle icon={Trophy} title="Group Rankings" subtitle={`${sortedTeams.length} teams competing`} />
            <div className="flex items-center space-x-2 text-xs text-cyber-neon-green font-mono">
              <span className="h-2 w-2 bg-cyber-neon-green rounded-full animate-pulse"></span>
              <span>LIVE</span>
            </div>
          </div>

          <div className="space-y-3">
            {sortedTeams.map((team, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const teamDisplay = team.teamNumber ? `#${team.teamNumber} ${team.name}` : team.name;

              return (
                <div
                  key={team.id}
                  className={`bg-cyber-bg-darker border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${getRankBg(rank)}`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyber-bg-card">
                      {isTopThree ? (
                        getRankIcon(rank)
                      ) : (
                        <span className="text-cyber-text-secondary font-bold text-lg">#{rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className={`font-bold text-lg truncate ${
                          isTopThree ? 'text-cyber-neon-yellow' : 'text-cyber-text-primary'
                        }`}>
                          {teamDisplay}
                        </div>
                        {isTopThree && (
                          <span className="px-2 py-0.5 bg-cyber-neon-yellow/20 text-cyber-neon-yellow rounded text-xs font-bold whitespace-nowrap">
                            TOP {rank}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-cyber-text-secondary">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-cyber-neon-green" />
                          {team.levelsCompleted || 0} missions
                        </span>
                        {team.status && (
                          <span className={`capitalize ${
                            team.status === 'solving' ? 'text-cyber-neon-green' :
                            team.status === 'at_location' ? 'text-cyber-neon-blue' :
                            team.status === 'moving' ? 'text-cyber-neon-purple' :
                            'text-cyber-text-secondary'
                          }`}>
                            {team.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <div className="text-xs text-cyber-text-secondary uppercase">Score</div>
                      <div className={`text-2xl font-bold font-cyber ${
                        isTopThree ? 'text-cyber-neon-yellow' : 'text-cyber-text-primary'
                      }`}>
                        {(team.score || 0).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/captain/team/${team.id}`)}
                      className="p-3 bg-cyber-neon-blue/20 text-cyber-neon-blue rounded-lg hover:bg-cyber-neon-blue/30 transition-all"
                      title="View Team Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedTeams.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-cyber-text-secondary/30 mx-auto mb-4" />
                <p className="text-cyber-text-secondary">No teams in this group yet</p>
              </div>
            )}
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

