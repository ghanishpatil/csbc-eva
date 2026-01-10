import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GroupOverview, captainApiClient } from '@/captain/api/captainApi';
import { Target, Trophy, Activity, Users, TrendingUp, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Heatmap } from '@/captain/components/Heatmap';
import { SuspiciousActivityDetector } from '@/captain/components/SuspiciousActivityDetector';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupOverview | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);

  // Initial load via backend (same as other captain tabs)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await captainApiClient.getGroupOverview();
        setGroupData(data);
        setGroupId(data.groupId);
      } catch (error: any) {
        console.error('Error loading captain group overview:', error);
        toast.error(error.response?.data?.error || 'Failed to load group overview');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Real-time listener for group, teams, levels, and submissions
  useEffect(() => {
    if (!groupId) return;

    let groupName = '';
    const unsubscribers: (() => void)[] = [];
    const stateRef = { teams: [] as any[], levels: [] as any[], submissions: [] as any[] };

    // Helper function to recalculate solveMatrix
    const recalculateSolveMatrix = (teams: any[], levels: any[], submissions: any[]) => {
      return teams.map((team) => {
        const teamSubmissions = submissions.filter(
          (s: any) => s.teamId === team.id && s.status === 'correct'
        );
        return levels.map((level: any) => {
          const solved = teamSubmissions.some((s: any) => s.levelId === level.id);
          return solved ? 1 : 0;
        });
      });
    };

    // Listen to group data
    const groupUnsub = onSnapshot(doc(db, 'groups', groupId), (doc) => {
      if (doc.exists()) {
        groupName = doc.data().name || 'Unknown Group';
        setGroupData((prev) => prev ? { ...prev, groupName } : prev);
      }
    });
    unsubscribers.push(groupUnsub);

    // Listen to teams in this group
    const teamsUnsub = onSnapshot(
      query(collection(db, 'teams'), where('groupId', '==', groupId)),
      (snapshot) => {
        const teams = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        stateRef.teams = teams;

        // Calculate stats
        const totalScore = teams.reduce((acc, t: any) => acc + (t.score || 0), 0);
        const solves = teams.reduce((acc, t: any) => acc + (t.levelsCompleted || 0), 0);
        const hintsUsed = teams.reduce((acc, t: any) => acc + (t.hintsUsed || 0), 0);

        setGroupData((prev) => {
          const levels = prev?.levels || stateRef.levels;
          const submissions = stateRef.submissions;
          const solveMatrix = recalculateSolveMatrix(teams, levels, submissions);
          
          return {
            ...prev,
            groupId,
            groupName: groupName || prev?.groupName || 'Group',
            teams: teams as any[],
            levels,
            solveMatrix,
            stats: {
              totalTeams: teams.length,
              totalScore,
              solves,
              hintsUsed,
              totalLevels: levels.length,
            },
          };
        });
        setLoading(false);
      }
    );
    unsubscribers.push(teamsUnsub);

    // Listen to levels for this group
    const levelsUnsub = onSnapshot(
      query(collection(db, 'levels'), where('groupId', '==', groupId), orderBy('number', 'asc')),
      (snapshot) => {
        const levels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        stateRef.levels = levels;

        setGroupData((prev) => {
          if (!prev) return prev;
          const teams = prev.teams || stateRef.teams;
          const submissions = stateRef.submissions;
          const solveMatrix = recalculateSolveMatrix(teams, levels, submissions);
          
          return {
            ...prev,
            levels: levels as any[],
            solveMatrix,
            stats: {
              ...prev.stats,
              totalLevels: levels.length,
            },
          };
        });
      }
    );
    unsubscribers.push(levelsUnsub);

    // Listen to all submissions for real-time heatmap updates
    const allSubmissionsUnsub = onSnapshot(
      query(collection(db, 'submissions'), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        const allSubmissions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Filter submissions for teams in this group and correct status only
        const groupSubmissions = allSubmissions.filter(
          (s: any) => s.status === 'correct' && stateRef.teams.length > 0 && stateRef.teams.some(t => t.id === s.teamId)
        );
        
        stateRef.submissions = groupSubmissions;
        setLogs(allSubmissions.slice(0, 200));

        // Recalculate solveMatrix in real-time when submissions change
        // Only recalculate if we have both teams and levels
        setGroupData((prev) => {
          if (!prev) return prev;
          const teams = prev.teams || stateRef.teams;
          const levels = prev.levels || stateRef.levels;
          
          // Only calculate if we have both teams and levels
          if (teams.length === 0 || levels.length === 0) {
            return prev;
          }
          
          const solveMatrix = recalculateSolveMatrix(teams, levels, groupSubmissions);
          
          return {
            ...prev,
            solveMatrix,
          };
        });
      }
    );
    unsubscribers.push(allSubmissionsUnsub);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [groupId]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out. Please log back in to refresh your session.');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

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
            <AlertCircle className="h-12 w-12 text-cyber-neon-red mx-auto mb-4" />
            <p className="text-cyber-text-secondary mb-4">No group assigned. Please contact an administrator.</p>
            <p className="text-cyber-text-secondary text-sm mb-4">If you were just assigned to a group:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={handleRetry}
                className="flex items-center space-x-2 px-6 py-3 bg-cyber-neon-blue text-dark-900 font-cyber font-bold hover:bg-cyber-neon-blue/80 transition-all rounded-lg"
              >
                <RefreshCw className="h-4 w-4" />
                <span>RETRY</span>
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-cyber-bg-darker border border-cyber-border text-cyber-text-primary font-cyber font-bold hover:bg-cyber-bg-darker/80 transition-all rounded-lg"
              >
                <RefreshCw className="h-4 w-4" />
                <span>REFRESH PAGE</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-cyber-neon-red/20 border border-cyber-neon-red text-cyber-neon-red font-cyber font-bold hover:bg-cyber-neon-red/30 transition-all rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span>LOG OUT & BACK IN</span>
              </button>
            </div>
            {retryCount > 0 && (
              <p className="text-cyber-text-secondary text-xs mt-4">
                Retried {retryCount} time{retryCount > 1 ? 's' : ''}. If this persists, log out and back in.
              </p>
            )}
          </div>
        </CyberCard>
      </Layout>
    );
  }

  const { groupName, teams, stats } = groupData;

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={Target}
          title={`${groupName} — Supervisor Panel`}
          subtitle="Real-time team monitoring"
          status={{ label: 'LIVE', value: 'REAL-TIME', color: 'green' }}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Teams"
            value={stats.totalTeams}
            color="blue"
            subtitle={`${groupName}`}
          />
          <StatCard
            icon={Trophy}
            label="Total Score"
            value={stats.totalScore.toLocaleString()}
            color="yellow"
            subtitle="Cumulative"
          />
          <StatCard
            icon={Target}
            label="Total Solves"
            value={stats.solves}
            color="green"
            subtitle={`${stats.totalLevels} levels available`}
          />
          <StatCard
            icon={Activity}
            label="Hints Used"
            value={stats.hintsUsed}
            color="purple"
            subtitle="Across all teams"
          />
        </div>

        {/* Group Overview */}
        <CyberCard>
          <SectionTitle icon={TrendingUp} title="Group Performance Overview" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-sm text-cyber-text-secondary mb-2">Average Score per Team</div>
              <div className="text-2xl font-bold text-cyber-neon-yellow">
                {stats.totalTeams > 0 ? Math.round(stats.totalScore / stats.totalTeams) : 0}
              </div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-sm text-cyber-text-secondary mb-2">Solve Rate</div>
              <div className="text-2xl font-bold text-cyber-neon-green">
                {stats.totalLevels > 0 && stats.totalTeams > 0
                  ? Math.round((stats.solves / (stats.totalLevels * stats.totalTeams)) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </CyberCard>

        {/* Solve Heatmap */}
        <Heatmap groupData={groupData} />

        {/* Suspicious Activity Detector */}
        <SuspiciousActivityDetector logs={logs} teams={teams} />

        {/* Quick Team Stats */}
        <CyberCard>
          <SectionTitle icon={Users} title="Teams Summary" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Team</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Score</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Levels</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Hints Used</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.slice(0, 10).map((team) => (
                  <tr key={team.id} className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker/50">
                    <td className="py-3 px-4 text-cyber-text-primary font-medium">{team.name}</td>
                    <td className="py-3 px-4 text-right text-cyber-neon-yellow font-bold">{team.score || 0}</td>
                    <td className="py-3 px-4 text-right text-cyber-text-primary">{team.levelsCompleted || 0}</td>
                    <td className="py-3 px-4 text-right text-cyber-text-primary">{team.hintsUsed ?? 0}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (team.levelsCompleted || 0) > 0
                          ? 'bg-cyber-neon-green/20 text-cyber-neon-green'
                          : 'bg-cyber-border text-cyber-text-secondary'
                      }`}>
                        {(team.levelsCompleted || 0) > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};
