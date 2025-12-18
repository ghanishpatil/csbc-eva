import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { captainApiClient, TeamDetail } from '@/captain/api/captainApi';
import { Users, Trophy, Target, Clock, AlertTriangle, TrendingUp, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamDetail | null>(null);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const data = await captainApiClient.getTeamDetail(teamId);
      setTeamData(data);
    } catch (error: any) {
      console.error('Error loading team data:', error);
      toast.error(error.response?.data?.error || 'Failed to load team data');
      if (error.response?.status === 403) {
        navigate('/captain/teams');
      }
    } finally {
      setLoading(false);
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

  if (!teamData) {
    return (
      <Layout>
        <CaptainNavbar />
        <CyberCard>
          <div className="text-center py-8">
            <p className="text-cyber-text-secondary">Team not found.</p>
          </div>
        </CyberCard>
      </Layout>
    );
  }

  const { teamName, score, levelsCompleted, solvedLevels, attempts, metrics } = teamData;

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <div className="flex items-center justify-between">
          <PageHeader
            icon={Users}
            title={teamName}
            subtitle="Detailed team performance metrics"
          />
          <button
            onClick={() => navigate('/captain/teams')}
            className="flex items-center space-x-2 px-4 py-2 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary hover:bg-cyber-bg-darker transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Teams</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CyberCard>
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-cyber-neon-yellow" />
              <div>
                <div className="text-sm text-cyber-text-secondary">Total Score</div>
                <div className="text-2xl font-bold text-cyber-neon-yellow">{score}</div>
              </div>
            </div>
          </CyberCard>
          <CyberCard>
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-cyber-neon-green" />
              <div>
                <div className="text-sm text-cyber-text-secondary">Levels Completed</div>
                <div className="text-2xl font-bold text-cyber-neon-green">{levelsCompleted}</div>
              </div>
            </div>
          </CyberCard>
          <CyberCard>
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-cyber-neon-blue" />
              <div>
                <div className="text-sm text-cyber-text-secondary">Avg Solve Time</div>
                <div className="text-2xl font-bold text-cyber-neon-blue">{metrics.avgSolveTime}s</div>
              </div>
            </div>
          </CyberCard>
          <CyberCard>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-cyber-neon-purple" />
              <div>
                <div className="text-sm text-cyber-text-secondary">Solve Rate</div>
                <div className="text-2xl font-bold text-cyber-neon-purple">{metrics.solveRate}%</div>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* Solved Levels Timeline */}
        <CyberCard>
          <SectionTitle icon={Target} title="Solved Levels Timeline" />
          <div className="mt-4 space-y-3">
            {solvedLevels.length > 0 ? (
              solvedLevels.map((solve, index) => (
                <div
                  key={index}
                  className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-cyber-neon-green/20 text-cyber-neon-green flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-cyber-text-primary font-medium">Level {solve.levelId}</div>
                      <div className="text-xs text-cyber-text-secondary">
                        {new Date(solve.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-cyber-text-secondary">Score</div>
                      <div className="text-cyber-neon-yellow font-bold">+{solve.scoreAwarded}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-cyber-text-secondary">Time</div>
                      <div className="text-cyber-neon-blue">{solve.timeTaken}s</div>
                    </div>
                    {solve.hintsUsed > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-cyber-text-secondary">Hints</div>
                        <div className="text-cyber-neon-red">{solve.hintsUsed}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-cyber-text-secondary">No levels solved yet</div>
            )}
          </div>
        </CyberCard>

        {/* Wrong Attempts */}
        {attempts.length > 0 && (
          <CyberCard>
            <SectionTitle icon={AlertTriangle} title="Wrong Attempts" />
            <div className="mt-4 space-y-2">
              {attempts.map((attempt, index) => (
                <div
                  key={index}
                  className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-cyber-text-primary">Level {attempt.levelId}</div>
                    <div className="text-xs text-cyber-text-secondary">
                      {new Date(attempt.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-cyber-text-secondary font-mono text-sm">{attempt.flagPrefix}</div>
                </div>
              ))}
            </div>
          </CyberCard>
        )}

        {/* Metrics Summary */}
        <CyberCard>
          <SectionTitle icon={TrendingUp} title="Performance Metrics" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-sm text-cyber-text-secondary mb-2">Total Hints Used</div>
              <div className="text-2xl font-bold text-cyber-neon-red">{metrics.totalHintsUsed}</div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-sm text-cyber-text-secondary mb-2">Total Attempts</div>
              <div className="text-2xl font-bold text-cyber-text-primary">{metrics.totalAttempts}</div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="text-sm text-cyber-text-secondary mb-2">Solve Rate</div>
              <div className="text-2xl font-bold text-cyber-neon-green">{metrics.solveRate}%</div>
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

