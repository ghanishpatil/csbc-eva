import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { captainApiClient, GroupOverview } from '@/captain/api/captainApi';
import { Users, Eye, Grid3x3 } from 'lucide-react';
import { TeamPerformanceCard } from '@/captain/components/TeamPerformanceCard';
import toast from 'react-hot-toast';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const TeamsPerformance: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupOverview | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadGroupData();
  }, []);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const data = await captainApiClient.getGroupOverview();
      setGroupData(data);
      setGroupId(data.groupId);
    } catch (error: any) {
      console.error('Error loading group data:', error);
      toast.error(error.response?.data?.error || 'Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates for teams in this group
  useEffect(() => {
    if (!groupId) return;

    const q = query(collection(db, 'teams'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GroupOverview['teams'];

      setGroupData((prev) =>
        prev
          ? {
              ...prev,
              teams,
              stats: {
                ...prev.stats,
                totalTeams: teams.length,
                totalScore: teams.reduce((sum, team: any) => sum + (team.score || 0), 0),
              },
            }
          : prev
      );
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) {
    return (
      <Layout>
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
          <div className="text-center py-8">
            <p className="text-cyber-text-secondary">No teams found.</p>
          </div>
        </CyberCard>
      </Layout>
    );
  }

  const { teams } = groupData;
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));
  const avgScore = sortedTeams.length > 0
    ? sortedTeams.reduce((sum, t) => sum + (t.score || 0), 0) / sortedTeams.length
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={Users}
          title="Teams Performance"
          subtitle={`Monitoring ${teams.length} teams in your group`}
        />

        {/* Performance Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTeams.map((team, index) => (
            <TeamPerformanceCard
              key={team.id}
              team={team}
              rank={index + 1}
              avgScore={avgScore}
              onClick={() => navigate(`/captain/team/${team.id}`)}
            />
          ))}
        </div>

        {/* Performance Table View */}
        <CyberCard>
          <SectionTitle icon={Grid3x3} title="Detailed Performance Table" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Rank</th>
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Team</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Score</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Levels</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Hints Used</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Efficiency</th>
                  <th className="text-center py-3 px-4 text-cyber-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => {
                  const efficiency = team.levelsCompleted > 0
                    ? Math.round((team.score || 0) / team.levelsCompleted)
                    : 0;
                  return (
                    <tr
                      key={team.id}
                      className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                          index < 3 ? 'bg-cyber-neon-yellow/20 text-cyber-neon-yellow' : 'bg-cyber-border text-cyber-text-secondary'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-cyber-text-primary font-medium">{team.name}</div>
                          <div className="text-xs text-cyber-text-secondary">{team.id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-cyber-neon-yellow font-bold">{team.score || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-cyber-text-primary">
                        {team.levelsCompleted || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-cyber-text-primary">
                        {team.hintsUsed ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-cyber-neon-green">{efficiency}</span>
                        <span className="text-xs text-cyber-text-secondary ml-1">pts/level</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/captain/team/${team.id}`)}
                          className="p-2 bg-cyber-neon-blue/20 text-cyber-neon-blue rounded-lg hover:bg-cyber-neon-blue/30 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

